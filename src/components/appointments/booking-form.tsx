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
import { CalendarIcon, Scissors, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../auth-provider';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Appointment } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';

const services = [
    { id: 'classic-haircut', name: 'Classic Haircut', price: 800 },
    { id: 'skin-fade', name: 'Skin Fade', price: 1000 },
    { id: 'beard-trim', name: 'Beard Trim', price: 400 },
    { id: 'beard-trim-shape', name: 'Beard Trim & Shape', price: 500 },
    { id: 'razor-beard-shave', name: 'Razor Beard Shave', price: 600 },
    { id: 'haircut-beard-trim', name: 'Haircut + Beard Trim', price: 1200 },
    { id: 'haircut-hot-towel-shave', name: 'Haircut + Hot Towel Shave', price: 1500 },
    { id: 'head-shave', name: 'Head Shave', price: 700 },
    { id: 'buzz-cut', name: 'Buzz Cut', price: 600 },
    { id: 'kids-haircut', name: 'Kids Haircut', price: 500 },
    { id: 'senior-citizen-cut', name: 'Senior Citizen Cut', price: 500 },
    { id: 'hot-towel-beard-shave', name: 'Hot Towel Beard Shave', price: 800 },
    { id: 'royal-grooming-package', name: 'Royal Grooming Package', price: 3000 },
    { id: 'luxury-haircut-experience', name: 'Luxury Haircut Experience', price: 2000 },
    { id: 'beard-styling-with-products', name: 'Beard Styling with Products', price: 300 },
    { id: 'steam-facial', name: 'Steam Facial', price: 1200 },
    { id: 'black-mask-facial', name: 'Black Mask Facial', price: 1500 },
    { id: 'hair-wash-blow-dry', name: 'Hair Wash & Blow Dry', price: 500 },
    { id: 'scalp-massage', name: 'Scalp Massage', price: 800 },
    { id: 'anti-dandruff-treatment', name: 'Anti-Dandruff Treatment', price: 1000 },
    { id: 'hair-spa-treatment', name: 'Hair Spa Treatment', price: 1800 },
    { id: 'hair-wash', name: 'Hair Wash', price: 300 },
    { id: 'beard-oil-application', name: 'Beard Oil Application', price: 200 },
    { id: 'face-massage', name: 'Face Massage', price: 700 },
    { id: 'neck-shoulder-massage', name: 'Neck & Shoulder Massage', price: 900 },
    { id: 'styling-gel-wax', name: 'Styling Gel / Wax', price: 150 },
    { id: 'hair-color-touch-up', name: 'Hair Color Touch-Up', price: 1500 },
    { id: 'eyebrow-trimming', name: 'Eyebrow Trimming', price: 200 },
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
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Services</FormLabel>
                <FormDescription>
                  Select one or more services.
                </FormDescription>
              </div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for a service..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredServices.map((item) => (
                    <FormField
                        key={item.id}
                        control={form.control}
                        name="services"
                        render={() => (
                            <FormItem>
                                <FormControl>
                                    <ServiceCard
                                        service={item}
                                        isSelected={field.value?.includes(item.id) || false}
                                        onSelect={(checked) => {
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
                        )}
                    />
                ))}
              </div>
              {filteredServices.length === 0 && (
                <p className="text-center text-muted-foreground mt-4">No services found.</p>
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
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Booking...' : 'Book Appointment'}
        </Button>
      </form>
    </Form>
  );
}

interface ServiceCardProps {
    service: { id: string, name: string, price: number };
    isSelected: boolean;
    onSelect: (checked: boolean) => void;
}

function ServiceCard({ service, isSelected, onSelect }: ServiceCardProps) {
    return (
        <Card 
            className={cn(
                "cursor-pointer transition-all duration-200 hover:animate-shake",
                isSelected ? "ring-2 ring-primary border-primary" : "hover:shadow-md"
            )}
            onClick={() => onSelect(!isSelected)}
        >
            <CardContent className="p-4 relative">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-2">
                        <Scissors className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-sm leading-tight">{service.name}</p>
                    <p className="text-xs text-muted-foreground font-bold">PKR {service.price.toLocaleString()}</p>
                </div>
                <Checkbox
                    checked={isSelected}
                    className="absolute top-2 right-2"
                    aria-label={`Select ${service.name}`}
                />
            </CardContent>
        </Card>
    )
}
