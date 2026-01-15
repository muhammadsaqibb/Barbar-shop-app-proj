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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon, Scissors, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Appointment, Service, Barber } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '../ui/card';
import { useCollection, useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  services: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one service.',
  }),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string({ required_error: 'Please select a time.' }),
  barberId: z.string().optional(),
  notes: z.string().optional(),
});

const timeSlots = Array.from({ length: 18 }, (_, i) => {
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
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const servicesCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'services') : null),
    [firestore]
  );
  const barbersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'barbers') : null),
    [firestore]
  );

  const { data: servicesData, loading: servicesLoading, error: servicesError } = useCollection<Service>(servicesCollectionRef);
  const { data: barbersData, loading: barbersLoading, error: barbersError } = useCollection<Barber>(barbersCollectionRef);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      services: [],
      notes: '',
      barberId: 'any',
    }
  });

  const allServices = servicesData || [];
  const packages = allServices.filter(s => s.isPackage);
  const services = allServices.filter(s => !s.isPackage);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.uid || !firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to book an appointment.' });
      return;
    }

    setLoading(true);

    const selectedServices = allServices.filter(s => values.services.includes(s.id));
    if (selectedServices.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one service.' });
      setLoading(false);
      return;
    }
    
    const totalPrice = selectedServices.reduce((total, s) => total + s.price, 0);
    const totalDuration = selectedServices.reduce((total, s) => total + s.duration, 0);

    const appointmentsCollection = collection(firestore, 'appointments');

    addDocumentNonBlocking(appointmentsCollection, {
      clientId: user.uid,
      clientName: user.displayName || user.email,
      services: selectedServices.map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),
      totalPrice,
      totalDuration,
      date: format(values.date, 'PPP'),
      time: values.time,
      barberId: values.barberId === 'any' ? null : values.barberId,
      notes: values.notes || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    toast({
      title: 'Appointment Booked!',
      description: `Your appointment is scheduled for ${format(values.date, 'PPP')} at ${values.time}.`,
    });
    form.reset();
    setLoading(false);
  }

  const itemsToDisplay = showPackagesOnly ? packages : services;

  if (servicesLoading) {
    return <p>Loading services...</p>;
  }

  if (servicesError) {
    return <p className="text-destructive">Error loading services: {servicesError.message}</p>;
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">{showPackagesOnly ? 'Our Packages' : 'Services'}</FormLabel>
                <FormDescription>
                  Select one or more {showPackagesOnly ? 'packages' : 'services'}.
                </FormDescription>
              </div>
              
              {itemsToDisplay.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {itemsToDisplay.map((item) => (
                      <FormField
                          key={item.id}
                          control={form.control}
                          name="services"
                          render={({ field }) => {
                              return (
                                  <FormItem>
                                      <FormControl>
                                           <ServiceCard
                                              service={item}
                                              isSelected={field.value?.includes(item.id) || false}
                                              onSelect={(checked) => {
                                                  const currentValue = field.value || [];
                                                  const newValue = checked
                                                  ? [...currentValue, item.id]
                                                  : currentValue.filter((value) => value !== item.id);
                                                  field.onChange(newValue);
                                              }}
                                          />
                                      </FormControl>
                                  </FormItem>
                              )
                          }}
                      />
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground mt-4">No {showPackagesOnly ? 'packages' : 'services'} available at the moment.</p>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
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
                  {barbersLoading && <SelectItem value="loading" disabled>Loading...</SelectItem>}
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

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Booking...' : 'Book Appointment'}
        </Button>
      </form>
    </Form>
  );
}

interface ServiceCardProps {
    service: Service;
    isSelected: boolean;
    onSelect: (checked: boolean) => void;
}

function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
    return (
        <Card 
            className={cn(
                "cursor-pointer transition-all duration-200 hover:animate-shake h-full flex flex-col",
                isSelected ? "ring-2 ring-primary border-primary" : "hover:shadow-md"
            )}
            onClick={() => onSelect(!isSelected)}
        >
            <CardContent className="p-4 relative flex-1 flex flex-col">
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
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={onSelect}
                    className="absolute top-2 right-2"
                    aria-label={`Select ${service.name}`}
                />
            </CardContent>
        </Card>
    )
}
