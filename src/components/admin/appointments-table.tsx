"use client";

import { useMemo } from 'react';
import type { Appointment } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import AppointmentActions from './appointment-actions';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format, addMinutes, parse } from 'date-fns';

const formatTimeRange = (startTimeStr: string, dateStr: string, duration: number): string => {
    if (!startTimeStr || !dateStr || !duration) return startTimeStr;
    try {
        const startTime = parse(`${dateStr} ${startTimeStr}`, 'PPP h:mm a', new Date());
        const endTime = addMinutes(startTime, duration);
        return `${startTimeStr} - ${format(endTime, 'h:mm a')}`;
    } catch (e) {
        console.error("Error formatting time range:", e);
        return startTimeStr;
    }
};

export default function AppointmentsTable() {
  const { firestore } = useFirebase();

  const appointmentsCollectionRef = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'appointments'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );

  const { data: appointments, isLoading: loading, error, refetch: fetchAppointments } = useCollection<Appointment>(appointmentsCollectionRef);

  const sortedAppointments = useMemo(() => {
    if (!appointments) return [];
    return [...appointments].sort((a, b) => {
        // Prioritize 'pending' status
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;

        // Then by confirmed status
        if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
        if (a.status !== 'confirmed' && b.status === 'confirmed') return 1;

        // Then sort by creation date descending
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
    });
  }, [appointments]);


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

  if (!sortedAppointments || sortedAppointments.length === 0) {
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
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedAppointments.map((apt) => (
                <TableRow key={apt.id}>
                    <TableCell>{apt.clientName}</TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{apt.services.map(s => s.name).join(', ')}</TableCell>
                    <TableCell>PKR {apt.totalPrice?.toLocaleString()}</TableCell>
                    <TableCell>{apt.date}</TableCell>
                    <TableCell>{formatTimeRange(apt.time, apt.date, apt.totalDuration)}</TableCell>
                    <TableCell>{apt.totalDuration} min</TableCell>
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
