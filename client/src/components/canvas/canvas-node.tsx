import { useRef, useCallback, useEffect, useState } from "react";
import { type CanvasNodeType, type CanvasState } from "@/hooks/use-canvas";
import { TextNodeEditor, ImageNodeEditor, HtmlNodeEditor, PDFNodeEditor } from "./node-editors";
import { Edit, X, FileText, Image, FileCode, FileType, Move, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasNodeProps {
  node: CanvasNodeType;
  canvasState: CanvasState;
}

export function CanvasNode({ node, canvasState }: CanvasNodeProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [isEditingConnection, setIsEditingConnection] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if clicking on resize handles
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
      setIsResizing(true);
      setResizeHandle(target.dataset.handle || '');
      const rect = e.currentTarget.getBoundingClientRect();
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: node.size.width,
        height: node.size.height
      };
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Check if clicking on controls
    if (target.closest('.node-controls')) {
      return;
    }
    
    // Start dragging
    setIsDragging(true);
    setIsSelected(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
    const canvasRect = canvasContainer?.getBoundingClientRect();
    
    if (canvasRect) {
      dragOffsetRef.current = {
        x: (e.clientX - canvasRect.left - canvasState.viewport.x) / canvasState.viewport.zoom - node.position.x,
        y: (e.clientY - canvasRect.top - canvasState.viewport.y) / canvasState.viewport.zoom - node.position.y,
      };
    }
    
    e.preventDefault();
    e.stopPropagation();
  }, [node.position.x, node.position.y, node.size.width, node.size.height, canvasState.viewport]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
      const canvasRect = canvasContainer?.getBoundingClientRect();
      
      if (canvasRect) {
        const x = (e.clientX - canvasRect.left - canvasState.viewport.x) / canvasState.viewport.zoom - dragOffsetRef.current.x;
        const y = (e.clientY - canvasRect.top - canvasState.viewport.y) / canvasState.viewport.zoom - dragOffsetRef.current.y;
        
        canvasState.updateNode(node.id, {
          position: { x, y }
        });
      }
    } else if (isEditingConnection && canvasState.connectionPreview) {
      // Update the end position of the connection being edited
      const canvasContainer = document.querySelector('[data-canvas-container]') as HTMLElement;
      const canvasRect = canvasContainer?.getBoundingClientRect();
      
      if (canvasRect) {
        const x = (e.clientX - canvasRect.left - canvasState.viewport.x) / canvasState.viewport.zoom;
        const y = (e.clientY - canvasRect.top - canvasState.viewport.y) / canvasState.viewport.zoom;
        
        // Update just the end position, keep the start position
        canvasState.setConnectionPreview({
          start: canvasState.connectionPreview.start,
          end: { x, y }
        });
      }
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;
      
      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;
      let newX = node.position.x;
      let newY = node.position.y;

      switch (resizeHandle) {
        case 'se': // bottom-right
          newWidth = Math.max(200, resizeStartRef.current.width + deltaX / canvasState.viewport.zoom);
          newHeight = Math.max(150, resizeStartRef.current.height + deltaY / canvasState.viewport.zoom);
          break;
        case 'sw': // bottom-left
          newWidth = Math.max(200, resizeStartRef.current.width - deltaX / canvasState.viewport.zoom);
          newHeight = Math.max(150, resizeStartRef.current.height + deltaY / canvasState.viewport.zoom);
          newX = node.position.x + (resizeStartRef.current.width - newWidth);
          break;
        case 'ne': // top-right
          newWidth = Math.max(200, resizeStartRef.current.width + deltaX / canvasState.viewport.zoom);
          newHeight = Math.max(150, resizeStartRef.current.height - deltaY / canvasState.viewport.zoom);
          newY = node.position.y + (resizeStartRef.current.height - newHeight);
          break;
        case 'nw': // top-left
          newWidth = Math.max(200, resizeStartRef.current.width - deltaX / canvasState.viewport.zoom);
          newHeight = Math.max(150, resizeStartRef.current.height - deltaY / canvasState.viewport.zoom);
          newX = node.position.x + (resizeStartRef.current.width - newWidth);
          newY = node.position.y + (resizeStartRef.current.height - newHeight);
          break;
      }

      canvasState.updateNode(node.id, {
        position: { x: newX, y: newY },
        size: { width: newWidth, height: newHeight }
      });
    }
  }, [isDragging, isResizing, isEditingConnection, resizeHandle, node.id, node.position.x, node.position.y, canvasState]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  }, []);

  const handleDeleteNode = () => {
    canvasState.deleteNode(node.id);
  };

  const getConnectionPointPosition = (side: string) => {
    const rect = { x: node.position.x, y: node.position.y, width: node.size.width, height: node.size.height };
    switch (side) {
      case 'top': return { x: rect.x + rect.width / 2, y: rect.y };
      case 'bottom': return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
      case 'left': return { x: rect.x, y: rect.y + rect.height / 2 };
      case 'right': return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
      default: return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    }
  };

  const handleConnectionPointClick = (e: React.MouseEvent, side: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Create a new connection with a temporary target
    const startPosition = getConnectionPointPosition(side);
    const endPosition = { x: startPosition.x + 100, y: startPosition.y + 50 }; // Offset end point
    
    // Create a connection with temporary target node ID
    const newConnectionId = canvasState.addConnection(node.id, "temp-target");
    
    // Enter editing mode for this connection
    setIsEditingConnection(newConnectionId);
    
    // Set up preview for dragging the end point
    canvasState.setConnectionPreview({ start: startPosition, end: endPosition });
    
    console.log(`Created new arrow ${newConnectionId} from ${node.id} (${side}) - drag to position the end`);
  };

  // Handle global canvas events
  useEffect(() => {
    const handleCanvasClick = (e: any) => {
      if (e.detail?.deselectAll) {
        setIsSelected(false);
        setIsEditingConnection(null);
        canvasState.setConnectionPreview(null);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isEditingConnection) {
        // Finish editing the connection
        setIsEditingConnection(null);
        canvasState.setConnectionPreview(null);
      }
    };

    document.addEventListener('canvas-click', handleCanvasClick);
    
    if (isEditingConnection) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('canvas-click', handleCanvasClick);
      if (isEditingConnection) {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      }
    };
  }, [isEditingConnection]);

  // Attach global mouse events
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const getNodeIcon = () => {
    switch (node.type) {
      case 'text': return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'image': return <Image className="w-4 h-4 text-green-400" />;
      case 'html': return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'pdf': return <FileType className="w-4 h-4 text-red-400" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getNodeTitle = () => {
    switch (node.type) {
      case 'text': return 'Text Note';
      case 'image': return 'Image';
      case 'html': return 'HTML Document';
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
      case 'html':
        return <HtmlNodeEditor node={node} canvasState={canvasState} />;
      case 'pdf':
        return <PDFNodeEditor node={node} canvasState={canvasState} />;
      default:
        return <div className="p-4 text-canvas-text-muted">Unknown node type</div>;
    }
  };

  return (
    <div
      className={`absolute bg-canvas-surface border rounded-lg shadow-lg group select-none flex flex-col ${
        isSelected ? 'border-blue-500 shadow-blue-500/25' : 'border-canvas-border'
      } ${isDragging ? 'cursor-grabbing' : 'cursor-move'}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        backgroundColor: node.style?.backgroundColor,
        borderColor: isSelected ? '#3B82F6' : node.style?.borderColor,
        borderWidth: isSelected ? '2px' : '1px',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Resize Handles */}
      {isSelected && (
        <>
          {/* Corner resize handles */}
          <div 
            className="resize-handle absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-nw-resize -top-1 -left-1 hover:bg-blue-600"
            data-handle="nw"
          />
          <div 
            className="resize-handle absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-ne-resize -top-1 -right-1 hover:bg-blue-600"
            data-handle="ne"
          />
          <div 
            className="resize-handle absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-sw-resize -bottom-1 -left-1 hover:bg-blue-600"
            data-handle="sw"
          />
          <div 
            className="resize-handle absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-se-resize -bottom-1 -right-1 hover:bg-blue-600"
            data-handle="se"
          />
          
          {/* Connection points */}
          <div 
            className="absolute w-3 h-3 bg-green-500 hover:bg-green-600 border border-white rounded-full -top-1 left-1/2 transform -translate-x-1/2 cursor-crosshair z-20 transition-colors"
            title="Create connection from top"
            onClick={(e) => handleConnectionPointClick(e, 'top')}
          />
          <div 
            className="absolute w-3 h-3 bg-green-500 hover:bg-green-600 border border-white rounded-full -bottom-1 left-1/2 transform -translate-x-1/2 cursor-crosshair z-20 transition-colors"
            title="Create connection from bottom"
            onClick={(e) => handleConnectionPointClick(e, 'bottom')}
          />
          <div 
            className="absolute w-3 h-3 bg-green-500 hover:bg-green-600 border border-white rounded-full -left-1 top-1/2 transform -translate-y-1/2 cursor-crosshair z-20 transition-colors"
            title="Create connection from left"
            onClick={(e) => handleConnectionPointClick(e, 'left')}
          />
          <div 
            className="absolute w-3 h-3 bg-green-500 hover:bg-green-600 border border-white rounded-full -right-1 top-1/2 transform -translate-y-1/2 cursor-crosshair z-20 transition-colors"
            title="Create connection from right"
            onClick={(e) => handleConnectionPointClick(e, 'right')}
          />
        </>
      )}

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
            title="Edit node"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteNode}
            className="p-1 h-auto hover:bg-red-500/20 text-red-400"
            title="Delete node"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Node Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderNodeContent()}
      </div>
    </div>
  );
}
