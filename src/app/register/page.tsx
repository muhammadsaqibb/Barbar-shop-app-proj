import RegisterForm from '@/components/auth/register-form';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function RegisterPage() {
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-splash');

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-4xl overflow-hidden shadow-2xl border-border/20 grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 sm:p-10 flex flex-col justify-center">
                <div className="mb-8 text-center">
                    <CardHeader className="p-0 mb-2">
                        <CardTitle className="text-3xl font-headline text-center">Create an Account</CardTitle>
                        <CardDescription className="text-center pt-2">
                            Join us! It's quick and easy.
                        </CardDescription>
                    </CardHeader>
                </div>
                <RegisterForm />
            </div>
             <div className="relative hidden md:block">
                {loginImage && (
                    <Image
                        src={loginImage.imageUrl}
                        alt={loginImage.description}
                        data-ai-hint={loginImage.imageHint}
                        fill
                        className="object-cover"
                    />
                )}
            </div>
        </Card>
    </div>
  );
}
