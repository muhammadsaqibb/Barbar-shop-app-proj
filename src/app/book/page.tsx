"use client";

import { useAuth } from "@/components/auth-provider";
import BookingForm from "@/components/appointments/booking-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ProtectedRoute from "@/components/protected-route";

const formatUserDisplayName = (name: string | null | undefined, email: string | null | undefined): string => {
    if (name) return name;
    if (email) {
      const emailName = email.split('@')[0];
      return emailName.split(/[\._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return 'Guest';
}

export default function BookAppointmentPage() {
  const { user } = useAuth();

  const displayName = formatUserDisplayName(user?.name, user?.email);

  return (
    <ProtectedRoute>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-4xl">
                <Card className="shadow-lg border-border/20">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline text-center uppercase">
                    Book Your Appointment
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground pt-2">
                     Welcome, {displayName}! Fill out the form below to schedule your visit.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BookingForm />
                </CardContent>
                </Card>
            </div>
        </div>
    </ProtectedRoute>
  );
}
