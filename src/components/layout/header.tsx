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
import { LifeBuoy, LogOut, Settings, User as UserIcon, LayoutDashboard } from 'lucide-react';
import Logo from '../logo';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu } from 'lucide-react';

export default function Header() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    signOut();
    router.push('/login');
  };

  const NavLinks = () => (
    <>
      <Button variant="ghost" asChild>
        <Link href="/overview">Overview</Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/book">Book A Cut</Link>
      </Button>
      <Button variant="ghost" asChild>
        <Link href="/my-appointments">My Appointments</Link>
      </Button>
      {user?.role === 'admin' && (
        <Button variant="ghost" asChild>
            <Link href="/admin/dashboard">Admin</Link>
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
          <nav className="flex items-center">
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded-md bg-muted"></div>
            ) : user ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="#">
                        <Settings />
                        <span className="sr-only">Settings</span>
                    </Link>
                </Button>
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
                    {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                        </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
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