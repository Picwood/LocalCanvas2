import { useRef, useEffect, useCallback } from "react";
import { CanvasNode } from "./canvas-node";
import { type CanvasState } from "@/hooks/use-canvas";

interface InfiniteCanvasProps {
  canvasState: CanvasState;
}

export function InfiniteCanvas({ canvasState }: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const lastPanPositionRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      isPanningRef.current = true;
      lastPanPositionRef.current = { x: e.clientX, y: e.clientY };
      
      // Deselect all nodes when clicking on empty canvas
      const event = new CustomEvent('canvas-click', { detail: { deselectAll: true } });
      document.dispatchEvent(event);
      
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanningRef.current) {
      const deltaX = e.clientX - lastPanPositionRef.current.x;
      const deltaY = e.clientY - lastPanPositionRef.current.y;
      
      canvasState.setViewport(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
      
      lastPanPositionRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [canvasState]);

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = containerRef.current?.getBoundingClientRect();
    
    if (rect) {
      // Get mouse position relative to canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      canvasState.setViewport(prev => {
        const newZoom = Math.max(0.1, Math.min(3, prev.zoom * zoomFactor));
        
        // Calculate zoom center point
        const zoomCenterX = (mouseX - prev.x) / prev.zoom;
        const zoomCenterY = (mouseY - prev.y) / prev.zoom;
        
        // Adjust viewport to keep zoom centered on mouse
        const newX = mouseX - zoomCenterX * newZoom;
        const newY = mouseY - zoomCenterY * newZoom;
        
        return {
          ...prev,
          zoom: newZoom,
          x: newX,
          y: newY
        };
      });
    }
  }, [canvasState]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = (e.clientX - rect.left - canvasState.viewport.x) / canvasState.viewport.zoom;
      const y = (e.clientY - rect.top - canvasState.viewport.y) / canvasState.viewport.zoom;
      
      // Add context menu logic here
      console.log("Context menu at:", { x, y });
    }
  }, [canvasState]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleMouseMove, handleMouseUp, handleWheel]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      data-canvas-container
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, #2E2E5D 1px, transparent 1px)`,
          backgroundSize: `${40 * canvasState.viewport.zoom}px ${40 * canvasState.viewport.zoom}px`,
          backgroundPosition: `${canvasState.viewport.x}px ${canvasState.viewport.y}px`,
        }}
      />
      
      {/* Canvas Content */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${canvasState.viewport.x}px, ${canvasState.viewport.y}px) scale(${canvasState.viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connection Lines */}
        <svg className="absolute inset-0 pointer-events-none z-10 w-full h-full">
          {/* Existing connections */}
          {canvasState.connections.map((connection) => {
            const sourceNode = canvasState.nodes.find(n => n.id === connection.sourceNodeId);
            const targetNode = canvasState.nodes.find(n => n.id === connection.targetNodeId);
            
            if (!sourceNode || !targetNode) return null;
            
            const sourceCenterX = sourceNode.position.x + sourceNode.size.width / 2;
            const sourceCenterY = sourceNode.position.y + sourceNode.size.height / 2;
            const targetCenterX = targetNode.position.x + targetNode.size.width / 2;
            const targetCenterY = targetNode.position.y + targetNode.size.height / 2;
            
            const midX = (sourceCenterX + targetCenterX) / 2;
            const midY = (sourceCenterY + targetCenterY) / 2;
            
            return (
              <g key={connection.id}>
                <path
                  d={`M ${sourceCenterX} ${sourceCenterY} Q ${midX} ${midY} ${targetCenterX} ${targetCenterY}`}
                  stroke={connection.style?.strokeColor || "#6366F1"}
                  strokeWidth={connection.style?.strokeWidth || 2}
                  fill="none"
                  strokeDasharray={connection.style?.strokeDasharray || "5,5"}
                  className="opacity-60"
                />
                {/* Arrow */}
                <polygon
                  points={`${targetCenterX-5},${targetCenterY-5} ${targetCenterX+5},${targetCenterY} ${targetCenterX-5},${targetCenterY+5}`}
                  fill={connection.style?.strokeColor || "#6366F1"}
                  className="opacity-60"
                />
              </g>
            );
          })}
          
          {/* Connection preview line */}
          {canvasState.connectionPreview && (
            <line
              x1={canvasState.connectionPreview.start.x}
              y1={canvasState.connectionPreview.start.y}
              x2={canvasState.connectionPreview.end.x}
              y2={canvasState.connectionPreview.end.y}
              stroke="#F59E0B"
              strokeWidth={3}
              strokeDasharray="8,4"
              className="opacity-80"
            />
          )}
        </svg>
        
        {/* Nodes */}
        {canvasState.nodes.map((node) => (
          <CanvasNode
            key={node.id}
            node={node}
            canvasState={canvasState}
          />
        ))}
      </div>
    </div>
  );
}
