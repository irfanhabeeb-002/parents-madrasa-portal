import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  name: string;
  phone: string;
  createdAt: Timestamp;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface SignupCredentials {
  name: string;
  phone: string;
}