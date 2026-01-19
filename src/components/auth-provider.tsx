"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode, useRef } from 'react';
import type { AppUser, Appointment } from '@/types';
import { useFirebase } from '@/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, query, collection, where, onSnapshot } from 'firebase/firestore';
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
  const appointmentsListener = useRef<() => void | null>(null);


  useEffect(() => {
    // --- Notification listener for client appointment changes ---
    if (appointmentsListener.current) {
        appointmentsListener.current();
        appointmentsListener.current = null;
    }

    if (user && user.role === 'client' && firestore) {
        const q = query(collection(firestore, 'appointments'), where('clientId', '==', user.uid));
        
        let isInitialData = true;

        appointmentsListener.current = onSnapshot(q, (snapshot) => {
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
    }
    // --- End of notification listener ---

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in, get custom user data from Firestore
        const userDocRef = doc(firestore, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUser({
            uid: firebaseUser.uid,
            ...userDoc.data(),
          } as AppUser);
        } else {
          // Fallback if no user doc, though one should be created on signup
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role: 'client'
          });
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (appointmentsListener.current) {
        appointmentsListener.current();
      }
    };
  }, [auth, firestore, user?.uid, toast, playSound]);

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
