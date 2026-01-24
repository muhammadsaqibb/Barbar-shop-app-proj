"use client";

import { useEffect } from 'react';
import { useAuth } from '../auth-provider';
import type { Appointment } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export default function AppointmentsList() {
  const { user } = useAuth();
  const { firestore } = useFirebase();

  const appointmentsCollectionRef = useMemoFirebase(
    () => (user ? query(collection(firestore, 'appointments'), where('clientId', '==', user.uid)) : null),
    [firestore, user]
  );

  const { data: appointments, isLoading: loading, error } = useCollection<Appointment>(appointmentsCollectionRef);

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'cancelled':
      case 'no-show':
        return 'destructive';
      case 'completed':
        return 'outline'
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
    return <p className="text-muted-foreground text-center">You have no appointments scheduled.</p>;
  }

  return (
    <div className="rounded-md border border-border/20">
        <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Service(s)</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {appointments.map((apt) => (
                <TableRow key={apt.id}>
                    <TableCell className="font-medium">{apt.services.map(s => `${s.name}${s.quantity && s.quantity > 1 ? ` x${s.quantity}` : ''}`).join(', ')}</TableCell>
                    <TableCell>PKR {apt.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell>
                        <Badge variant={apt.paymentStatus === 'paid' ? 'default' : 'secondary'} className="capitalize">
                            {apt.paymentStatus}
                        </Badge>
                    </TableCell>
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
