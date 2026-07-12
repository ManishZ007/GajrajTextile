export interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface CustomerAuth {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  user_id: string;
  profileImageUrl: string | null;
  dateOfBirth: string;
  gender: string;
  addresses: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  authentication: {
    message: string;
    auth: CustomerAuth;
  };
  customer: Customer;
}

export interface AddressFormData {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface UpdateProfilePayload {
  userType: 'CUSTOMER';
  userInfo: {
    full_name: string;
    email: string;
    phone_number: string;
  };
  customer: {
    gender: string;
    profile_image_url: string | null;
    date_of_birth: string;
  };
}

export function isProfileComplete(profile: CustomerProfile): boolean {
  const auth = profile.authentication?.auth;
  const customer = profile.customer;
  return !!(
    auth?.userId &&
    auth?.fullName?.trim() &&
    auth?.email?.trim() &&
    auth?.phoneNumber?.trim() &&
    customer?.gender?.trim() &&
    customer?.dateOfBirth?.trim()
  );
}
