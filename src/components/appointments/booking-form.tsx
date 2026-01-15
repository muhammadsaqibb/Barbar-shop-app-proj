"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Appointment } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const services = [
  { id: 'classic-haircut', name: 'Classic Haircut', price: 2500 },
  { id: 'beard-trim', name: 'Beard Trim & Shape-Up', price: 1500 },
  { id: 'hot-towel-shave', name: 'Hot Towel Shave', price: 2000 },
  { id: 'haircut-shave-combo', name: 'Haircut & Shave Combo', price: 4000 },
  { id: 'kids-cut', name: 'Kids Cut', price: 1800 },
];

const timeSlots = Array.from({ length: 18 }, (_, i) => {
  const hour = Math.floor(i / 2) + 9; // Barbershops often open a bit later
  const minute = i % 2 === 0 ? '00' : '30';
  const period = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute} ${period}`;
});

const formSchema = z.object({
  services: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one service.',
  }),
  date: z.date({ required_error: 'A date is required.' }),
  time: z.string({ required_error: 'Please select a time.' }),
});

export default function BookingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      services: [],
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !user.name) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to book an appointment.' });
      return;
    }
    setLoading(true);
    try {
      const storedAppointments = localStorage.getItem('appointments');
      const appointments: Appointment[] = storedAppointments ? JSON.parse(storedAppointments) : [];
      
      const selectedServices = services.filter(s => values.services.includes(s.id));
      const totalPrice = selectedServices.reduce((total, s) => total + s.price, 0);
      const serviceNames = selectedServices.map(s => s.name).join(', ');

      if (selectedServices.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one service.' });
        setLoading(false);
        return;
      }
      
      const newAppointment: Appointment = {
        id: new Date().toISOString(),
        clientId: user.uid,
        clientName: user.name,
        service: serviceNames,
        price: totalPrice,
        date: format(values.date, 'PPP'),
        time: values.time,
        status: 'pending',
        createdAt: new Date().getTime(),
      };

      appointments.push(newAppointment);
      localStorage.setItem('appointments', JSON.stringify(appointments));

      toast({
        title: 'Appointment Booked!',
        description: `Your appointment for ${serviceNames} is scheduled for ${format(values.date, 'PPP')} at ${values.time}.`,
      });
      form.reset();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Booking Failed', description: 'Could not book appointment. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="services"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Services</FormLabel>
                <FormDescription>
                  Select one or more services.
                </FormDescription>
              </div>
              <div className="space-y-3">
                {services.map((item) => (
                  <FormField
                    key={item.id}
                    control={form.control}
                    name="services"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item.id}
                          className="flex flex-row items-center justify-between rounded-lg border p-4"
                        >
                          <div className='space-y-0.5'>
                            <FormLabel className="text-sm font-medium">
                              {item.name}
                            </FormLabel>
                            <FormDescription>
                              PKR {item.price.toLocaleString()}
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item.id)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...(field.value || []), item.id])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item.id
                                      )
                                    )
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
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
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Booking...' : 'Book Appointment'}
        </Button>
      </form>
    </Form>
  );
}