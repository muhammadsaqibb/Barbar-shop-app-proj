"use client";

import { useAuth } from "@/components/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Scissors, Sparkles, LayoutDashboard, Package, CalendarDays, BookCopy, Receipt, LogIn, Users, Settings, User as UserIcon } from "lucide-react";
import { useTranslation } from "@/context/language-provider";

const formatUserDisplayName = (name: string | null | undefined, email: string | null | undefined): string => {
    if (name) return name;
    if (email) {
      const emailName = email.split('@')[0];
      return emailName.split(/[\._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return 'Guest';
}

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const displayName = formatUserDisplayName(user?.name, user?.email);

  return (
    <div className="w-full">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline uppercase">
            {t('app_headline')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {user ? t('welcome_back_user', { name: displayName }) : t('app_subheadline_logged_out')}{' '}
            {t('ready_fresh_look')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {user ? (
            <>
              {(user?.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewOverview)) && (
                <ActionCard
                  href="/overview"
                  icon={<LayoutDashboard className="h-6 w-6" />}
                  title={t('overview')}
                  description={t('overview_desc')}
                />
              )}
               {(user?.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewBookings)) && (
                <ActionCard
                  href="/admin/dashboard"
                  icon={<BookCopy className="h-6 w-6" />}
                  title={t('bookings')}
                  description={t('bookings_desc')}
                />
              )}
              {user?.role === 'admin' && (
                <ActionCard
                    href="/admin/users"
                    icon={<Users className="h-6 w-6" />}
                    title={t('manage_users')}
                    description={t('manage_users_desc')}
                />
              )}
              {user?.role === 'admin' && (
                <ActionCard
                    href="/admin/services"
                    icon={<Sparkles className="h-6 w-6" />}
                    title={t('manage_services')}
                    description={t('manage_services_desc')}
                />
              )}
              {user?.role === 'admin' && (
                <ActionCard
                    href="/admin/barbers"
                    icon={<Users className="h-6 w-6" />}
                    title={t('manage_barbers')}
                    description={t('manage_barbers_desc')}
                />
              )}
               {user?.role === 'admin' && (
                <ActionCard
                    href="/admin/settings"
                    icon={<Settings className="h-6 w-6" />}
                    title={t('opening_hours')}
                    description={t('opening_hours_desc')}
                />
              )}
              {user?.role === 'admin' && (
                <ActionCard
                    href="/admin/expenses"
                    icon={<Receipt className="h-6 w-6" />}
                    title={t('manage_expenses')}
                    description={t('manage_expenses_desc')}
                />
              )}
              <ActionCard
                href="/book"
                icon={<Scissors className="h-6 w-6" />}
                title={t('book_cut_title')}
                description={t('book_cut_desc')}
              />
              <ActionCard
                href="/my-appointments"
                icon={<UserIcon className="h-6 w-6" />}
                title={t('profile')}
                description={t('profile_desc')}
              />
              <ActionCard
                href="/packages"
                icon={<Package className="h-6 w-6" />}
                title={t('packages_title')}
                description={t('packages_desc')}
              />
            </>
          ) : (
            <>
              <ActionCard
                href="/book"
                icon={<Scissors className="h-6 w-6" />}
                title={t('book_now_title')}
                description={t('book_now_desc')}
              />
               <ActionCard
                href="/packages"
                icon={<Package className="h-6 w-6" />}
                title={t('view_packages_title')}
                description={t('packages_desc')}
              />
               <ActionCard
                href="/login"
                icon={<LogIn className="h-6 w-6" />}
                title={t('login_signup_title')}
                description={t('login_signup_desc')}
              />
            </>
          )}
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
      <Card className={`group w-full h-full text-center shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:animate-shake ${disabled ? 'bg-muted/50' : 'bg-card hover:bg-card/95'}`}>
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
