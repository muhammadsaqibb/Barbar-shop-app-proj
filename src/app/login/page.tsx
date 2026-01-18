import LoginForm from '@/components/auth/login-form';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import BarberLogo from '@/components/barber-logo';

export default function LoginPage() {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl overflow-hidden shadow-2xl border-border/20 grid grid-cols-1 md:grid-cols-2">
            <div className="relative hidden md:flex items-center justify-center bg-muted/30 p-8">
                <BarberLogo className="w-64 h-64" />
            </div>
            <div className="p-6 sm:p-10 flex flex-col justify-center">
                <div className="mb-8 text-center">
                    <CardHeader className="p-0 mb-2">
                        <CardTitle className="text-3xl font-headline text-center">Welcome Back</CardTitle>
                        <CardDescription className="text-center pt-2">
                            Enter your credentials to access your account.
                        </CardDescription>
                    </CardHeader>
                </div>
                <LoginForm />
            </div>
        </Card>
    </div>
  );
}
