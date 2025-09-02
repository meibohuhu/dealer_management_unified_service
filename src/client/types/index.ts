// API Types

export interface Vehicle {
  id: number;
  vin_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreate {
  vin_number: string;
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate?: string | null;
}

export interface VehicleUpdate {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  license_plate?: string | null;
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  gender?: string;
  phone_number: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerCreate {
  first_name: string;
  last_name: string;
  gender?: string;
  phone_number: string;
  email: string;
}

export interface CustomerUpdate {
  first_name?: string;
  last_name?: string;
  gender?: string;
  phone_number?: string;
  email?: string;
}

export interface Contract {
  id: number;
  contract_number: string;
  vehicle_id: number;
  customer_id: number;
  vin_number: string;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  payment_amount: number;
  tax_amount: number;
  deposit_amount: number;
  status: 'active' | 'returned' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContractDetail extends Contract {
  vehicle?: Vehicle;
  customer?: Customer;
  images?: ContractImage[];
  files?: ContractFile[];
}

export interface ContractImage {
  id: string;
  contract_id: string;
  image_url: string;
  description?: string;
  created_at: string;
}

export interface ContractFile {
  id: string;
  contract_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  description?: string;
  uploaded_by: string;
  created_at: string;
}

export interface ContractFileUpload {
  contract_id: string;
  file: File;
  description?: string;
}

export interface ContractCreate {
  contract_number: string;
  vehicle_id: number;
  customer_id: number;
  vin_number: string;
  customer_name: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  payment_amount: number;
  tax_amount: number;
  deposit_amount: number;
  status: 'active' | 'returned' | 'completed' | 'cancelled';
}

export interface ContractUpdate {
  contract_number?: string;
  vehicle_id?: number;
  customer_id?: number;
  vin_number?: string;
  customer_name?: string;
  customer_phone?: string;
  start_date?: string;
  end_date?: string;
  payment_amount?: number;
  tax_amount?: number;
  deposit_amount?: number;
  status?: 'active' | 'returned' | 'completed' | 'cancelled';
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'staff';
}

// For pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Form types
export interface LoginFormValues {
  username: string;
  password: string;
}