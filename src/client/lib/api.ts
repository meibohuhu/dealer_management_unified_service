import { 
  Vehicle, 
  VehicleCreate, 
  VehicleUpdate,
  Customer,
  CustomerCreate,
  CustomerUpdate,
  Contract,
  ContractDetail,
  ContractCreate,
  ContractUpdate,
  ContractFile,
  ContractFileUpload,
  PaginatedResponse
} from "../types";
import { SpacesService } from "./spaces-service";

// Base API URL - from environment variables
// For production, this should point to your deployed backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Debug: Log API configuration
console.log('[API CONFIG] Base URL:', API_BASE_URL);
console.log('[API CONFIG] Environment variables:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_SPACES_ENDPOINT: import.meta.env.VITE_SPACES_ENDPOINT,
  VITE_SPACES_BUCKET: import.meta.env.VITE_SPACES_BUCKET,
  NODE_ENV: import.meta.env.MODE
});

// Helper function for handling API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API error: ${response.status} ${response.statusText}`
    );
  }
  
  // For DELETE operations or responses with no content, return undefined
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    console.log(`[API RESPONSE] No content (${response.status})`);
    return undefined as T;
  }
  
  // Try to parse JSON response
  try {
    const data = await response.json();
    console.log(`[API RESPONSE]`, data);
    return data;
  } catch (error) {
    // If response is empty or not JSON, return undefined
    console.log(`[API RESPONSE] Empty or non-JSON response`);
    return undefined as T;
  }
}

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  console.log(`[API CALL] ${method} ${url}`, { body, config });
  
  try {
    const response = await fetch(url, config);
    console.log(`[API RESPONSE] ${method} ${url}`, { status: response.status, statusText: response.statusText });
    
    return handleResponse<T>(response);
  } catch (error) {
    console.error(`[API ERROR] ${method} ${url}`, error);
    throw error;
  }
}

// Vehicle API
export const vehicleApi = {
  create: (vehicle: VehicleCreate) => 
    apiCall<Vehicle>("/vehicles/new", "POST", vehicle),
  
  getAll: () => 
    apiCall<Vehicle[]>("/vehicles"),
  
  getById: (id: string) => 
    apiCall<Vehicle>(`/vehicles/${id}`),
  
  getByVin: (vin: string) => 
    apiCall<Vehicle>(`/vehicles/vin/${vin}`),
  
  update: (id: string, data: VehicleUpdate) => 
    apiCall<Vehicle>(`/vehicles/${id}`, "PUT", data),
  
  delete: (id: string) => 
    apiCall<void>(`/vehicles/${id}`, "DELETE")
};

// Customer API
export const customerApi = {
  create: (customer: CustomerCreate) => 
    apiCall<Customer>("/customers/new", "POST", customer),
  
  getAll: () => 
    apiCall<Customer[]>("/customers"),
  
  getById: (id: string) => 
    apiCall<Customer>(`/customers/${id}`),
  
  getByPhone: (phone: string) => 
    apiCall<Customer>(`/customers/phone/${phone}`),
  
  searchByName: (name: string) => 
    apiCall<Customer[]>(`/customers/search/${name}`),
  
  update: (id: string, data: CustomerUpdate) => 
    apiCall<Customer>(`/customers/${id}`, "PUT", data),
  
  delete: (id: string) => 
    apiCall<void>(`/customers/${id}`, "DELETE")
};

// Contract API
export const contractApi = {
  create: (contract: ContractCreate) => 
    apiCall<Contract>("/contracts/new", "POST", contract),
  
  getAll: async (skip: number = 0, limit: number = 10) => {
    const data = await apiCall<Contract[]>(`/contracts?skip=${skip}&limit=${limit}`);
    return {
      data,
      total: data.length, // Or get total from backend if available
    };
  },
  
  getById: (id: string) => 
    apiCall<ContractDetail>(`/contracts/${id}`),
  
  getByVin: (vin: string) => 
    apiCall<Contract[]>(`/contracts/vin/${vin}`),
  
  update: (id: string, data: ContractUpdate) => 
    apiCall<Contract>(`/contracts/${id}`, "PUT", data),
  
  delete: (id: string) => 
    apiCall<void>(`/contracts/${id}`, "DELETE")
};

// Contract Files API
export const contractFileApi = {
  upload: async (fileData: ContractFileUpload): Promise<ContractFile> => {
    try {
      // Validate file object
      if (!fileData.file || !fileData.file.name || !fileData.file.size || !fileData.file.type) {
        throw new Error('Invalid file object: missing required properties (name, size, or type)');
      }

      console.log('API upload - Using server-side upload:', {
        fileName: fileData.file.name,
        fileSize: fileData.file.size,
        fileType: fileData.file.type,
        contractId: fileData.contract_id
      });

      // Create FormData for server-side upload
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('contract_id', fileData.contract_id);
      formData.append('description', fileData.description || '');
      formData.append('uploaded_by', 'admin'); // This should come from auth context

      // Upload via server endpoint (bypasses CORS issues)
      const response = await fetch(`${API_BASE_URL}/contract-files/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Server upload successful:', result);

      return result.file;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  getByContract: async (contractId: string): Promise<ContractFile[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/contract-files/contract/${contractId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching contract files:", error);
      throw new Error(`Failed to fetch contract files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  delete: async (contractId: string, fileId: string): Promise<void> => {
    try {
      // In a real implementation, you would:
      // 1. Get the file record from your backend to get the file path
      // 2. Delete from DigitalOcean Spaces
      // 3. Delete the record from your backend
      
      // For now, we'll just simulate the deletion
      console.log(`Deleting file ${fileId} from contract ${contractId}`);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  
  download: async (contractId: string, fileId: string, fileName: string): Promise<void> => {
    try {
      // Get the file list to find the file URL
      const files = await contractFileApi.getByContract(contractId);
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        throw new Error('File not found');
      }
      
      console.log(`Downloading file ${fileName} from URL: ${file.file_url}`);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = fileName;
      link.target = '_blank'; // Open in new tab if download fails
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Mock API for hardcoded authentication (as requested)
export const authApi = {
  login: async (username: string, password: string) => {
    // Hardcoded authentication
    if (username === "admin" && password === "pangshu123") {
      return {
        id: "1",
        username: "admin",
        name: "Admin User",
        role: "admin" as const
      };
    } else if (username === "staff" && password === "password") {
      return {
        id: "2",
        username: "staff",
        name: "Staff User",
        role: "staff" as const
      };
    } else {
      throw new Error("Invalid credentials");
    }
  }
};