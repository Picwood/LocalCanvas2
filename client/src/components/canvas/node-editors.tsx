import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { type CanvasNodeType, type CanvasState } from "@/hooks/use-canvas";
import { type UploadedFile } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

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

export function HtmlNodeEditor({ node, canvasState }: NodeEditorProps) {
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
          <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">🌐</span>
          </div>
          <p className="text-sm">No HTML file selected</p>
          <p className="text-xs">Drag an HTML file to this node</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* HTML Viewer using embedded iframe */}
      <iframe
        src={`/api/files/${node.fileId}/content`}
        className="w-full h-full border-0 rounded-b-lg"
        title={file.originalName}
        sandbox="allow-scripts allow-same-origin"
      />
      
      {/* HTML Info Bar */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs z-10">
        {file.originalName}
      </div>
    </div>
  );
}

export function PDFNodeEditor({ node, canvasState }: NodeEditorProps) {

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
    <div className="h-full w-full relative">
      {/* PDF Viewer using embedded iframe */}
      <iframe
        src={`/api/files/${node.fileId}/content`}
        className="w-full h-full border-0 rounded-b-lg"
        title={file.originalName}
      />
      
      {/* PDF Info Bar */}
      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs z-10">
        {file.originalName}
      </div>
    </div>
  );
}
