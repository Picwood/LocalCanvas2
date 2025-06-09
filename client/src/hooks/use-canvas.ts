import { useState, useCallback } from "react";
import { type CanvasDataType, type CanvasNodeType, type CanvasConnectionType, type UploadedFile } from "@shared/schema";
import { nanoid } from "nanoid";

export interface CanvasState {
  nodes: CanvasNodeType[];
  connections: CanvasConnectionType[];
  viewport: { x: number; y: number; zoom: number };
  connectionPreview: { start: { x: number; y: number }; end: { x: number; y: number } } | null;
  setViewport: React.Dispatch<React.SetStateAction<{ x: number; y: number; zoom: number }>>;
  setConnectionPreview: React.Dispatch<React.SetStateAction<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>>;
  addNode: (nodeData: Partial<CanvasNodeType>) => void;
  updateNode: (nodeId: string, updates: Partial<CanvasNodeType>) => void;
  deleteNode: (nodeId: string) => void;
  addConnection: (sourceId: string, targetId: string) => string;
  updateConnection: (connectionId: string, updates: Partial<CanvasConnectionType>) => void;
  deleteConnection: (connectionId: string) => void;
  addFileNode: (file: UploadedFile) => void;
}

export function useCanvas(initialData: CanvasDataType): CanvasState {
  const [nodes, setNodes] = useState<CanvasNodeType[]>(initialData.nodes);
  const [connections, setConnections] = useState<CanvasConnectionType[]>(initialData.connections);
  const [viewport, setViewport] = useState(initialData.viewport);
  const [connectionPreview, setConnectionPreview] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null);

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
    const connectionId = nanoid();
    const newConnection: CanvasConnectionType = {
      id: connectionId,
      sourceNodeId: sourceId,
      targetNodeId: targetId,
      style: {
        strokeColor: "#6366F1",
        strokeWidth: 2,
        strokeDasharray: "5,5",
      },
    };
    
    setConnections(prev => [...prev, newConnection]);
    return connectionId;
  }, []);

  const updateConnection = useCallback((connectionId: string, updates: Partial<CanvasConnectionType>) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId ? { ...conn, ...updates } : conn
    ));
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
    } else if (file.mimeType === "text/html" || file.originalName.endsWith(".html")) {
      nodeType = "html";
      nodeSize = { width: 400, height: 400 };
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
    connectionPreview,
    setViewport,
    setConnectionPreview,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    updateConnection,
    deleteConnection,
    addFileNode,
  };
}

export type { CanvasNodeType };
