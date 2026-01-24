"use client";

import { useAuth } from "@/components/auth-provider";
import { useFirebase } from "@/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
    Scissors, Sparkles, LayoutDashboard, Package, BookCopy, Receipt, 
    LogIn, Users, Settings, User as UserIcon, Pencil, Save, X, RotateCcw,
    MoveUp, MoveDown
} from "lucide-react";
import { useTranslation } from "@/context/language-provider";
import type { AppUser, StaffPermissions } from "@/types";
import type { Translations } from "@/context/language-provider";
import { useState, useEffect, useMemo } from "react";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const formatUserDisplayName = (name: string | null | undefined, email: string | null | undefined): string => {
    if (name) return name;
    if (email) {
      const emailName = email.split('@')[0];
      return emailName.split(/[\._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return 'Guest';
}

interface ActionCardData {
    id: string;
    href: string;
    icon: React.ReactNode;
    titleKey: keyof Translations;
    descriptionKey: keyof Translations;
    isVisible: (user: AppUser | null) => boolean;
}

const ALL_ACTION_CARDS: ActionCardData[] = [
    {
        id: 'overview',
        href: '/overview',
        icon: <LayoutDashboard className="h-6 w-6" />,
        titleKey: 'overview',
        descriptionKey: 'overview_desc',
        isVisible: (user) => user?.role === 'admin' || (user?.role === 'staff' && !!user.permissions?.canViewOverview),
    },
    {
        id: 'bookings',
        href: '/admin/dashboard',
        icon: <BookCopy className="h-6 w-6" />,
        titleKey: 'bookings',
        descriptionKey: 'bookings_desc',
        isVisible: (user) => user?.role === 'admin' || (user?.role === 'staff' && !!user.permissions?.canViewBookings),
    },
    {
        id: 'manage_users',
        href: '/admin/users',
        icon: <Users className="h-6 w-6" />,
        titleKey: 'manage_users',
        descriptionKey: 'manage_users_desc',
        isVisible: (user) => user?.role === 'admin',
    },
    {
        id: 'manage_services',
        href: '/admin/services',
        icon: <Sparkles className="h-6 w-6" />,
        titleKey: 'manage_services',
        descriptionKey: 'manage_services_desc',
        isVisible: (user) => user?.role === 'admin',
    },
    {
        id: 'manage_barbers',
        href: '/admin/barbers',
        icon: <Users className="h-6 w-6" />,
        titleKey: 'manage_barbers',
        descriptionKey: 'manage_barbers_desc',
        isVisible: (user) => user?.role === 'admin',
    },
    {
        id: 'opening_hours',
        href: '/admin/settings',
        icon: <Settings className="h-6 w-6" />,
        titleKey: 'opening_hours',
        descriptionKey: 'opening_hours_desc',
        isVisible: (user) => user?.role === 'admin',
    },
    {
        id: 'manage_expenses',
        href: '/admin/expenses',
        icon: <Receipt className="h-6 w-6" />,
        titleKey: 'manage_expenses',
        descriptionKey: 'manage_expenses_desc',
        isVisible: (user) => user?.role === 'admin',
    },
    {
        id: 'book_cut',
        href: '/book',
        icon: <Scissors className="h-6 w-6" />,
        titleKey: 'book_cut_title',
        descriptionKey: 'book_cut_desc',
        isVisible: (user) => !!user,
    },
    {
        id: 'profile',
        href: '/my-appointments',
        icon: <UserIcon className="h-6 w-6" />,
        titleKey: 'profile',
        descriptionKey: 'profile_desc',
        isVisible: (user) => !!user,
    },
    {
        id: 'packages',
        href: '/packages',
        icon: <Package className="h-6 w-6" />,
        titleKey: 'packages_title',
        descriptionKey: 'packages_desc',
        isVisible: (user) => !!user,
    },
    // Guest Cards
    {
        id: 'guest_book_now',
        href: '/book',
        icon: <Scissors className="h-6 w-6" />,
        titleKey: 'book_now_title',
        descriptionKey: 'book_now_desc',
        isVisible: (user) => !user,
    },
    {
        id: 'guest_view_packages',
        href: '/packages',
        icon: <Package className="h-6 w-6" />,
        titleKey: 'view_packages_title',
        descriptionKey: 'packages_desc',
        isVisible: (user) => !user,
    },
    {
        id: 'guest_login',
        href: '/login',
        icon: <LogIn className="h-6 w-6" />,
        titleKey: 'login_signup_title',
        descriptionKey: 'login_signup_desc',
        isVisible: (user) => !user,
    }
];

export default function Home() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [editMode, setEditMode] = useState(false);
  const [cardLayout, setCardLayout] = useState<ActionCardData[]>([]);
  const [initialLayout, setInitialLayout] = useState<ActionCardData[]>([]);

  const displayName = formatUserDisplayName(user?.name, user?.email);

  useEffect(() => {
    const visibleCards = ALL_ACTION_CARDS.filter(card => card.isVisible(user));
    const savedOrder = user?.homepageLayout;
    
    if (savedOrder) {
      visibleCards.sort((a, b) => {
        const indexA = savedOrder.indexOf(a.id);
        const indexB = savedOrder.indexOf(b.id);
        
        if (indexA === -1 && indexB === -1) {
            const defaultIndexA = ALL_ACTION_CARDS.findIndex(c => c.id === a.id);
            const defaultIndexB = ALL_ACTION_CARDS.findIndex(c => c.id === b.id);
            return defaultIndexA - defaultIndexB;
        }
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    setCardLayout(visibleCards);
    if (!editMode) {
      setInitialLayout(visibleCards);
    }
  }, [user, editMode]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newLayout = [...cardLayout];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newLayout.length) {
      [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
      setCardLayout(newLayout);
    }
  };

  const handleSaveLayout = async () => {
    if (!user) return;
    const newOrder = cardLayout.map(card => card.id);
    const userRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userRef, { homepageLayout: newOrder });
      setEditMode(false);
      setInitialLayout(cardLayout);
      toast({ title: "Layout Saved", description: "Your homepage layout has been updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not save your layout." });
    }
  };
  
  const handleResetLayout = async () => {
    if (!user) return;
    const userRef = doc(firestore, 'users', user.uid);
     try {
      await updateDoc(userRef, { homepageLayout: deleteField() });
      setEditMode(false);
      // The useEffect will trigger a re-render with the default layout
      toast({ title: "Layout Reset", description: "Your homepage layout has been reset to default." });
    } catch (error) {
      toast({ variant: "destructive", title: "Reset Failed", description: "Could not reset your layout." });
    }
  };

  const handleCancel = () => {
    setCardLayout(initialLayout);
    setEditMode(false);
  };

  return (
    <div className="w-full">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline uppercase">
            {t('app_headline')}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            {user ? t('welcome_back_user', { name: displayName }) : t('app_subheadline_logged_out')}{' '}
            {t('ready_fresh_look')}
          </p>
        </div>

        {user && (
            <div className="flex justify-center mb-8 gap-4">
                {editMode ? (
                    <>
                        <Button onClick={handleSaveLayout}><Save className="mr-2 h-4 w-4" /> Save Layout</Button>
                        <Button variant="outline" onClick={handleCancel}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                        <Button variant="destructive" onClick={handleResetLayout}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                    </>
                ) : (
                    <Button variant="outline" onClick={() => setEditMode(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Customize Layout
                    </Button>
                )}
            </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {cardLayout.map((card, index) => (
                <ActionCard
                    key={card.id}
                    href={card.href}
                    icon={card.icon}
                    title={t(card.titleKey)}
                    description={t(card.descriptionKey)}
                    editMode={editMode}
                    isFirst={index === 0}
                    isLast={index === cardLayout.length - 1}
                    onMoveUp={() => handleMove(index, 'up')}
                    onMoveDown={() => handleMove(index, 'down')}
                />
            ))}
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
  editMode?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function ActionCard({ href, icon, title, description, disabled, editMode, isFirst, isLast, onMoveUp, onMoveDown }: ActionCardProps) {
  const content = (
      <Card className={`group w-full h-full text-center shadow-lg hover:shadow-primary/20 transition-all duration-300 relative ${disabled ? 'bg-muted/50' : 'bg-card hover:bg-card/95'} ${editMode ? 'hover:animate-none' : 'hover:animate-shake'}`}>
      {editMode && (
          <div className="absolute top-1 right-1 flex flex-col gap-1 z-10">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onMoveUp} disabled={isFirst}>
                  <MoveUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onMoveDown} disabled={isLast}>
                  <MoveDown className="h-4 w-4" />
              </Button>
          </div>
      )}
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

  if (disabled || editMode) {
    return <div className={`cursor-not-allowed h-full ${editMode ? 'cursor-grab' : ''}`}>{content}</div>
  }

  return (
    <Link href={href} className="flex h-full">
        {content}
    </Link>
  );
}
