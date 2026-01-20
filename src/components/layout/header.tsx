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
import { LifeBuoy, LogOut, Settings, User as UserIcon, LayoutDashboard, Users, Sparkles, Receipt } from 'lucide-react';
import Logo from '../logo';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import useSound from '@/hooks/use-sound';
import { ModeToggle } from '../mode-toggle';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const playSound = useSound();

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
            title: "New Booking Request",
            description: "A new appointment is awaiting approval.",
        });
        playSound('notification');
    }

    prevPendingCount.current = pendingCount;
  }, [pendingCount, toast, playSound]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const NavLinks = () => (
    <>
      {(user?.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewOverview)) && (
        <Button variant="ghost" asChild>
          <Link href="/overview">Overview</Link>
        </Button>
      )}
      {(user?.role === 'admin' || (user?.role === 'staff' && user.permissions?.canViewBookings)) && (
        <Button variant="ghost" asChild>
            <Link href="/admin/dashboard" className="relative">
              Bookings
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
          <Link href="/admin/users">Manage Users</Link>
        </Button>
      )}
    </>
  )

  const AuthLinks = () => (
     <div className="flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href="/login">Login</Link>
      </Button>
      <Button asChild>
        <Link href="/register">Register</Link>
      </Button>
    </div>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm text-foreground">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Logo />
          <span className="font-bold font-headline uppercase">The Gentleman's Cut</span>
        </Link>
        
        <div className="hidden md:flex flex-1 items-center space-x-2 text-sm font-medium">
          {user && <NavLinks />}
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center gap-2">
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
                            <span>Bookings Dashboard</span>
                            {pendingCount > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                {pendingCount}
                            </span>
                            )}
                        </Link>
                        </DropdownMenuItem>
                    )}
                    {user.role === 'admin' && (
                        <>
                            <DropdownMenuItem asChild>
                                <Link href="/admin/users">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Manage Users</span>
                                </Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                                <Link href="/admin/services">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    <span>Manage Services</span>
                                </Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                                <Link href="/admin/expenses">
                                    <Receipt className="mr-2 h-4 w-4" />
                                    <span>Manage Expenses</span>
                                </Link>
                            </DropdownMenuItem>
                        </>
                    )}
                    <DropdownMenuItem>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <LifeBuoy className="mr-2 h-4 w-4" />
                        <span>Support</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
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
