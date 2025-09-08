import React from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "./button";
import { ContractFile } from "@/types";

interface FilePreviewModalProps {
  file: ContractFile | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: ContractFile) => Promise<void>;
}

export function FilePreviewModal({
  file,
  isOpen,
  onClose,
  onDownload,
}: FilePreviewModalProps) {
  if (!file || !isOpen) return null;

  const isImage = file.file_type.startsWith('image/');
  const isPDF = file.file_type.includes('pdf');
  const isText = file.file_type.startsWith('text/');
  const canPreview = isImage || isPDF || isText;

  const handleDownload = async () => {
    await onDownload(file);
  };

  const openInNewTab = () => {
    window.open(file.file_url, '_blank');
  };

  // Test PDF accessibility and headers
  const testPdfHeaders = async () => {
    if (!file?.file_url) return;
    
    try {
      const response = await fetch(file.file_url, { method: 'HEAD' });
      console.log('PDF headers test:', {
        url: file.file_url,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentDisposition: response.headers.get('content-disposition'),
        headers: Object.fromEntries(response.headers.entries())
      });
    } catch (error) {
      console.error('PDF headers test failed:', error);
    }
  };

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="flex justify-center">
          <img
            src={file.file_url}
            alt={file.file_name}
            className="max-h-[70vh] max-w-full object-contain rounded-lg"
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="w-full h-[70vh] flex flex-col">
          {/* PDF Viewer with iframe */}
          <div className="flex-1 overflow-auto bg-muted/20">
            <iframe
              src={`${file.file_url}#toolbar=1&navpanes=1&scrollbar=1&embedded=true`}
              className="w-full h-full border-0"
              title={file.file_name}
              onLoad={() => console.log('PDF iframe loaded successfully')}
              onError={(e) => console.error('PDF iframe error:', e)}
            />
          </div>
          
          {/* Fallback options if iframe doesn't work */}
          <div className="p-3 border-t bg-muted/50">
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={testPdfHeaders}>
                🔍 Test Headers
              </Button>
              <Button variant="outline" size="sm" onClick={openInNewTab}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in New Tab
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (isText) {
      return (
        <div className="w-full h-[70vh] overflow-auto">
          <pre className="p-4 bg-muted rounded-lg text-sm font-mono whitespace-pre-wrap">
            {/* For text files, you might want to fetch and display the content */}
            <p className="text-muted-foreground">
              Text file preview not available. Please download to view content.
            </p>
          </pre>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📄</span>
        </div>
        <h3 className="text-lg font-medium mb-2">File Preview Not Available</h3>
        <p className="text-muted-foreground mb-4">
          This file type cannot be previewed. Please download it to view the content.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={openInNewTab}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{file.file_name}</h2>
            <p className="text-sm text-muted-foreground">
              {file.description || 'No description'}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {renderPreview()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Size: {formatFileSize(file.file_size)}</span>
              <span>Type: {file.file_type}</span>
              <span>Uploaded: {formatDate(file.created_at)}</span>
            </div>
            <span>By: {file.uploaded_by}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}
