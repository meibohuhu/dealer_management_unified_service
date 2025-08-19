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
  // Read and log the response body
  const data = await response.clone().json().catch(() => ({}));
  console.log(`[API RESPONSE]`, data);
  return response.json() as Promise<T>;
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

      // Debug: Log file object details
      console.log('API upload - File object:', {
        constructor: fileData.file.constructor.name,
        isFile: fileData.file instanceof File,
        isBlob: fileData.file instanceof Blob,
        hasStream: typeof fileData.file.stream === 'function',
        hasArrayBuffer: typeof fileData.file.arrayBuffer === 'function',
        name: fileData.file.name,
        size: fileData.file.size,
        type: fileData.file.type
      });

      // Upload file to DigitalOcean Spaces
      const uploadResult = await SpacesService.uploadFile(
        fileData.contract_id,
        fileData.file,
        {
          fileName: fileData.file.name,
          fileSize: fileData.file.size,
          fileType: fileData.file.type,
          description: fileData.description,
          uploadedBy: 'admin', // This should come from auth context
        }
      );

      // Create the contract file record
      const contractFile: ContractFile = {
        id: Math.random().toString(36).substr(2, 9), // This should come from backend
        contract_id: fileData.contract_id,
        file_name: fileData.file.name,
        file_url: uploadResult.fileUrl,
        file_size: uploadResult.fileSize,
        file_type: uploadResult.fileType,
        description: fileData.description,
        uploaded_by: 'admin', // This should come from auth context
        created_at: new Date().toISOString(),
      };

      return contractFile;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  getByContract: async (contractId: string): Promise<ContractFile[]> => {
    try {
      // In a real implementation, this would fetch from your backend
      // For now, we'll return mock data
      return [
        {
          id: "file1",
          contract_id: contractId,
          file_name: "contract_agreement.pdf",
          file_url: "https://example.com/files/contract_agreement.pdf",
          file_size: 1024 * 1024, // 1MB
          file_type: "application/pdf",
          description: "Signed contract agreement",
          uploaded_by: "admin",
          created_at: "2023-05-30T10:35:00Z",
        },
        {
          id: "file2",
          contract_id: contractId,
          file_name: "vehicle_inspection.jpg",
          file_url: "https://via.placeholder.com/800x600?text=Vehicle+Inspection",
          file_size: 512 * 1024, // 512KB
          file_type: "image/jpeg",
          description: "Vehicle inspection photos",
          uploaded_by: "staff",
          created_at: "2023-05-30T11:00:00Z",
        }
      ];
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
      // In a real implementation, you would:
      // 1. Get the file record from your backend to get the file path
      // 2. Generate a presigned download URL from DigitalOcean Spaces
      // 3. Trigger the download
      
      // For now, we'll simulate the download
      console.log(`Downloading file ${fileName} from contract ${contractId}`);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = `data:text/plain;charset=utf-8,${encodeURIComponent('This is a simulated download. In production, this would be the actual file from DigitalOcean Spaces.')}`;
      link.download = fileName;
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
    if (username === "admin" && password === "password") {
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