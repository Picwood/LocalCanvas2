import { useState, useCallback } from "react";
import { type CanvasDataType, type CanvasNodeType, type CanvasConnectionType, type UploadedFile } from "@shared/schema";
import { nanoid } from "nanoid";

export interface CanvasState {
  nodes: CanvasNodeType[];
  connections: CanvasConnectionType[];
  viewport: { x: number; y: number; zoom: number };
  setViewport: React.Dispatch<React.SetStateAction<{ x: number; y: number; zoom: number }>>;
  addNode: (nodeData: Partial<CanvasNodeType>) => void;
  updateNode: (nodeId: string, updates: Partial<CanvasNodeType>) => void;
  deleteNode: (nodeId: string) => void;
  addConnection: (sourceId: string, targetId: string) => void;
  deleteConnection: (connectionId: string) => void;
  addFileNode: (file: UploadedFile) => void;
}

export function useCanvas(initialData: CanvasDataType): CanvasState {
  const [nodes, setNodes] = useState<CanvasNodeType[]>(initialData.nodes);
  const [connections, setConnections] = useState<CanvasConnectionType[]>(initialData.connections);
  const [viewport, setViewport] = useState(initialData.viewport);

  const addNode = useCallback((nodeData: Partial<CanvasNodeType>) => {
    const newNode: CanvasNodeType = {
      id: nanoid(),
      type: nodeData.type || "text",
      position: nodeData.position || { x: 100, y: 100 },
      size: nodeData.size || { width: 300, height: 200 },
      content: nodeData.content || "",
      fileId: nodeData.fileId,
      style: nodeData.style,
    };
    
    setNodes(prev => [...prev, newNode]);
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<CanvasNodeType>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    ));
  }, []);

  const addConnection = useCallback((sourceId: string, targetId: string) => {
    const newConnection: CanvasConnectionType = {
      id: nanoid(),
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      style: {
        strokeColor: "#6366F1",
        strokeWidth: 2,
        strokeDasharray: "5,5",
      },
    };
    
    setConnections(prev => [...prev, newConnection]);
  }, []);

  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  }, []);

  const addFileNode = useCallback((file: UploadedFile) => {
    let nodeType: CanvasNodeType["type"] = "text";
    let nodeSize = { width: 300, height: 200 };

    if (file.mimeType.startsWith("image/")) {
      nodeType = "image";
      nodeSize = { width: 320, height: 240 };
    } else if (file.mimeType === "application/pdf") {
      nodeType = "pdf";
      nodeSize = { width: 400, height: 500 };
    } else if (file.mimeType === "text/markdown" || file.originalName.endsWith(".md")) {
      nodeType = "markdown";
      nodeSize = { width: 400, height: 300 };
    }

    addNode({
      type: nodeType,
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      size: nodeSize,
      content: "",
      fileId: file.id,
    });
  }, [addNode]);

  return {
    nodes,
    connections,
    viewport,
    setViewport,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    addFileNode,
  };
}

export type { CanvasNodeType, CanvasState };
