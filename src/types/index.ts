export interface AppUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: 'client' | 'admin';
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName?: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: number; // Using number for timestamp (Date.getTime())
}
