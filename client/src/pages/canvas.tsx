import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type CanvasProject, type CanvasDataType } from "@shared/schema";
import { InfiniteCanvas } from "@/components/canvas/infinite-canvas";
import { FloatingToolbar } from "@/components/canvas/floating-toolbar";
import { FileSidebar } from "@/components/canvas/file-sidebar";
import { Minimap } from "@/components/canvas/minimap";
import { useCanvas } from "@/hooks/use-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, FolderOpen, Map, Menu, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Canvas() {
  const { projectId } = useParams<{ projectId?: string }>();
  const currentProjectId = projectId ? parseInt(projectId) : 1;
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMinimapOpen, setIsMinimapOpen] = useState(true);
  const [projectName, setProjectName] = useState("");

  const { data: project, isLoading } = useQuery<CanvasProject>({
    queryKey: ["/api/projects", currentProjectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${currentProjectId}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
  });

  const canvasState = useCanvas(project?.data || {
    nodes: [],
    connections: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  });

  useEffect(() => {
    if (project) {
      setProjectName(project.name);
    }
  }, [project]);

  const saveProjectMutation = useMutation({
    mutationFn: async () => {
      const projectData = {
        name: projectName,
        data: {
          nodes: canvasState.nodes,
          connections: canvasState.connections,
          viewport: canvasState.viewport,
        },
      };
      
      const res = await apiRequest("PUT", `/api/projects/${currentProjectId}`, projectData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Saved",
        description: "Your canvas has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save your canvas. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveProjectMutation.mutate();
  };

  const handleZoomIn = () => {
    canvasState.setViewport(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 3)
    }));
  };

  const handleZoomOut = () => {
    canvasState.setViewport(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.1)
    }));
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-canvas-bg flex items-center justify-center">
        <div className="text-canvas-text">Loading canvas...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-canvas-bg text-canvas-text font-inter overflow-hidden">
      {/* Top Bar */}
      <header className="bg-canvas-surface/80 backdrop-blur-sm border-b border-canvas-border px-4 py-2 flex items-center justify-between relative z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent border-none text-lg font-semibold text-canvas-text focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
              placeholder="Untitled Canvas"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saveProjectMutation.isPending}
              className="bg-canvas-surface hover:bg-canvas-border border-canvas-border text-canvas-text"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveProjectMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-canvas-surface hover:bg-canvas-border border-canvas-border text-canvas-text"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Load
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2 bg-canvas-surface border border-canvas-border rounded-lg px-2 py-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="p-1 h-auto text-canvas-text hover:bg-canvas-border"
            >
              <ZoomOut className="w-3 h-3" />
            </Button>
            <span className="text-xs px-2 text-canvas-text">
              {Math.round(canvasState.viewport.zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="p-1 h-auto text-canvas-text hover:bg-canvas-border"
            >
              <ZoomIn className="w-3 h-3" />
            </Button>
          </div>
          
          {/* View Controls */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMinimapOpen(!isMinimapOpen)}
            className="bg-canvas-surface hover:bg-canvas-border border-canvas-border text-canvas-text"
          >
            <Map className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-canvas-surface hover:bg-canvas-border border-canvas-border text-canvas-text"
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex relative">
        {/* Sidebar */}
        {isSidebarOpen && (
          <FileSidebar onFileSelect={(file) => canvasState.addFileNode(file)} />
        )}
        
        {/* Canvas Container */}
        <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-canvas-bg to-slate-900">
          {/* Floating Toolbar */}
          <FloatingToolbar canvasState={canvasState} />
          
          {/* Infinite Canvas */}
          <InfiniteCanvas canvasState={canvasState} />
          
          {/* Minimap */}
          {isMinimapOpen && (
            <Minimap 
              canvasState={canvasState}
              onClose={() => setIsMinimapOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
