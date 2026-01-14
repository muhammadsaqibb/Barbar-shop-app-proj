"use client";

import { useAuth } from "@/components/auth-provider";
import BookingForm from "@/components/appointments/booking-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from 'next/image';
import {PlaceHolderImages} from '@/lib/placeholder-images';
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, loading } = useAuth();
  const heroImage = PlaceHolderImages.find(p => p.id === 'landing-hero');

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {user ? (
        <BookingPage />
      ) : (
        <LandingPage heroImage={heroImage} />
      )}
    </div>
  );
}

function LandingPage({ heroImage }: { heroImage: any }) {
  return (
    <div className="relative isolate overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-foreground sm:text-6xl font-headline">
            Effortless Appointment Scheduling
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Welcome to BookItEasy. Streamline your client bookings with our intuitive and reliable platform. Save time, reduce no-shows, and focus on what you do best.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/login">Sign In <span aria-hidden="true">→</span></Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
          {heroImage && (
            <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
              <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  data-ai-hint={heroImage.imageHint}
                  width={1200}
                  height={800}
                  className="w-[76rem] rounded-md shadow-2xl ring-1 ring-gray-900/10"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingPage() {
  const { user } = useAuth();
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">
              Book an Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-6">
              Welcome back, {user?.name || user?.email}! Fill out the form below to schedule your next appointment.
            </p>
            <BookingForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
