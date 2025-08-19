import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SPACES_CONFIG, generateFilePath, getPublicUrl, validateSpacesConfig } from './spaces-config';

// Validate configuration before initializing
const configErrors = validateSpacesConfig();
if (configErrors.length > 0) {
  console.warn('DigitalOcean Spaces configuration issues:', configErrors);
  console.warn('File upload functionality may not work properly. Please check your environment variables.');
}

// Initialize S3 client for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: SPACES_CONFIG.endpoint,
  region: SPACES_CONFIG.region,
  credentials: {
    accessKeyId: SPACES_CONFIG.accessKeyId,
    secretAccessKey: SPACES_CONFIG.secretAccessKey,
  },
  forcePathStyle: false, // DigitalOcean Spaces uses virtual-hosted-style URLs
});

// Debug: Log the configuration being used
console.log('SpacesService - S3 Client Configuration:', {
  endpoint: SPACES_CONFIG.endpoint,
  region: SPACES_CONFIG.region,
  accessKeyId: SPACES_CONFIG.accessKeyId ? `${SPACES_CONFIG.accessKeyId.substring(0, 8)}...` : 'NOT SET',
  secretAccessKey: SPACES_CONFIG.secretAccessKey ? 'SET' : 'NOT SET',
  bucket: SPACES_CONFIG.bucket,
  isConfigured: configErrors.length === 0,
  configErrors
});



export interface UploadResult {
  fileUrl: string;
  filePath: string;
  fileSize: number;
  fileType: string;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  description?: string;
  uploadedBy: string;
}

