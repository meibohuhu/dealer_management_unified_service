import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File, FileText, Image, FileImage, Loader2 } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";

interface FileUploadProps {
  onFileUpload: (file: File, description?: string) => Promise<void>;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  className?: string;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

export function FileUpload({
  onFileUpload,
  acceptedFileTypes = ["*/*"],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  className = "",
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Accepted files:', acceptedFiles);
    console.log('File types:', acceptedFiles.map(f => ({ name: f.name, type: f.type, size: f.size })));
    console.log('Accepted file types config:', acceptedFileTypes);
    
    // Additional debugging for file type detection
    acceptedFiles.forEach(file => {
      console.log(`File: ${file.name}`);
      console.log(`  - MIME type: ${file.type}`);
      console.log(`  - File extension: ${file.name.split('.').pop()?.toLowerCase()}`);
      console.log(`  - Is image: ${file.type.startsWith('image/')}`);
      console.log(`  - File size: ${file.size} bytes`);
    });
    
    const newFiles = acceptedFiles
      .filter(file => file && typeof file === 'object' && 'name' in file && 'size' in file && 'type' in file) // Ensure we only process valid File objects
      .map(file => {
        // Create a wrapper object that contains the original File object
        const fileWithId: FileWithPreview = {
          file: file,
          id: Math.random().toString(36).substr(2, 9),
          preview: isImageFile(file) ? URL.createObjectURL(file) : undefined
        };
        
        return fileWithId;
      });
    
    console.log('Processed files:', newFiles);
    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles, acceptedFileTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      if (type === "*/*") return acc;
      // For react-dropzone v14, we need to map MIME types to file extensions
      if (type === "image/*") {
        acc[type] = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg"];
      } else if (type === "application/pdf") {
        acc[type] = [".pdf"];
      } else if (type === "application/msword") {
        acc[type] = [".doc"];
      } else if (type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        acc[type] = [".docx"];
      } else if (type === "text/*") {
        acc[type] = [".txt", ".md", ".json", ".xml", ".csv"];
      } else {
        acc[type] = [];
      }
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    maxFiles,
    validator: (file) => {
      // Additional validation to help debug file type issues
      console.log(`Validating file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      
      // Check if file is an image by extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'png' && (!file.type || file.type === 'application/octet-stream')) {
        console.log('PNG file detected by extension, but MIME type is not image/png');
        // Force the file type for PNG files
        Object.defineProperty(file, 'type', {
          value: 'image/png',
          writable: true
        });
        console.log('Updated file type to image/png');
      }
      
      return null; // Return null to accept the file
    },
    onDropRejected: (rejectedFiles) => {
      console.log('Rejected files:', rejectedFiles);
      rejectedFiles.forEach(({ file, errors }) => {
        console.log(`File ${file.name} was rejected:`, errors);
        errors.forEach(error => {
          console.log(`  - Error code: ${error.code}, Message: ${error.message}`);
          if (error.code === 'file-too-large') {
            alert(`File ${file.name} is too large. Max size is ${Math.round(maxFileSize / 1024 / 1024)}MB`);
          } else if (error.code === 'file-invalid-type') {
            alert(`File ${file.name} has an invalid type. Expected: ${acceptedFileTypes.join(', ')}`);
          } else if (error.code === 'too-many-files') {
            alert(`Too many files. Max is ${maxFiles}`);
          }
        });
      });
    }
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
    setDescriptions(prev => {
      const newDesc = { ...prev };
      delete newDesc[fileId];
      return newDesc;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    console.log('Uploading files:', files.map(f => ({ name: f.file.name, type: f.file.type, size: f.file.size, id: f.id })));
    
    setUploading(true);
    try {
      for (const file of files) {
        console.log('Uploading file:', file);
        
        // Safety check to ensure file.file exists and has required properties
        if (!file.file || !file.file.name || !file.file.size || !file.file.type) {
          console.error('Invalid file object:', file);
          continue; // Skip this file and continue with the next one
        }
        
        console.log('File object details:', {
          constructor: file.file.constructor.name,
          hasName: 'name' in file.file,
          hasSize: 'size' in file.file,
          hasType: 'type' in file.file,
          hasStream: typeof file.file.stream === 'function',
          hasArrayBuffer: typeof file.file.arrayBuffer === 'function',
          name: file.file.name,
          size: file.file.size,
          type: file.file.type
        });
        await onFileUpload(file.file, descriptions[file.id] || "");
      }
      
      // Clear files after successful upload
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
      setFiles([]);
      setDescriptions({});
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    // Add null check for file.type
    if (!file || !file.type) {
      return <File className="h-4 w-4" />;
    }
    
    // Check for image files (including PNG)
    if (isImageFile(file)) return <Image className="h-4 w-4" />;
    
    if (file.type.startsWith('text/')) return <FileText className="h-4 w-4" />;
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (file.type.includes('word') || file.type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to check if a file is an image
  const isImageFile = (file: File): boolean => {
    // Check MIME type first
    if (file.type && file.type.startsWith('image/')) {
      return true;
    }
    
    // Fallback to file extension check
    const extension = file.name.split('.').pop()?.toLowerCase();
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive || dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          or click to browse files
        </p>
        <p className="text-xs text-muted-foreground">
          Max file size: {Math.round(maxFileSize / 1024 / 1024)}MB • Max files: {maxFiles}
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Files to upload ({files.length})</h4>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="ml-auto"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload All
                </>
              )}
            </Button>
          </div>

          {files.filter(file => file && file.file && typeof file.file === 'object' && 'name' in file.file && 'size' in file.file && 'type' in file.file).map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="h-12 w-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-muted rounded border flex items-center justify-center">
                        {getFileIcon(file.file)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-sm truncate">{file.file.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(file.file.size)}
                      </Badge>
                    </div>
                    
                    {/* Description Input */}
                    <div className="space-y-2">
                      <Label htmlFor={`desc-${file.id}`} className="text-xs text-muted-foreground">
                        Description (optional)
                      </Label>
                      <Textarea
                        id={`desc-${file.id}`}
                        placeholder="Add a description for this file..."
                        value={descriptions[file.id] || ""}
                        onChange={(e) => setDescriptions(prev => ({
                          ...prev,
                          [file.id]: e.target.value
                        }))}
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
