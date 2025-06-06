import { canvasProjects, uploadedFiles, type CanvasProject, type InsertCanvasProject, type UploadedFile, type InsertUploadedFile } from "@shared/schema";

export interface IStorage {
  // Canvas Projects
  getCanvasProject(id: number): Promise<CanvasProject | undefined>;
  getAllCanvasProjects(): Promise<CanvasProject[]>;
  createCanvasProject(project: InsertCanvasProject): Promise<CanvasProject>;
  updateCanvasProject(id: number, project: Partial<InsertCanvasProject>): Promise<CanvasProject | undefined>;
  deleteCanvasProject(id: number): Promise<boolean>;

  // Uploaded Files
  getUploadedFile(id: number): Promise<UploadedFile | undefined>;
  getAllUploadedFiles(): Promise<UploadedFile[]>;
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  deleteUploadedFile(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private canvasProjects: Map<number, CanvasProject>;
  private uploadedFiles: Map<number, UploadedFile>;
  private currentProjectId: number;
  private currentFileId: number;

  constructor() {
    this.canvasProjects = new Map();
    this.uploadedFiles = new Map();
    this.currentProjectId = 1;
    this.currentFileId = 1;

    // Create a default project
    this.canvasProjects.set(1, {
      id: 1,
      name: "Untitled Canvas",
      data: {
        nodes: [],
        connections: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    });
    this.currentProjectId = 2;
  }

  // Canvas Projects
  async getCanvasProject(id: number): Promise<CanvasProject | undefined> {
    return this.canvasProjects.get(id);
  }

  async getAllCanvasProjects(): Promise<CanvasProject[]> {
    return Array.from(this.canvasProjects.values());
  }

  async createCanvasProject(insertProject: InsertCanvasProject): Promise<CanvasProject> {
    const id = this.currentProjectId++;
    const project: CanvasProject = { ...insertProject, id };
    this.canvasProjects.set(id, project);
    return project;
  }

  async updateCanvasProject(id: number, update: Partial<InsertCanvasProject>): Promise<CanvasProject | undefined> {
    const existing = this.canvasProjects.get(id);
    if (!existing) return undefined;

    const updated: CanvasProject = { ...existing, ...update };
    this.canvasProjects.set(id, updated);
    return updated;
  }

  async deleteCanvasProject(id: number): Promise<boolean> {
    return this.canvasProjects.delete(id);
  }

  // Uploaded Files
  async getUploadedFile(id: number): Promise<UploadedFile | undefined> {
    return this.uploadedFiles.get(id);
  }

  async getAllUploadedFiles(): Promise<UploadedFile[]> {
    return Array.from(this.uploadedFiles.values());
  }

  async createUploadedFile(insertFile: InsertUploadedFile): Promise<UploadedFile> {
    const id = this.currentFileId++;
    const file: UploadedFile = { ...insertFile, id };
    this.uploadedFiles.set(id, file);
    return file;
  }

  async deleteUploadedFile(id: number): Promise<boolean> {
    const file = this.uploadedFiles.get(id);
    if (file) {
      // In a real implementation, you would also delete the physical file
      return this.uploadedFiles.delete(id);
    }
    return false;
  }
}

export const storage = new MemStorage();
