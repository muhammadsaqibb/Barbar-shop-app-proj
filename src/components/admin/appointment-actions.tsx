"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { updateAppointmentStatus } from "@/lib/firebase";
import type { Appointment } from "@/types";
import { Check, X } from "lucide-react";
import { useState } from "react";

interface AppointmentActionsProps {
    appointmentId: string;
    currentStatus: Appointment['status'];
    onStatusChange: () => void;
}

export default function AppointmentActions({ appointmentId, currentStatus, onStatusChange }: AppointmentActionsProps) {
    const [loading, setLoading] = useState< 'confirm' | 'cancel' | null>(null);
    const { toast } = useToast();

    const handleUpdateStatus = async (status: 'confirmed' | 'cancelled') => {
        setLoading(status === 'confirmed' ? 'confirm' : 'cancel');
        try {
            await updateAppointmentStatus(appointmentId, status);
            toast({
                title: "Status Updated",
                description: `Appointment has been ${status}.`,
            });
            onStatusChange();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: "Update Failed",
                description: "Could not update appointment status.",
            });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex justify-end gap-2">
            {currentStatus === 'pending' && (
                <>
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateStatus('confirmed')}
                        disabled={loading === 'confirm'}
                    >
                        <Check className="mr-2 h-4 w-4" />
                        {loading === 'confirm' ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleUpdateStatus('cancelled')}
                        disabled={loading === 'cancel'}
                    >
                        <X className="mr-2 h-4 w-4" />
                        {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
                    </Button>
                </>
            )}
            {currentStatus === 'confirmed' && (
                 <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleUpdateStatus('cancelled')}
                    disabled={loading === 'cancel'}
                >
                    <X className="mr-2 h-4 w-4" />
                    {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
                </Button>
            )}
        </div>
    )
}
