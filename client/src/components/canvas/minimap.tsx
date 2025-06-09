import { Button } from "@/components/ui/button";
import { type CanvasState } from "@/hooks/use-canvas";
import { X } from "lucide-react";

interface MinimapProps {
  canvasState: CanvasState;
  onClose: () => void;
}

export function Minimap({ canvasState, onClose }: MinimapProps) {
  const minimapScale = 0.1;
  const minimapWidth = 200;
  const minimapHeight = 120;

  return (
    <div className="absolute bottom-4 right-4 w-48 h-32 bg-canvas-surface/90 backdrop-blur-sm border border-canvas-border rounded-lg p-2 z-30">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-canvas-text">Minimap</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1 h-auto hover:bg-canvas-border text-canvas-text"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="w-full h-full bg-canvas-bg rounded border border-canvas-border relative overflow-hidden">
        {/* Minimap Nodes */}
        {canvasState.nodes.map((node) => (
          <div
            key={node.id}
            className="absolute rounded-sm opacity-60"
            style={{
              left: node.position.x * minimapScale,
              top: node.position.y * minimapScale,
              width: Math.max(node.size.width * minimapScale, 3),
              height: Math.max(node.size.height * minimapScale, 3),
              backgroundColor: 
                node.type === 'text' ? '#6366F1' :
                node.type === 'image' ? '#10B981' :
                node.type === 'html' ? '#3B82F6' :
                node.type === 'pdf' ? '#EF4444' : '#6B7280',
            }}
          />
        ))}
        
        {/* Viewport Indicator */}
        <div
          className="absolute border border-indigo-400 bg-indigo-400/20 rounded-sm cursor-move"
          style={{
            left: Math.max(0, Math.min(minimapWidth - 24, -canvasState.viewport.x * minimapScale)),
            top: Math.max(0, Math.min(minimapHeight - 16, -canvasState.viewport.y * minimapScale)),
            width: 24,
            height: 16,
          }}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startY = e.clientY;
            const startViewportX = canvasState.viewport.x;
            const startViewportY = canvasState.viewport.y;
            
            const handleMouseMove = (e: MouseEvent) => {
              const deltaX = (e.clientX - startX) / minimapScale;
              const deltaY = (e.clientY - startY) / minimapScale;
              
              canvasState.setViewport(prev => ({
                ...prev,
                x: startViewportX - deltaX,
                y: startViewportY - deltaY,
              }));
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />
      </div>
    </div>
  );
}
