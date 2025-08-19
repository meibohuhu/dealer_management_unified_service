// DigitalOcean Spaces Configuration
export const SPACES_CONFIG = {
  // Your DigitalOcean Spaces endpoint
  endpoint: import.meta.env.VITE_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
  
  // Your bucket name
  bucket: import.meta.env.VITE_SPACES_BUCKET || 'your-bucket-name',
  
  // Your access key ID
  accessKeyId: import.meta.env.VITE_SPACES_ACCESS_KEY_ID || '',
  
  // Your secret access key
  secretAccessKey: import.meta.env.VITE_SPACES_SECRET_ACCESS_KEY || '',
  
  // Region (e.g., nyc3, sgp1, fra1)
  region: import.meta.env.VITE_SPACES_REGION || 'nyc3',
  
  // CDN endpoint if you have one configured
  cdnEndpoint: import.meta.env.VITE_SPACES_CDN_ENDPOINT || '',
};

// Validate configuration
export function validateSpacesConfig(): string[] {
  const errors: string[] = [];
  
  if (!SPACES_CONFIG.accessKeyId) {
    errors.push('VITE_SPACES_ACCESS_KEY_ID is required');
  }
  
  if (!SPACES_CONFIG.secretAccessKey) {
    errors.push('VITE_SPACES_SECRET_ACCESS_KEY is required');
  }
  
  if (!SPACES_CONFIG.bucket || SPACES_CONFIG.bucket === 'your-bucket-name') {
    errors.push('VITE_SPACES_BUCKET must be set to your actual bucket name');
  }
  
  if (!SPACES_CONFIG.endpoint || SPACES_CONFIG.endpoint.includes('nyc3.digitaloceanspaces.com')) {
    errors.push('VITE_SPACES_ENDPOINT must be set to your actual endpoint');
  }
  
  return errors;
}

// File upload configuration
export const UPLOAD_CONFIG = {
  // Maximum file size (25MB)
  maxFileSize: 25 * 1024 * 1024,
  
  // Allowed file types
  allowedTypes: [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/*',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  
  // Maximum number of files per contract
  maxFilesPerContract: 10,
  
  // File path structure in the bucket
  filePath: 'contracts/{contractId}/files/{timestamp}_{filename}',
};

// Helper function to generate file paths
export function generateFilePath(contractId: string, filename: string): string {
  // Validate inputs
  if (!contractId || !filename) {
    throw new Error('contractId and filename are required');
  }
  
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `contracts/${contractId}/files/${timestamp}_${sanitizedFilename}`;
}

// Helper function to get public URL for a file
export function getPublicUrl(filePath: string): string {
  if (SPACES_CONFIG.cdnEndpoint) {
    return `${SPACES_CONFIG.cdnEndpoint}/${filePath}`;
  }
  return `${SPACES_CONFIG.endpoint}/${SPACES_CONFIG.bucket}/${filePath}`;
}

// Helper function to check if configuration is valid
export function isSpacesConfigValid(): boolean {
  return validateSpacesConfig().length === 0;
}
