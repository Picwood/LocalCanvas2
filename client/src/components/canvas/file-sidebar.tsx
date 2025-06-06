import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type UploadedFile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Upload, RefreshCw, FileText, Image, FileType, Trash2 } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";

interface FileSidebarProps {
  onFileSelect: (file: UploadedFile) => void;
}

export function FileSidebar({ onFileSelect }: FileSidebarProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const { data: files = [], isLoading, refetch } = useQuery<UploadedFile[]>({
    queryKey: ["/api/files"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      const res = await apiRequest("POST", "/api/files/upload", formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Files Uploaded",
        description: "Your files have been uploaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File Deleted",
        description: "The file has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (files: FileList) => {
    if (files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFileUpload(files);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4 text-green-400" />;
    } else if (mimeType === 'application/pdf') {
      return <FileType className="w-4 h-4 text-red-400" />;
    } else {
      return <FileText className="w-4 h-4 text-blue-400" />;
    }
  };

  const getFileIconBg = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return 'bg-green-500/20';
    } else if (mimeType === 'application/pdf') {
      return 'bg-red-500/20';
    } else {
      return 'bg-blue-500/20';
    }
  };

  return (
    <aside className="w-80 bg-canvas-surface border-r border-canvas-border flex flex-col">
      {/* Files Header */}
      <div className="p-4 border-b border-canvas-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-canvas-text">Files & Assets</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-1 hover:bg-canvas-border text-canvas-text"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-500/10'
              : 'border-canvas-border hover:border-indigo-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-6 h-6 text-canvas-text-muted mx-auto mb-2" />
          <p className="text-xs text-canvas-text-muted">
            {uploadMutation.isPending
              ? 'Uploading...'
              : 'Drop files here or click to upload'
            }
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".md,.pdf,.png,.jpg,.jpeg,.gif,.svg"
            onChange={handleFileInputChange}
          />
        </div>
      </div>
      
      {/* File List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center text-canvas-text-muted py-8">
              Loading files...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center text-canvas-text-muted py-8">
              No files uploaded yet
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className="flex items-center p-2 hover:bg-canvas-border rounded-lg cursor-pointer transition-colors group"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(file));
                }}
                onClick={() => onFileSelect(file)}
              >
                <div className={`w-8 h-8 rounded flex items-center justify-center mr-3 ${getFileIconBg(file.mimeType)}`}>
                  {getFileIcon(file.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate text-canvas-text">{file.originalName}</p>
                  <p className="text-xs text-canvas-text-muted">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMutation.mutate(file.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 h-auto hover:bg-red-500/20 text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