export class SpacesService {
  /**
   * Test the connection to DigitalOcean Spaces
   */
  static async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('SpacesService is not configured');
      return false;
    }

    try {
      console.log('Testing connection to DigitalOcean Spaces...');
      
      // Try to list objects in the bucket (this is a lightweight operation)
      const listCommand = new GetObjectCommand({
        Bucket: SPACES_CONFIG.bucket,
        Key: 'test-connection.txt', // This file probably doesn't exist, but that's okay
      });

      await s3Client.send(listCommand);
      console.log('Connection test successful!');
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        // This is expected - the test file doesn't exist, but connection works
        console.log('Connection test successful! (404 is expected for non-existent file)');
        return true;
      } else {
        console.error('Connection test failed:', error);
        return false;
      }
    }
  }

  /**
   * Check if the service is properly configured
   */
  static isConfigured(): boolean {
    return configErrors.length === 0;
  }

  /**
   * Get configuration errors
   */
  static getConfigurationErrors(): string[] {
    return [...configErrors];
  }

  /**
   * Upload a file to DigitalOcean Spaces
   */
  static async uploadFile(
    contractId: string,
    file: File,
    metadata: FileMetadata
  ): Promise<UploadResult> {
    if (!this.isConfigured()) {
      throw new Error('DigitalOcean Spaces is not properly configured. Please check your environment variables.');
    }

    // Validate contractId
    if (!contractId || typeof contractId !== 'string') {
      throw new Error('Invalid contractId: must be a non-empty string');
    }

    // Validate file object
    if (!file || !file.name || !file.size || !file.type) {
      throw new Error('Invalid file object: missing required properties (name, size, or type)');
    }

    // Debug: Log input parameters
    console.log('SpacesService.uploadFile - Input parameters:', {
      contractId,
      contractIdType: typeof contractId,
      contractIdLength: contractId.length,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      metadata
    });

          // Debug: Log file object details
      console.log('SpacesService.uploadFile - File object:', {
        constructor: file.constructor.name,
        isFile: file instanceof File,
        isBlob: file instanceof Blob,
        hasStream: typeof file.stream === 'function',
        hasArrayBuffer: typeof file.arrayBuffer === 'function',
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Additional file type debugging
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      console.log('File extension analysis:', {
        filename: file.name,
        extension: fileExtension,
        mimeType: file.type,
        isImageByExtension: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension || ''),
        isImageByMimeType: file.type && file.type.startsWith('image/'),
        shouldBeImage: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension || '') || (file.type && file.type.startsWith('image/'))
      });

    try {
      const filePath = generateFilePath(contractId, file.name);
      console.log('Generated file path:', filePath);
      console.log('File path components:', {
        contractId,
        filename: file.name,
        sanitizedFilename: file.name.replace(/[^a-zA-Z0-9.-]/g, '_'),
        timestamp: Date.now()
      });
      
      // Validate file path for safety
      if (!filePath || filePath.includes('..') || filePath.includes('//')) {
        throw new Error('Invalid file path generated');
      }
      
      // Additional file path validation
      console.log('File path validation:', {
        filePath,
        hasTrailingSlash: filePath.endsWith('/'),
        hasDoubleSlash: filePath.includes('//'),
        hasParentDir: filePath.includes('..'),
        pathLength: filePath.length,
        isSafe: !filePath.includes('..') && !filePath.includes('//') && filePath.length > 0
      });
      
      // Convert file to ArrayBuffer to ensure compatibility with S3 client
      console.log('Converting file to ArrayBuffer...');
      const fileBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileBuffer);
      console.log('File converted to Uint8Array, size:', uint8Array.length);
      
      // Create the upload command
      console.log('Creating PutObjectCommand...');
      // Sanitize metadata to ensure only ISO-8859-1 characters
      const sanitizeMetadata = (value: string): string => {
        if (!value) return '';
        
        // Convert to string if it's not already
        const stringValue = String(value);
        
        // Remove or replace non-ISO-8859-1 characters
        const sanitized = stringValue
          .replace(/[^\x00-\xFF]/g, '') // Remove non-ISO-8859-1 characters
          .replace(/[^\x20-\x7E]/g, '') // Remove control characters except space
          .replace(/[^\w\s\-\.]/g, '_') // Replace special characters with underscore
          .trim();
        
        // Ensure the result is not empty
        return sanitized || 'unknown';
      };

      // Debug: Log metadata before sanitization
      console.log('Metadata before sanitization:', {
        'original-filename': file.name,
        'description': metadata.description || '',
        'uploaded-by': metadata.uploadedBy,
        'contract-id': contractId,
        'upload-date': new Date().toISOString(),
      });

      // Debug: Log metadata after sanitization
      const sanitizedMetadata = {
        'original-filename': sanitizeMetadata(file.name),
        'description': sanitizeMetadata(metadata.description || ''),
        'uploaded-by': sanitizeMetadata(metadata.uploadedBy),
        'contract-id': sanitizeMetadata(contractId),
        'upload-date': new Date().toISOString(),
      };
      console.log('Metadata after sanitization:', sanitizedMetadata);

      // Ensure ContentType is safe and set ContentDisposition for PDFs
      let safeContentType = file.type || 'application/octet-stream';
      
      // If file.type is missing or generic, try to detect from file extension
      if (!file.type || file.type === 'application/octet-stream') {
        const fileExtension = file.name.toLowerCase().split('.').pop();
        if (fileExtension === 'pdf') {
          safeContentType = 'application/pdf';
        } else if (['jpg', 'jpeg'].includes(fileExtension || '')) {
          safeContentType = 'image/jpeg';
        } else if (fileExtension === 'png') {
          safeContentType = 'image/png';
        }
      }
      
      // Set ContentDisposition to 'inline' for PDFs and images so they display in browser
      const contentDisposition = (safeContentType === 'application/pdf' || safeContentType.startsWith('image/')) ? 'inline' : 'attachment';
      
      const uploadCommand = new PutObjectCommand({
        Bucket: SPACES_CONFIG.bucket,
        Key: filePath,
        Body: uint8Array,
        ContentType: safeContentType,
        ContentDisposition: contentDisposition,
        Metadata: sanitizedMetadata,
        ACL: 'public-read', // Make the file publicly accessible
      });
      console.log('PutObjectCommand created successfully');
      console.log('File type detection:', {
        originalFileType: file.type,
        fileName: file.name,
        detectedContentType: safeContentType,
        contentDisposition: contentDisposition
      });
      
      console.log('Upload command details:', {
        Bucket: SPACES_CONFIG.bucket,
        Key: filePath,
        ContentType: safeContentType,
        ContentDisposition: contentDisposition,
        BodySize: uint8Array.length,
        MetadataKeys: Object.keys(sanitizedMetadata)
      });

      // Upload the file
      console.log('Attempting to upload to S3...');
      await s3Client.send(uploadCommand);
      console.log('File uploaded successfully to S3');

      // Get the public URL
      const fileUrl = getPublicUrl(filePath);
      console.log('Generated public URL:', fileUrl);

      return {
        fileUrl,
        filePath,
        fileSize: file.size,
        fileType: file.type,
      };
    } catch (error) {
      console.error('Error uploading file to Spaces:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('non ISO-8859-1 code point')) {
          console.error('This error suggests there are non-ASCII characters in the metadata or file path');
          console.error('Please check the file name, description, and other metadata for special characters');
        } else if (error.message.includes('InvalidAccessKeyId')) {
          console.error('Invalid access key ID - check your VITE_SPACES_ACCESS_KEY_ID environment variable');
        } else if (error.message.includes('SignatureDoesNotMatch')) {
          console.error('Signature mismatch - check your VITE_SPACES_SECRET_ACCESS_KEY environment variable');
        } else if (error.message.includes('NoSuchBucket')) {
          console.error('Bucket not found - check your VITE_SPACES_BUCKET environment variable');
        }
      }
      
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a file from DigitalOcean Spaces
   */
  static async deleteFile(filePath: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error('DigitalOcean Spaces is not properly configured. Please check your environment variables.');
    }

    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: SPACES_CONFIG.bucket,
        Key: filePath,
      });

      await s3Client.send(deleteCommand);
    } catch (error) {
      console.error('Error deleting file from Spaces:', error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a presigned URL for downloading a file
   */
  static async generateDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('DigitalOcean Spaces is not properly configured. Please check your environment variables.');
    }

    try {
      const getCommand = new GetObjectCommand({
        Bucket: SPACES_CONFIG.bucket,
        Key: filePath,
      });

      const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file metadata from DigitalOcean Spaces
   */
  static async getFileMetadata(filePath: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('DigitalOcean Spaces is not properly configured. Please check your environment variables.');
    }

    try {
      const headCommand = new GetObjectCommand({
        Bucket: SPACES_CONFIG.bucket,
        Key: filePath,
      });

      const response = await s3Client.send(headCommand);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a file exists in DigitalOcean Spaces
   */
  static async fileExists(filePath: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('DigitalOcean Spaces is not properly configured. Please check your environment variables.');
    }

    try {
      const headCommand = new GetObjectCommand({
        Bucket: SPACES_CONFIG.bucket,
        Key: filePath,
      });

      await s3Client.send(headCommand);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * List files in a contract folder
   */
  static async listContractFiles(contractId: string): Promise<string[]> {
    if (!this.isConfigured()) {
      throw new Error('DigitalOcean Spaces is not properly configured. Please check your environment variables.');
    }

    try {
      // Note: This is a simplified implementation
      // For production, you might want to use ListObjectsV2Command
      // and implement proper pagination
      const prefix = `contracts/${contractId}/files/`;
      
      // For now, we'll return an empty array as the actual implementation
      // would require additional AWS SDK commands
      return [];
    } catch (error) {
      console.error('Error listing contract files:', error);
      throw new Error(`Failed to list contract files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
