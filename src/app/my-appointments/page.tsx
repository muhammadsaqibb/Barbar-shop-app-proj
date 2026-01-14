import ProtectedRoute from "@/components/protected-route";
import AppointmentsList from "@/components/appointments/appointments-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyAppointmentsPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">My Appointments</CardTitle>
                        <CardDescription>Here is a list of your upcoming and past appointments.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AppointmentsList />
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
