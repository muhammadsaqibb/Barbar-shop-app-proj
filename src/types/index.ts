
export interface StaffPermissions {
  canViewBookings: boolean;
  canAddWalkInBookings: boolean;
  canEditBookingStatus: boolean;
  canManageCustomers: boolean;
  canViewOverview: boolean;
}

export interface AppUser {
  id?: string; // from firestore doc id
  uid: string;
  email: string | null;
  name: string | null;
  role: 'client' | 'admin' | 'staff';
  permissions?: StaffPermissions;
  enabled?: boolean;
}

export interface Service {
  id: string;
  name:string;
  isPackage: boolean;
  price: number;
  duration: number; // in minutes
  description?: string;
  enabled: boolean;
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
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  paymentStatus: 'paid' | 'unpaid';
  createdAt: any;
  bookedBy?: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  createdAt: any;
  notes?: string;
}

    
