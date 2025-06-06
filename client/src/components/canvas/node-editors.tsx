import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type CanvasNodeType, type CanvasState } from "@/hooks/use-canvas";
import { type UploadedFile } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";

interface NodeEditorProps {
  node: CanvasNodeType;
  canvasState: CanvasState;
}

export function TextNodeEditor({ node, canvasState }: NodeEditorProps) {
  const [content, setContent] = useState(node.content);

  const handleContentChange = (value: string) => {
    setContent(value);
    canvasState.updateNode(node.id, { content: value });
  };

  return (
    <div className="p-4 h-full">
      <Textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="w-full h-full resize-none border-none bg-transparent text-canvas-text placeholder:text-canvas-text-muted focus-visible:ring-0"
        placeholder="Enter your text here..."
      />
    </div>
  );
}

export function ImageNodeEditor({ node, canvasState }: NodeEditorProps) {
  const { data: file } = useQuery<UploadedFile>({
    queryKey: ["/api/files", node.fileId],
    queryFn: async () => {
      if (!node.fileId) throw new Error("No file ID");
      const res = await fetch(`/api/files/${node.fileId}`);
      if (!res.ok) throw new Error("Failed to fetch file");
      return res.json();
    },
    enabled: !!node.fileId,
  });

  if (!node.fileId || !file) {
    return (
      <div className="p-4 h-full flex items-center justify-center text-canvas-text-muted">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">🖼️</span>
          </div>
          <p className="text-sm">No image selected</p>
          <p className="text-xs">Drag an image file to this node</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 h-full">
      <img
        src={`/api/files/${node.fileId}/content`}
        alt={file.originalName}
        className="w-full h-full object-contain rounded"
      />
    </div>
  );
}

export function MarkdownNodeEditor({ node, canvasState }: NodeEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(node.content);

  const handleContentChange = (value: string) => {
    setContent(value);
    canvasState.updateNode(node.id, { content: value });
  };

  if (isEditing) {
    return (
      <div className="p-4 h-full">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          className="w-full h-full resize-none border-none bg-transparent text-canvas-text placeholder:text-canvas-text-muted focus-visible:ring-0 font-mono text-sm"
          placeholder="# Enter markdown here..."
          onBlur={() => setIsEditing(false)}
          autoFocus
        />
      </div>
    );
  }

  return (
    <div 
      className="p-4 h-full overflow-auto prose prose-sm prose-invert max-w-none cursor-text"
      onClick={() => setIsEditing(true)}
    >
      <ReactMarkdown>{content || "# Empty Markdown\n\nClick to edit..."}</ReactMarkdown>
    </div>
  );
}

export function PDFNodeEditor({ node, canvasState }: NodeEditorProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(12); // This would come from PDF.js in a real implementation

  const { data: file } = useQuery<UploadedFile>({
    queryKey: ["/api/files", node.fileId],
    queryFn: async () => {
      if (!node.fileId) throw new Error("No file ID");
      const res = await fetch(`/api/files/${node.fileId}`);
      if (!res.ok) throw new Error("Failed to fetch file");
      return res.json();
    },
    enabled: !!node.fileId,
  });

  if (!node.fileId || !file) {
    return (
      <div className="h-full flex items-center justify-center text-canvas-text-muted bg-gray-100 rounded-b-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">📄</span>
          </div>
          <p className="text-sm text-gray-600">No PDF selected</p>
          <p className="text-xs text-gray-400">Drag a PDF file to this node</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-100 rounded-b-lg relative">
      {/* PDF Viewer - In a real implementation, this would use PDF.js */}
      <div className="w-full h-full bg-white rounded shadow-inner flex items-center justify-center text-gray-600">
        <div className="text-center">
          <div className="text-4xl text-red-400 mb-2">📄</div>
          <p className="text-sm font-medium">{file.originalName}</p>
          <p className="text-xs text-gray-400">Page {currentPage} of {totalPages}</p>
        </div>
      </div>
      
      {/* PDF Navigation */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/20 rounded-full px-3 py-1">
        <button
          className="text-white hover:text-gray-300 disabled:opacity-50"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          ←
        </button>
        <span className="text-white text-xs">{currentPage}/{totalPages}</span>
        <button
          className="text-white hover:text-gray-300 disabled:opacity-50"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          →
        </button>
      </div>
    </div>
  );
}
