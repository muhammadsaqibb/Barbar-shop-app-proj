
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
import { CalendarIcon, Scissors, Star, Check, Loader2, Search, Plus, Minus, Wallet } from 'lucide-react';
import { format, addMinutes, parse } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import type { Service, Barber, AppUser, Appointment, ShopSettings } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter } from '../ui/card';
import { useCollection, useFirebase, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, serverTimestamp, query, where, getDocs, doc } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import { useAuth } from '../auth-provider';
import { Skeleton } from '../ui/skeleton';
import { SeedServices } from '../admin/seed-services';
import useSound from '@/hooks/use-sound';
import { Input } from '../ui/input';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const bookingFormSchema = (isAdminOrStaff: boolean) => z.object({
  services: z.record(z.string(), z.number().min(1)).refine((obj) => Object.keys(obj).length > 0, {
      message: 'You have to select at least one service.',
  }),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string({ required_error: 'Please select a time.' }),
  paymentMethod: z.enum(['cash', 'online'], { required_error: 'Please select a payment method.' }),
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

const generateTimeSlots = (openingTime = "09:00", closingTime = "18:00") => {
    const slots = [];
    const [startHour] = openingTime.split(':').map(Number);
    const [endHour] = closingTime.split(':').map(Number);

    for (let i = startHour; i < endHour; i++) {
        slots.push(`${i > 12 ? i - 12 : i === 0 ? 12 : i}:00 ${i < 12 || i === 24 ? 'AM' : 'PM'}`);
        slots.push(`${i > 12 ? i - 12 : i === 0 ? 12 : i}:30 ${i < 12 || i === 24 ? 'AM' : 'PM'}`);
    }
    return slots;
}

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

  const shopSettingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'shopSettings', 'config') : null, [firestore]);
  const { data: shopSettings, isLoading: shopSettingsLoading } = useDoc<ShopSettings>(shopSettingsRef);

  const formSchema = bookingFormSchema(isAdminOrStaff);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      services: {},
      paymentMethod: 'cash',
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

  const allTimeSlots = useMemo(() => {
    if (shopSettingsLoading) return [];
    return generateTimeSlots(shopSettings?.openingTime, shopSettings?.closingTime);
  }, [shopSettings, shopSettingsLoading]);

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

  const totalDuration = useMemo(() => {
    if (!watchedServices || Object.keys(watchedServices).length === 0) return 0;
    return allServices
        .filter(s => watchedServices[s.id])
        .reduce((total, s) => total + (s.duration * (watchedServices[s.id] || 1)), 0);
  }, [watchedServices, allServices]);

  const totalPrice = useMemo(() => {
    if (!watchedServices || Object.keys(watchedServices).length === 0) return 0;
    return allServices
        .filter(s => watchedServices[s.id])
        .reduce((total, s) => total + (s.price * (watchedServices[s.id] || 1)), 0);
  }, [watchedServices, allServices]);

  const availableTimeSlots = useMemo(() => {
    if (!watchedDate || allTimeSlots.length === 0) return [];

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
    
    const [closingHour, closingMinute] = (shopSettings?.closingTime || "18:00").split(':').map(Number);
    const shopCloseTime = parse(`${dateStr} ${closingHour}:${closingMinute}`, 'PPP H:mm', new Date());

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
  }, [dailyBookings, totalDuration, watchedDate, allTimeSlots, shopSettings]);

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

    const selectedServicesDetails = allServices.filter(s => values.services[s.id]);
    const servicesForAppointment = selectedServicesDetails.map(service => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        quantity: values.services[service.id],
    }));

    const finalTotalPrice = servicesForAppointment.reduce((total, s) => total + (s.price * s.quantity), 0);
    const finalTotalDuration = servicesForAppointment.reduce((total, s) => total + (s.duration * s.quantity), 0);
    
    const appointmentData = {
      clientId: bookingClientId,
      clientName: bookingClientName,
      services: servicesForAppointment,
      totalPrice: finalTotalPrice,
      totalDuration: finalTotalDuration,
      date: format(values.date, 'PPP'),
      time: values.time,
      barberId: values.barberId === 'any' ? null : values.barberId,
      notes: values.notes || '',
      status: appointmentStatus,
      paymentMethod: values.paymentMethod,
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
                services: {},
                paymentMethod: 'cash', 
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
                                const quantity = field.value?.[item.id] || 0;
                                const isSelected = quantity > 0;
                                
                                const handleSelect = () => {
                                    let newServices = { ...field.value };
                                    if (showPackagesOnly) {
                                        newServices = {}; 
                                        if (!isSelected) {
                                            newServices[item.id] = 1;
                                        }
                                    } else {
                                        if (isSelected) {
                                            delete newServices[item.id];
                                        } else {
                                            newServices[item.id] = 1;
                                        }
                                    }
                                    field.onChange(newServices);
                                };

                                const handleQuantityChange = (newQuantity: number) => {
                                    const maxQuantity = item.maxQuantity || 10;
                                    if (newQuantity > maxQuantity) {
                                        toast({ variant: 'destructive', title: `You can only book for ${maxQuantity} people at most.`});
                                        return;
                                    };
                                    
                                    const newServices = { ...field.value };
                                    if (newQuantity > 0) {
                                        newServices[item.id] = newQuantity;
                                    } else {
                                        delete newServices[item.id];
                                    }
                                    field.onChange(newServices);
                                };

                                return (
                                    <ServiceCard
                                        key={item.id}
                                        service={item}
                                        isSelected={isSelected}
                                        onSelect={handleSelect}
                                        quantity={quantity}
                                        onQuantityChange={handleQuantityChange}
                                        showPackagesOnly={showPackagesOnly}
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
                <Select onValueChange={field.onChange} value={field.value} disabled={areSlotsLoading || !watchedDate || allTimeSlots.length === 0}>
                  <FormControl>
                    <SelectTrigger>
                      {areSlotsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <SelectValue placeholder={
                        shopSettingsLoading 
                          ? "Loading shop hours..."
                          : !watchedDate 
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
                        {allTimeSlots.length > 0 ? 'No available slots for this day.' : 'Shop is closed on this day.'}
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
        
        <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Payment Method</FormLabel>
                    <FormDescription>
                        Select how you'd like to pay for your appointment.
                    </FormDescription>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4"
                        >
                        <FormItem>
                           <Label className="has-[input:checked]:ring-2 has-[input:checked]:ring-primary has-[input:checked]:border-primary flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <FormControl>
                                <RadioGroupItem value="cash" className="sr-only" />
                            </FormControl>
                            <span className="text-lg font-medium">Pay with Cash</span>
                            <span className="text-xs text-muted-foreground">Pay in person at the shop.</span>
                           </Label>
                        </FormItem>
                        <FormItem>
                            <Label className="has-[input:checked]:ring-2 has-[input:checked]:ring-primary has-[input:checked]:border-primary flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer">
                            <FormControl>
                                <RadioGroupItem value="online" className="sr-only"/>
                            </FormControl>
                            <span className="text-lg font-medium">Pay Online</span>
                            <span className="text-xs text-muted-foreground">Pay now with card (coming soon).</span>
                           </Label>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        {totalPrice > 0 && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6 flex flex-row items-center justify-between space-y-0">
                    <div className="grid gap-1.5">
                        <h3 className="font-semibold tracking-tight">Total Amount</h3>
                        <p className="text-sm text-muted-foreground">Final price for all selected services.</p>
                    </div>
                    <div className="flex items-center gap-2">
                         <Wallet className="h-6 w-6 text-muted-foreground" />
                         <div className="text-2xl font-bold">PKR {totalPrice.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        )}

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
    quantity: number;
    onQuantityChange: (newQuantity: number) => void;
    showPackagesOnly: boolean;
}

function ServiceCard({ service, isSelected, onSelect, quantity, onQuantityChange, showPackagesOnly }: ServiceCardProps) {
    const handleQuantityClick = (e: React.MouseEvent, newQuantity: number) => {
        e.stopPropagation();
        onQuantityChange(newQuantity);
    }
    
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
                 {isSelected && (service.quantityEnabled || showPackagesOnly === false) && !service.isPackage && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={(e) => handleQuantityClick(e, quantity - 1)}>
                            <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-bold w-4 text-center">{quantity}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={(e) => handleQuantityClick(e, quantity + 1)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <div className="mt-auto pt-4 text-center">
                   <p className="text-sm text-muted-foreground font-bold">PKR {service.price.toLocaleString()}</p>
                </div>
            </CardContent>
        </Card>
    )
}
