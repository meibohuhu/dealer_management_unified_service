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
    
    // For now, we'll return a success response
    // In a full implementation, you would:
    // 1. Upload the file to DigitalOcean Spaces
    // 2. Save the file metadata to the database
    // 3. Return the file information
    
    const fileInfo = {
      id: Math.random().toString(36).substr(2, 9),
      contract_id: validatedData.contract_id,
      file_name: req.file.originalname,
      file_url: `https://example.com/files/${req.file.originalname}`, // Placeholder
      file_size: req.file.size,
      file_type: req.file.mimetype,
      description: validatedData.description || '',
      uploaded_by: validatedData.uploaded_by,
      image_path: `contracts/${validatedData.contract_id}/files/${Date.now()}_${req.file.originalname}`,
      uploaded_at: new Date().toISOString()
    };

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
    } else if (error instanceof Error && error.message.includes('Invalid file type')) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Internal server error' });
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
