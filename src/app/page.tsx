"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, ArrowRight, Settings, User, History } from "lucide-react";

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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
          <ActionCard
            href="/book"
            icon={<Calendar className="h-6 w-6 text-white" />}
            title="Book"
            description="Schedule a new appointment."
          />
          <ActionCard
            href="#"
            icon={<DollarSign className="h-6 w-6 text-white" />}
            title="Expenses"
            description="Manage your expenses."
            disabled
          />
          <ActionCard
            href="#"
            icon={<History className="h-6 w-6 text-white" />}
            title="History"
            description="View your past activity."
            disabled
          />
          <ActionCard
            href="#"
            icon={<User className="h-6 w-6 text-white" />}
            title="Profile"
            description="Update your profile."
            disabled
          />
          <ActionCard
            href="#"
            icon={<Settings className="h-6 w-6 text-white" />}
            title="Settings"
            description="Adjust your preferences."
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
      <Card className={`group w-full h-full text-center shadow-lg hover:shadow-xl transition-shadow duration-300 ${disabled ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'}`}>
      <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
        <div className={`p-3 rounded-full bg-black`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold font-headline text-gray-900">{title}</h3>
          <p className="mt-1 text-xs text-gray-600">{description}</p>
        </div>
        {disabled && (
            <div className="mt-2 text-xs font-semibold text-gray-400">
                Coming Soon
            </div>
        )}
      </CardContent>
    </Card>
  );

  if (disabled) {
    return <div className="cursor-not-allowed h-full">{content}</div>
  }

  return (
    <Link href={href} className="flex h-full">
        {content}
    </Link>
  );
}
