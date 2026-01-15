"use client";

import { useEffect } from 'react';
import type { Appointment } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import AppointmentActions from './appointment-actions';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function AppointmentsTable() {
  const { firestore } = useFirebase();

  const appointmentsCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'appointments'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: appointments, isLoading: loading, error, refetch: fetchAppointments } = useCollection<Appointment>(appointmentsCollectionRef);

  const handleStatusChange = () => {
    if(fetchAppointments) fetchAppointments();
  }

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'completed':
          return 'outline';
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
    return <p className="text-destructive text-center">{error.message}</p>;
  }

  if (!appointments || appointments.length === 0) {
    return <p className="text-muted-foreground text-center">There are no appointments scheduled.</p>;
  }

  return (
    <div className="rounded-md border border-border/20">
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service(s)</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {appointments.map((apt) => (
                <TableRow key={apt.id}>
                    <TableCell>{apt.clientName}</TableCell>
                    <TableCell className="font-medium">{apt.services.map(s => s.name).join(', ')}</TableCell>
                    <TableCell>PKR {apt.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell>{apt.date}</TableCell>
                    <TableCell>{apt.time}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(apt.status)} className="capitalize">
                          {apt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AppointmentActions appointmentId={apt.id} currentStatus={apt.status} onStatusChange={handleStatusChange} />
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  );
}
