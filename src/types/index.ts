export interface AppUser {
  id?: string; // from firestore doc id
  uid: string;
  email: string | null;
  name: string | null;
  role: 'client' | 'admin';
}

export interface Service {
  id: string;
  name:string;
  isPackage: boolean;
  price: number;
  duration: number; // in minutes
  description?: string;
}

export interface Barber {
  id: string;
  name: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string | null;
  services: { id: string, name: string, price: number, duration: number }[];
  totalPrice: number;
  totalDuration: number;
  date: string;
  time: string;
  barberId: string | null;
  notes: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: any;
}
