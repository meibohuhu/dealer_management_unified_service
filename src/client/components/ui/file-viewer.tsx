import React, { useState } from "react";
import { 
  Download, 
  Trash2, 
  Eye, 
  File, 
  FileText, 
  Image, 
  FileImage,
  Calendar,
  User,
  MoreHorizontal
} from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Separator } from "./separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ContractFile } from "@/types";

interface FileViewerProps {
  files: ContractFile[];
  onDownload: (file: ContractFile) => Promise<void>;
  onDelete: (file: ContractFile) => Promise<void>;
  onView?: (file: ContractFile) => void;
  className?: string;
}

export function FileViewer({
  files,
  onDownload,
  onDelete,
  onView,
  className = "",
}: FileViewerProps) {
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  const handleDownload = async (file: ContractFile) => {
    setDownloadingFiles(prev => new Set(prev).add(file.id));
    try {
      await onDownload(file);
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleDelete = async (file: ContractFile) => {
    if (!window.confirm(`Are you sure you want to delete "${file.file_name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingFiles(prev => new Set(prev).add(file.id));
    try {
      await onDelete(file);
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const getFileIcon = (file: ContractFile) => {
    if (file.file_type.startsWith('image/')) return <Image className="h-8 w-8" />;
    if (file.file_type.startsWith('text/')) return <FileText className="h-8 w-8" />;
    if (file.file_type.includes('pdf')) return <FileText className="h-8 w-8" />;
    if (file.file_type.includes('word') || file.file_type.includes('document')) return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null | undefined) => {
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
  };

  const getFileTypeBadge = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Badge variant="secondary">Image</Badge>;
    if (fileType.includes('pdf')) return <Badge variant="destructive">PDF</Badge>;
    if (fileType.includes('word') || fileType.includes('document')) return <Badge variant="outline">Document</Badge>;
    if (fileType.startsWith('text/')) return <Badge variant="outline">Text</Badge>;
    return <Badge variant="secondary">File</Badge>;
  };

  if (files.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <File className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No files uploaded</h3>
          <p className="text-muted-foreground">
            Upload files to associate with this contract
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Contract Files ({files.length})</h3>
      </div>

      <div className="grid gap-4">
        {files.map((file) => (
          <Card key={file.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 bg-muted rounded-lg border flex items-center justify-center">
                    {getFileIcon(file)}
                  </div>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate mb-1">
                        {file.file_name}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        {getFileTypeBadge(file.file_type)}
                        <Badge variant="outline" className="text-xs">
                          {formatFileSize(file.file_size)}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(file)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(file)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Description */}
                  {file.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {file.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(file.created_at)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {file.uploaded_by}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                {onView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(file)}
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingFiles.has(file.id)}
                  className="flex-1"
                >
                  {downloadingFiles.has(file.id) ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(file)}
                  disabled={deletingFiles.has(file.id)}
                  className="text-destructive hover:text-destructive"
                >
                  {deletingFiles.has(file.id) ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
