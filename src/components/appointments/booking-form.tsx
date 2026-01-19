'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, Scissors, Star, Check, Loader2, Search } from 'lucide-react';
import { format, addMinutes, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import type { Service, Barber, AppUser, Appointment } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '../ui/card';
import { useCollection, useFirebase, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../auth-provider';
import { Skeleton } from '../ui/skeleton';
import { SeedServices } from '../admin/seed-services';
import useSound from '@/hooks/use-sound';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const bookingFormSchema = (isAdminOrStaff: boolean) => z.object({
  services: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one service.',
  }),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string({ required_error: 'Please select a time.' }),
  barberId: z.string().optional(),
  notes: z.string().optional(),
  customerType: z.enum(['registered', 'walk-in']).default('registered'),
  customerId: z.string().optional(),
  walkInName: z.string().optional(),
}).superRefine((data, ctx) => {
    if (isAdminOrStaff) {
        if (data.customerType === 'registered' && !data.customerId) {
            ctx.addIssue({
                path: ['customerId'],
                message: 'Please select a registered customer.',
            });
        }
        if (data.customerType === 'walk-in') {
            if (!data.walkInName || data.walkInName.length < 2) {
                 ctx.addIssue({
                    path: ['walkInName'],
                    message: 'Name must be at least 2 characters.',
                });
            }
        }
    }
});

