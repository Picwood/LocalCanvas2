import { Button } from "@/components/ui/button";
import { type CanvasState } from "@/hooks/use-canvas";
import { FileText, Image, FileCode, FileType, Link, MousePointer } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface FloatingToolbarProps {
  canvasState: CanvasState;
}

export function FloatingToolbar({ canvasState }: FloatingToolbarProps) {
  const handleAddTextNode = () => {
    canvasState.addNode({
      type: "text",
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      content: "Enter your text here...",
    });
  };

  const handleAddImageNode = () => {
    canvasState.addNode({
      type: "image",
      position: { x: 150, y: 150 },
      size: { width: 320, height: 240 },
      content: "",
    });
  };

  const handleAddMarkdownNode = () => {
    canvasState.addNode({
      type: "markdown",
      position: { x: 200, y: 200 },
      size: { width: 400, height: 300 },
      content: "# Markdown Content\n\nEdit this content...",
    });
  };

  const handleAddPdfNode = () => {
    canvasState.addNode({
      type: "pdf",
      position: { x: 250, y: 250 },
      size: { width: 400, height: 500 },
      content: "",
    });
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-canvas-surface/90 backdrop-blur-sm border border-canvas-border rounded-xl p-2 shadow-2xl">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddTextNode}
            className="p-3 hover:bg-indigo-500 text-canvas-text hover:text-white rounded-lg transition-colors"
            title="Add Text Node"
          >
            <FileText className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddImageNode}
            className="p-3 hover:bg-green-500 text-canvas-text hover:text-white rounded-lg transition-colors"
            title="Add Image"
          >
            <Image className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddPdfNode}
            className="p-3 hover:bg-red-500 text-canvas-text hover:text-white rounded-lg transition-colors"
            title="Add PDF"
          >
            <FileType className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddMarkdownNode}
            className="p-3 hover:bg-blue-500 text-canvas-text hover:text-white rounded-lg transition-colors"
            title="Add Markdown"
          >
            <FileCode className="w-5 h-5" />
          </Button>
          
          <Separator orientation="vertical" className="h-8 bg-canvas-border mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            className="p-3 hover:bg-purple-500 text-canvas-text hover:text-white rounded-lg transition-colors"
            title="Connect Nodes"
          >
            <Link className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="p-3 hover:bg-yellow-500 text-canvas-text hover:text-white rounded-lg transition-colors"
            title="Select Tool"
          >
            <MousePointer className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
