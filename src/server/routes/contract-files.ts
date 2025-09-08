import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ContractImage } from '../models/ContractImage';

export const createContractFilesRouter = () => {
  const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and common document types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Validation schemas
const FileUploadSchema = z.object({
  contract_id: z.string().min(1),
  description: z.string().optional(),
  uploaded_by: z.string().min(1)
});

// Upload file for a contract
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const validatedData = FileUploadSchema.parse(req.body);
    
    console.log('Server-side file upload started:', {
      fileName: req.file.originalname,
      fileSize: req.file.size,
      contractId: validatedData.contract_id
    });

    // Check required environment variables
    const spacesEndpoint = process.env.VITE_SPACES_ENDPOINT;
    const spacesRegion = process.env.VITE_SPACES_REGION;
    const spacesAccessKey = process.env.VITE_SPACES_ACCESS_KEY_ID;
    const spacesSecretKey = process.env.VITE_SPACES_SECRET_ACCESS_KEY;
    const bucketName = process.env.VITE_SPACES_BUCKET || 'dealermanagementsystem';

    console.log('Environment variables check:', {
      hasEndpoint: !!spacesEndpoint,
      hasRegion: !!spacesRegion,
      hasAccessKey: !!spacesAccessKey,
      hasSecretKey: !!spacesSecretKey,
      hasBucket: !!bucketName,
      endpoint: spacesEndpoint,
      region: spacesRegion,
      bucket: bucketName
    });

    if (!spacesEndpoint || !spacesAccessKey || !spacesSecretKey || !bucketName) {
      throw new Error('Missing required DigitalOcean Spaces environment variables');
    }

    // Upload file to DigitalOcean Spaces via server
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      endpoint: spacesEndpoint,
      region: spacesRegion || 'sfo3',
      credentials: {
        accessKeyId: spacesAccessKey,
        secretAccessKey: spacesSecretKey
      }
    });
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const filePath = `contracts/${validatedData.contract_id}/files/${fileName}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read',
      Metadata: {
        'original-name': req.file.originalname,
        'uploaded-by': validatedData.uploaded_by,
        'contract-id': validatedData.contract_id,
        'description': validatedData.description || ''
      }
    });

    await s3Client.send(uploadCommand);
    console.log('File uploaded to Spaces successfully:', filePath);

    // Generate public URL using CDN endpoint if available
    const cdnEndpoint = process.env.VITE_SPACES_CDN_ENDPOINT;
    const fileUrl = cdnEndpoint 
      ? `${cdnEndpoint}/${filePath}`
      : `${process.env.VITE_SPACES_ENDPOINT}/${bucketName}/${filePath}`;
    
    const fileInfo = {
      id: Math.random().toString(36).substr(2, 9),
      contract_id: validatedData.contract_id,
      file_name: req.file.originalname,
      file_url: fileUrl,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      description: validatedData.description || '',
      uploaded_by: validatedData.uploaded_by,
      image_path: filePath,
      uploaded_at: new Date().toISOString()
    };

    console.log('File upload completed:', fileInfo);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else if (error instanceof Error && error.message.includes('Invalid file type')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) });
    }
  }
});

// Get all files for a contract
router.get('/contract/:contractId', async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    
    // Return empty array - no example files
    // In a full implementation, you would query the database for actual uploaded files
    res.json([]);
  } catch (error) {
    console.error('Error fetching contract files:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a file
router.delete('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    // For now, return success
    // In a full implementation, you would:
    // 1. Delete the file from DigitalOcean Spaces
    // 2. Remove the file record from the database
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get file by ID
router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    // For now, return mock data
    // In a full implementation, you would query the database
    const mockFile: ContractImage = {
      id: parseInt(fileId),
      contract_id: 1,
      file_name: "sample_file.pdf",
      file_url: "https://example.com/files/sample_file.pdf",
      file_size: 1024 * 1024, // 1MB
      file_type: "application/pdf",
      description: "Sample file",
      uploaded_by: "admin",
      image_path: "contracts/1/files/sample_file.pdf",
      uploaded_at: new Date()
    };

    res.json(mockFile);
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  return router;
};
