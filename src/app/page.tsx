"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

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
    <div className="w-full bg-white">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl font-headline">
            Welcome{user ? `, ${user.name}` : ''}
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            What would you like to do today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <ActionCard
            href="/book"
            icon={<Calendar className="h-8 w-8 text-white" />}
            title="Book Appointment"
            description="Schedule a new consultation, check-up, or procedure."
          />
          <ActionCard
            href="#"
            icon={<DollarSign className="h-8 w-8 text-white" />}
            title="Manage Expenses"
            description="Track and manage your expenses. (Coming Soon)"
            disabled
          />
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}

function ActionCard({ href, icon, title, description, disabled }: ActionCardProps) {
  const content = (
      <Card className={`group w-full h-full text-left shadow-lg hover:shadow-2xl transition-shadow duration-300 ${disabled ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}>
      <CardContent className="p-6 flex flex-col items-start gap-4">
        <div className={`p-3 rounded-full bg-black`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold font-headline text-gray-900">{title}</h3>
          <p className="mt-2 text-gray-600">{description}</p>
        </div>
        {!disabled && (
          <div className="mt-4 flex items-center font-semibold text-black">
            Go to {title}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        )}
        {disabled && (
            <div className="mt-4 text-sm font-semibold text-gray-400">
                Coming Soon
            </div>
        )}
      </CardContent>
    </Card>
  );

  if (disabled) {
    return <div className="cursor-not-allowed">{content}</div>
  }

  return (
    <Link href={href} className="flex">
        {content}
    </Link>
  );
}
