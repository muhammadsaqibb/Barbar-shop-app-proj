"use client";

import { useAuth } from "@/components/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Scissors, ShoppingCart, GalleryHorizontal, User, Settings, Info, Briefcase, Sparkles, LayoutDashboard } from "lucide-react";

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
    <div className="w-full">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline uppercase">
            The Gentleman's Cut
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {user ? `Welcome back, ${user.name}.` : 'Your next haircut is just a few clicks away.'} Ready for a fresh look?
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
          <ActionCard
            href="/overview"
            icon={<LayoutDashboard className="h-6 w-6" />}
            title="Overview"
            description="View key stats and charts."
          />
          <ActionCard
            href="/book"
            icon={<Scissors className="h-6 w-6" />}
            title="Book Cut"
            description="Schedule a new appointment."
          />
          <ActionCard
            href="#"
            icon={<GalleryHorizontal className="h-6 w-6" />}
            title="Gallery"
            description="See our latest styles."
            disabled
          />
          <ActionCard
            href="#"
            icon={<Info className="h-6 w-6" />}
            title="Services"
            description="View our list of services."
            disabled
          />
           <ActionCard
            href="#"
            icon={<ShoppingCart className="h-6 w-6" />}
            title="Products"
            description="Shop our grooming products."
            disabled
          />
          <ActionCard
            href="#"
            icon={<User className="h-6 w-6" />}
            title="Profile"
            description="Update your profile."
            disabled
          />
           <ActionCard
            href="#"
            icon={<Sparkles className="h-6 w-6" />}
            title="Specials"
            description="Check out our offers."
            disabled
          />
           <ActionCard
            href="#"
            icon={<Briefcase className="h-6 w-6" />}
            title="Careers"
            description="Join our talented team."
            disabled
          />
          <ActionCard
            href="#"
            icon={<Settings className="h-6 w-6" />}
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
      <Card className={`group w-full h-full text-center shadow-lg hover:shadow-primary/20 transition-all duration-300 ${disabled ? 'bg-muted/50' : 'bg-card hover:bg-card/95'}`}>
      <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
        <div className={`p-3 rounded-full bg-primary text-primary-foreground`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold font-headline text-card-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        {disabled && (
            <div className="mt-2 text-xs font-semibold text-muted-foreground/80">
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
