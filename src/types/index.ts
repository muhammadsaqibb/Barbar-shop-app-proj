export interface AppUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'client' | 'admin';
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  description?: string;
}

export interface Barber {
  id: string;
  name: string;
  services: string[]; // array of service IDs
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName?: string;
  services: Service[];
  totalPrice: number;
  totalDuration: number;
  date: string;
  time: string;
  barberId?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: number; // Using number for timestamp (Date.getTime())
}
