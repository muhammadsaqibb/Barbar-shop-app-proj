import type { Timestamp } from "firebase/firestore";

export interface AppUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'client' | 'admin';
}

export interface Appointment {
  id: string;
  clientId: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Timestamp;
}
