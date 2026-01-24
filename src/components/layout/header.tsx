
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User as UserIcon, LayoutDashboard, Users, Sparkles, Receipt } from 'lucide-react';
import Logo from '../logo';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import useSound from '@/hooks/use-sound';
import { ModeToggle } from '../mode-toggle';
import { useTranslation } from '@/context/language-provider';
import { LanguageSwitcher } from '../language-switcher';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const playSound = useSound();
  const { t } = useTranslation();

  const pendingQuery = useMemoFirebase(() => {
    if (!firestore || (user?.role !== 'admin' && user?.role !== 'staff')) return null;
    return query(collection(firestore, 'appointments'), where('status', '==', 'pending'));
  }, [firestore, user]);

  const { data: pendingAppointments } = useCollection(pendingQuery);
  const pendingCount = pendingAppointments?.length ?? 0;
  const prevPendingCount = useRef(pendingCount);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        prevPendingCount.current = pendingCount;
        return;
    }

    if (pendingCount > prevPendingCount.current) {
        toast({
            title: t('new_booking_request'),
            description: t('new_booking_description'),
        });
        playSound('notification');
    }

    prevPendingCount.current = pendingCount;
  }, [pendingCount, toast, playSound, t]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const NavLinks = () => (
    <>
      {(user?.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewOverview)) && (
        <Button variant="ghost" asChild>
          <Link href="/overview">{t('overview')}</Link>
        </Button>
      )}
      {(user?.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewBookings)) && (
        <Button variant="ghost" asChild>
            <Link href="/admin/dashboard" className="relative">
              {t('bookings')}
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {pendingCount}
                </span>
              )}
            </Link>
        </Button>
      )}
      {user?.role === 'admin' && (
        <Button variant="ghost" asChild>
          <Link href="/admin/users">{t('manage_users')}</Link>
        </Button>
      )}
      {user?.role === 'admin' && (
        <Button variant="ghost" asChild>
          <Link href="/admin/settings">{t('opening_hours')}</Link>
        </Button>
      )}
    </>
  )

  const AuthLinks = () => (
     <div className="flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href="/login">{t('login')}</Link>
      </Button>
      <Button asChild>
        <Link href="/register">{t('register')}</Link>
      </Button>
    </div>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm text-foreground">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
          <span className="font-bold font-headline uppercase">{t('app_title')}</span>
        </Link>
        
        <div className="hidden md:flex flex-1 items-center space-x-2 text-sm font-medium">
          {user && <NavLinks />}
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded-md bg-muted"></div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                        <AvatarImage src={user.email || ''} alt={user.name || 'User'} />
                        <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(user.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewBookings)) && (
                        <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="relative">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>{t('bookings')}</span>
                            {pendingCount > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                {pendingCount}
                            </span>
                            )}
                        </Link>
                        </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin/users">
                                <Users className="mr-2 h-4 w-4" />
                                <span>{t('manage_users')}</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin/barbers">
                                <Users className="mr-2 h-4 w-4" />
                                <span>{t('manage_barbers')}</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin/services">
                                <Sparkles className="mr-2 h-4 w-4" />
                                <span>{t('manage_services')}</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin/expenses">
                                <Receipt className="mr-2 h-4 w-4" />
                                <span>{t('manage_expenses')}</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href="/my-appointments">
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>{t('profile')}</span>
                        </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>{t('opening_hours')}</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('logout')}</span>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
             <div className="hidden md:flex">
                <AuthLinks />
             </div>
            )}
             <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <div className="p-4 flex flex-col items-center gap-4">
                  {user ? (
                    <>
                      <NavLinks />
                    </>
                  ) : (
                    <AuthLinks />
                  )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