// 9am to 6pm in 30 minute intervals
const allTimeSlots = Array.from({ length: 18 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9;
  const minute = i % 2 === 0 ? '00' : '30';
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute} ${period}`;
});

interface BookingFormProps {
  showPackagesOnly?: boolean;
}

export default function BookingForm({ showPackagesOnly = false }: BookingFormProps) {
  const { user } = useAuth();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const playSound = useSound();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dailyBookings, setDailyBookings] = useState<Appointment[]>([]);
  const [areSlotsLoading, setAreSlotsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';
  
  const usersCollectionRef = useMemoFirebase(
    () => (isAdminOrStaff && firestore ? collection(firestore, 'users') : null),
    [firestore, isAdminOrStaff]
  );
  const { data: usersData, isLoading: usersLoading } = useCollection<AppUser>(usersCollectionRef);

  const servicesCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'services') : null, [firestore]);
  const { data: servicesData, isLoading: servicesLoading, refetch: refetchServices } = useCollection<Service>(servicesCollectionRef);

  const barbersCollectionRef = useMemoFirebase(() => firestore ? collection(firestore, 'barbers') : null, [firestore]);
  const { data: barbersData, isLoading: barbersLoading } = useCollection<Barber>(barbersCollectionRef);

  const formSchema = bookingFormSchema(isAdminOrStaff);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      services: [],
      notes: '',
      barberId: 'any',
      customerType: 'registered',
      customerId: isAdminOrStaff ? undefined : user?.uid,
      walkInName: '',
    },
  });

  const watchedDate = form.watch('date');
  const watchedServices = form.watch('services');
  const watchedCustomerType = form.watch('customerType');

  useEffect(() => {
    if (!watchedDate || !firestore) return;
    const fetchBookings = async () => {
      setAreSlotsLoading(true);
      form.setValue('time', '');
      try {
        const q = query(
            collection(firestore, 'appointments'), 
            where('date', '==', format(watchedDate, 'PPP')),
            where('status', 'in', ['confirmed', 'pending'])
        );
        const snapshot = await getDocs(q);
        const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        setDailyBookings(bookings);
      } catch (error) {
        console.error("Failed to fetch bookings for date:", error);
        toast({
          variant: 'destructive',
          title: 'Error fetching schedule',
          description: 'Could not load existing appointments. Please try again.'
        });
      } finally {
        setAreSlotsLoading(false);
      }
    }
    fetchBookings();
  }, [watchedDate, firestore, toast, form]);

  const allServices = useMemo(() => servicesData?.filter(s => s.enabled) || [], [servicesData]);
  const packages = useMemo(() => allServices.filter(s => s.isPackage), [allServices]);
  const regularServices = useMemo(() => allServices.filter(s => !s.isPackage), [allServices]);

  const itemsToDisplay = showPackagesOnly ? packages : regularServices;

  const filteredItemsToDisplay = useMemo(() => {
      if (!searchTerm) return itemsToDisplay;
      return itemsToDisplay.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [itemsToDisplay, searchTerm]);

  const availableTimeSlots = useMemo(() => {
    if (!watchedDate) return [];

    const selectedServices = allServices.filter(s => watchedServices.includes(s.id));
    const totalDuration = selectedServices.reduce((total, s) => total + s.duration, 0);

    if (!totalDuration) return allTimeSlots;

    const bookedIntervals = dailyBookings.map(booking => {
      try {
        const startDate = parse(`${booking.date} ${booking.time}`, 'PPP h:mm a', new Date());
        const endDate = addMinutes(startDate, booking.totalDuration);
        return { start: startDate, end: endDate };
      } catch {
        return null;
      }
    }).filter(Boolean) as { start: Date, end: Date }[];
    
    const dateStr = format(watchedDate, 'PPP');
    const shopCloseTime = parse(`${dateStr} 6:00 PM`, 'PPP h:mm a', new Date());

    return allTimeSlots.filter(slot => {
        try {
          const slotStartTime = parse(`${dateStr} ${slot}`, 'PPP h:mm a', new Date());
          const slotEndTime = addMinutes(slotStartTime, totalDuration);

          if (slotEndTime > shopCloseTime) return false;

          for (const interval of bookedIntervals) {
              if (slotStartTime < interval.end && slotEndTime > interval.start) {
                  return false;
              }
          }
          return true;
        } catch {
          return false;
        }
    });
  }, [dailyBookings, watchedServices, watchedDate, allServices]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    playSound('click');
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
      return;
    }

    setIsSubmitting(true);

    let bookingClientId: string;
    let bookingClientName: string | null;
    let appointmentStatus: Appointment['status'] = 'pending';
    let toastTitle = 'Appointment Request Sent!';
    let toastDescription = `Your request for ${format(values.date, 'PPP')} at ${values.time} is pending approval.`;

    if (isAdminOrStaff) {
        appointmentStatus = 'confirmed';
        toastTitle = 'Appointment Created!';
        toastDescription = `An appointment for ${format(values.date, 'PPP')} at ${values.time} has been successfully booked.`;
        if (values.customerType === 'walk-in') {
            bookingClientId = 'walk-in';
            bookingClientName = values.walkInName || 'Walk-in Client';
        } else { // 'registered'
            const selectedCustomer = usersData?.find(u => u.uid === values.customerId);
            if (!selectedCustomer) {
                toast({ variant: 'destructive', title: 'Error', description: 'Selected customer not found.' });
                setIsSubmitting(false);
                return;
            }
            bookingClientId = selectedCustomer.uid;
            bookingClientName = selectedCustomer.name || selectedCustomer.email;
            toastDescription = `An appointment for ${bookingClientName} on ${format(values.date, 'PPP')} at ${values.time} has been booked.`;
        }
    } else if (user) {
        bookingClientId = user.uid;
        bookingClientName = user.name || user.email;
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to book an appointment.' });
        setIsSubmitting(false);
        return;
    }

    const selectedServices = allServices.filter(s => values.services.includes(s.id));
    const totalPrice = selectedServices.reduce((total, s) => total + s.price, 0);
    const totalDuration = selectedServices.reduce((total, s) => total + s.duration, 0);
    
    const appointmentData = {
      clientId: bookingClientId,
      clientName: bookingClientName,
      services: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),
      totalPrice,
      totalDuration,
      date: format(values.date, 'PPP'),
      time: values.time,
      barberId: values.barberId === 'any' ? null : values.barberId,
      notes: values.notes || '',
      status: appointmentStatus,
      paymentStatus: 'unpaid',
      createdAt: serverTimestamp(),
      bookedBy: isAdminOrStaff ? (user?.name || user?.email) : undefined,
    };

    const appointmentsCollection = collection(firestore, 'appointments');
    addDocumentNonBlocking(appointmentsCollection, appointmentData)
        .then(() => {
            toast({
                title: toastTitle,
                description: toastDescription,
            });
            form.reset({ 
                services: [], 
                notes: '', 
                barberId: 'any',
                customerType: 'registered',
                customerId: isAdminOrStaff ? undefined : user?.uid, 
                walkInName: '', 
            });
            setDailyBookings(prev => [...prev, appointmentData as Appointment]);
        })
        .catch(() => {
            toast({
                variant: 'destructive',
                title: 'Booking Failed',
                description: 'Could not save the appointment. Please try again.',
            });
        })
        .finally(() => {
            setIsSubmitting(false);
        });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {isAdminOrStaff && (
            <div className='space-y-8 rounded-lg border p-4'>
                <FormField
                    control={form.control}
                    name="customerType"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Customer Type</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                                >
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                    <RadioGroupItem value="registered" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Registered Customer</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2">
                                    <FormControl>
                                    <RadioGroupItem value="walk-in" />
                                    </FormControl>
                                    <FormLabel className="font-normal">Walk-in Client</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                {watchedCustomerType === 'registered' ? (
                     <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Customer</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a registered customer" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {usersLoading && <SelectItem value="loading" disabled>Loading customers...</SelectItem>}
                                {usersData?.map((customer) => (
                                <SelectItem key={customer.uid} value={customer.uid}>
                                    {customer.name} ({customer.email})
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                ) : (
                    <FormField
                        control={form.control}
                        name="walkInName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Walk-in Client Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter client's full name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
            </div>
        )}
         <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">{showPackagesOnly ? 'Our Packages' : 'Services'}</FormLabel>
                <FormDescription>
                   {showPackagesOnly ? 'Select a package.' : 'Select one or more services.'}
                </FormDescription>
              </div>

               {itemsToDisplay.length > 0 && (
                 <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={`Search for ${showPackagesOnly ? 'packages' : 'services'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
               )}

                {servicesLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                  </div>
                ) : itemsToDisplay.length > 0 ? (
                    filteredItemsToDisplay.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredItemsToDisplay.map((item) => {
                                const isSelected = field.value?.includes(item.id);
                                return (
                                    <ServiceCard
                                    key={item.id}
                                    service={item}
                                    isSelected={isSelected}
                                    onSelect={() => {
                                        let newValue;
                                        if (showPackagesOnly) {
                                        newValue = isSelected ? [] : [item.id];
                                        } else {
                                        newValue = isSelected
                                            ? field.value?.filter((id) => id !== item.id)
                                            : [...(field.value || []), item.id];
                                        }
                                        field.onChange(newValue);
                                    }}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground mt-4">No results found for "{searchTerm}".</p>
                    )
                ) : (
                  <div>
                    {user?.role === 'admin' ? (
                        <SeedServices onSeed={refetchServices} />
                    ) : (
                        <p className="text-center text-muted-foreground mt-4">No {showPackagesOnly ? 'packages' : 'services'} available at the moment.</p>
                    )}
                  </div>
                )}
              <FormMessage />
            </FormItem>
           )}
          />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date(new Date().toDateString())}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={areSlotsLoading || !watchedDate || availableTimeSlots.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      {areSlotsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <SelectValue placeholder={
                        !watchedDate 
                          ? "Select a date first" 
                          : areSlotsLoading 
                          ? "Loading slots..." 
                          : "Select a time"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableTimeSlots.length > 0 ? (
                      availableTimeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-slots" disabled>
                        No available slots for this day.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="barberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barber (Optional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a barber" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="any">Any Barber</SelectItem>
                   {barbersLoading && <SelectItem value="loading" disabled>Loading barbers...</SelectItem>}
                  {barbersData?.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes for the Barber (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any specific requests or instructions?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting Request...' : 'Book Appointment'}
        </Button>
      </form>
    </Form>
  );
}

interface ServiceCardProps {
    service: Service;
    isSelected: boolean;
    onSelect: () => void;
}

function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
    return (
        <Card 
            className={cn(
                "cursor-pointer transition-all duration-200 hover:animate-shake h-full flex flex-col",
                isSelected ? "ring-2 ring-primary border-primary" : "hover:shadow-md"
            )}
            onClick={onSelect}
        >
            <CardContent className="p-4 relative flex-1 flex flex-col">
                 {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                    </div>
                )}
                <div className="flex flex-col items-center text-center gap-2 flex-1">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                        {service.isPackage ? <Star className="h-6 w-6" /> : <Scissors className="h-6 w-6" />}
                    </div>
                    <p className="font-semibold text-sm leading-tight">{service.name}</p>
                    {service.description && (
                        <p className="text-xs text-muted-foreground">{service.description}</p>
                    )}
                </div>
                <div className="mt-auto pt-2 text-center">
                   <p className="text-sm text-muted-foreground font-bold">PKR {service.price.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    )
}
