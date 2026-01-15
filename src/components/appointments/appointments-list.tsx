"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '../auth-provider';
import type { Appointment } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Calendar, Clock, Tag } from 'lucide-react';

export default function AppointmentsList() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const fetchAppointments = async () => {
        try {
          setLoading(true);
          const storedAppointments = localStorage.getItem('appointments');
          if (storedAppointments) {
            const allAppointments: Appointment[] = JSON.parse(storedAppointments);
            const userAppointments = allAppointments.filter(apt => apt.clientId === user.uid);
            setAppointments(userAppointments);
          }
          setError(null);
        } catch (err) {
          setError('Failed to fetch appointments.');
        } finally {
          setLoading(false);
        }
      };
      fetchAppointments();
    }
  }, [user]);

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  if (error) {
    return <p className="text-destructive text-center">{error}</p>;
  }

  if (appointments.length === 0) {
    return <p className="text-muted-foreground text-center">You have no appointments scheduled.</p>;
  }

  return (
    <div className="rounded-md border border-border/20">
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {appointments.map((apt) => (
                <TableRow key={apt.id}>
                    <TableCell className="font-medium">{apt.service}</TableCell>
                    <TableCell>PKR {apt.price?.toLocaleString()}</TableCell>
                    <TableCell>{apt.date}</TableCell>
                    <TableCell>{apt.time}</TableCell>
                    <TableCell className="text-right">
                    <Badge variant={getStatusVariant(apt.status)} className="capitalize">
                        {apt.status}
                    </Badge>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
