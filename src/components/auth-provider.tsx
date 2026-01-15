"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppUser } from '@/types';
import { useFirebase } from '@/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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

  useEffect(() => {
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

    return () => unsubscribe();
  }, [auth, firestore]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

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
