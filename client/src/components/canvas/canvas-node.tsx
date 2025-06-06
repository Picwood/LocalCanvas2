import { useRef, useCallback } from "react";
import { type CanvasNodeType, type CanvasState } from "@/hooks/use-canvas";
import { TextNodeEditor, ImageNodeEditor, MarkdownNodeEditor, PDFNodeEditor } from "./node-editors";
import { Edit, X, FileText, Image, FileCode, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasNodeProps {
  node: CanvasNodeType;
  canvasState: CanvasState;
}

export function CanvasNode({ node, canvasState }: CanvasNodeProps) {
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.node-controls')) {
      return; // Don't start dragging if clicking on controls
    }
    
    isDraggingRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: (e.clientX - rect.left) / canvasState.viewport.zoom,
      y: (e.clientY - rect.top) / canvasState.viewport.zoom,
    };
    
    e.preventDefault();
    e.stopPropagation();
  }, [canvasState.viewport.zoom]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingRef.current) {
      const containerRect = document.querySelector('.w-full.h-full.relative.cursor-grab')?.getBoundingClientRect();
      if (containerRect) {
        const x = (e.clientX - containerRect.left - canvasState.viewport.x) / canvasState.viewport.zoom - dragOffsetRef.current.x;
        const y = (e.clientY - containerRect.top - canvasState.viewport.y) / canvasState.viewport.zoom - dragOffsetRef.current.y;
        
        canvasState.updateNode(node.id, {
          position: { x, y }
        });
      }
    }
  }, [node.id, canvasState]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleDeleteNode = () => {
    canvasState.deleteNode(node.id);
  };

  // Attach global mouse events for dragging
  useCallback(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    if (isDraggingRef.current) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [handleMouseMove, handleMouseUp]);

  const getNodeIcon = () => {
    switch (node.type) {
      case 'text': return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'image': return <Image className="w-4 h-4 text-green-400" />;
      case 'markdown': return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'pdf': return <FileType className="w-4 h-4 text-red-400" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getNodeTitle = () => {
    switch (node.type) {
      case 'text': return 'Text Note';
      case 'image': return 'Image';
      case 'markdown': return 'Markdown';
      case 'pdf': return 'PDF Document';
      default: return 'Node';
    }
  };

  const renderNodeContent = () => {
    switch (node.type) {
      case 'text':
        return <TextNodeEditor node={node} canvasState={canvasState} />;
      case 'image':
        return <ImageNodeEditor node={node} canvasState={canvasState} />;
      case 'markdown':
        return <MarkdownNodeEditor node={node} canvasState={canvasState} />;
      case 'pdf':
        return <PDFNodeEditor node={node} canvasState={canvasState} />;
      default:
        return <div className="p-4 text-canvas-text-muted">Unknown node type</div>;
    }
  };

  return (
    <div
      className="absolute bg-canvas-surface border border-canvas-border rounded-lg shadow-lg group cursor-move select-none"
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        backgroundColor: node.style?.backgroundColor,
        borderColor: node.style?.borderColor,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Node Header */}
      <div className="flex items-center justify-between p-3 bg-canvas-surface border-b border-canvas-border cursor-move">
        <div className="flex items-center space-x-2">
          {getNodeIcon()}
          <span className="text-sm font-medium text-canvas-text">{getNodeTitle()}</span>
        </div>
        <div className="node-controls flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto hover:bg-canvas-border text-canvas-text"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteNode}
            className="p-1 h-auto hover:bg-red-500/20 text-red-400"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Node Content */}
      <div className="flex-1 overflow-hidden">
        {renderNodeContent()}
      </div>
    </div>
  );
}
