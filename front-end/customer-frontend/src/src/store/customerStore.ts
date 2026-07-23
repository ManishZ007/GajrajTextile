import { create } from 'zustand';

export interface ProfileResponse {
  authentication: AuthenticationResponse;
  customer:       Customer;
}

export interface AuthenticationResponse {
  auth:    Auth;
  message: string;
}

export interface Auth {
  userId:      string;
  fullName:    string;
  email:       string;
  phoneNumber: string | null;
  role:        'CUSTOMER' | 'MANAGER' | 'OWNER' | 'WORKER';
  createdAt:   string;
  updatedAt:   string;
  commonResponse: null;
}

export interface Customer {
  id:              string;
  user_id:         string;
  profileImageUrl: string | null;
  dateOfBirth:     string | null;
  gender:          string | null;
  addresses:       Address[];
  createdAt:       string;
  updatedAt:       string;
}

export interface Address {
  id?:           string;
  label?:        'Home' | 'Work' | 'Other';
  addressLine1?: string;
  addressLine2?: string;
  city?:         string;
  state?:        string;
  country?:      string;
  postalCode?:   string;
  isDefault?:    boolean;
}

interface ProfileStore {
  profile:      ProfileResponse | null;
  setProfile:   (profile: ProfileResponse) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  setProfile:   (profile) => set({ profile }),
  clearProfile: ()        => set({ profile: null }),
}));
