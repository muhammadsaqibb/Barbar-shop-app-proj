import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  type User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  setDoc,
  doc,
  getDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy
} from "firebase/firestore";
import type { AppUser, Appointment } from "@/types";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const usersCollection = collection(db, 'users');
const appointmentsCollection = collection(db, 'appointments');

export { auth, db, usersCollection, appointmentsCollection };

export const createUserDocument = async (user: User, name: string) => {
  const userRef = doc(db, `users/${user.uid}`);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    const userData: AppUser = {
      uid: user.uid,
      email: user.email,
      name: name,
      role: 'client',
    };
    await setDoc(userRef, userData);
    await updateProfile(user, { displayName: name });
    return userData;
  }
  return (await getDoc(userRef)).data() as AppUser;
};

export const getUserDocument = async (uid: string): Promise<AppUser | null> => {
  if (!uid) return null;
  const userRef = doc(db, `users/${uid}`);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? userDoc.data() as AppUser : null;
};

export const signUp = async (name: string, email: string, password: string): Promise<AppUser> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  return await createUserDocument(user, name);
};

export const signIn = async (email: string, password: string): Promise<AppUser> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return (await getUserDocument(user.uid))!;
};

export const signOut = async (): Promise<void> => {
  return firebaseSignOut(auth);
};

export const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'status' | 'clientId'>, clientId: string) => {
  await addDoc(appointmentsCollection, {
    ...appointmentData,
    clientId,
    status: 'pending',
    createdAt: Timestamp.now(),
  });
};

export const getUserAppointments = async (clientId: string): Promise<Appointment[]> => {
  const q = query(
    appointmentsCollection, 
    where('clientId', '==', clientId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
};
