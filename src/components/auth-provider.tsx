"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppUser, Appointment } from '@/types';
import { useFirebase } from '@/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, query, collection, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import useSound from '@/hooks/use-sound';
import SplashScreen from './layout/splash-screen';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore } = useFirebase();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const playSound = useSound();

  // --- Effect to handle authentication state and user profile listening ---
  useEffect(() => {
    let userDocUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }

      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);

        userDocUnsubscribe = onSnapshot(userDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              if (userData.enabled === false) {
                 firebaseSignOut(auth);
                 setUser(null);
                 toast({
                    variant: 'destructive',
                    title: 'Account Disabled',
                    description: 'Your account has been disabled. Please contact an administrator.',
                 });
              } else {
                setUser({ uid: firebaseUser.uid, ...userData } as AppUser);
              }
            } else {
              // Fallback for new users or if doc doesn't exist yet
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                role: 'client'
              });
            }
            setLoading(false);
          }, 
          (error) => {
            console.error("AuthProvider: Error listening to user document:", error);
            setUser(null);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
  }, [auth, firestore, toast]);

  // --- Effect for client appointment notifications ---
  useEffect(() => {
    if (user && user.role === 'client' && firestore) {
      const q = query(collection(firestore, 'appointments'), where('clientId', '==', user.uid));
      let isInitialData = true;

      const appointmentsListener = onSnapshot(q, (snapshot) => {
        if (isInitialData) {
          isInitialData = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const appointment = change.doc.data() as Appointment;
            let title = '';
            let description = '';

            if (appointment.status === 'confirmed') {
              title = 'Appointment Confirmed!';
              description = `Your booking for ${appointment.date} at ${appointment.time} is confirmed.`;
            } else if (appointment.status === 'cancelled') {
              title = 'Appointment Cancelled';
              description = `Your booking for ${appointment.date} at ${appointment.time} has been cancelled.`;
            }

            if (title) {
              toast({ title, description });
              playSound('notification');
            }
          }
        });
      });

      return () => appointmentsListener();
    }
  }, [user, firestore, toast, playSound]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
