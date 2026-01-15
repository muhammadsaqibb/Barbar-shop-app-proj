import ProtectedRoute from "@/components/protected-route";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import AppointmentsChart from "@/components/overview/appointments-chart";

export default function OverviewPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <h1 className="text-3xl font-headline mb-6">Overview</h1>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <span className="h-4 w-4 text-muted-foreground font-bold">PKR</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">4,523,189</div>
                            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+2350</div>
                            <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+12,234</div>
                            <p className="text-xs text-muted-foreground">+19% from last month</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+573</div>
                            <p className="text-xs text-muted-foreground">+201 since last hour</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Appointments Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AppointmentsChart />
                    </CardContent>
                </Card>
            </div>
        </ProtectedRoute>
    );
}
