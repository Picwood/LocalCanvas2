import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertCanvasProjectSchema, insertUploadedFileSchema } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for HTML files with embedded images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
      'application/pdf',
      'text/html', 'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.html')) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Canvas Projects API
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllCanvasProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getCanvasProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertCanvasProjectSchema.parse(req.body);
      const project = await storage.createCanvasProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCanvasProjectSchema.partial().parse(req.body);
      const project = await storage.updateCanvasProject(id, validatedData);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCanvasProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // File Upload API
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getAllUploadedFiles();
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Fetching file metadata for ID:", id);
      const file = await storage.getUploadedFile(id);
      if (!file) {
        console.log("File not found:", id);
        return res.status(404).json({ message: "File not found" });
      }
      console.log("File found:", file);
      res.json(file);
    } catch (error) {
      console.error("Error fetching file:", error);
      res.status(500).json({ message: "Failed to fetch file" });
    }
  });

  app.post("/api/files/upload", (req, res) => {
    upload.array('files')(req, res, async (err) => {
      if (err) {
        console.error("Multer upload error:", err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ 
            message: "File too large", 
            error: "File size exceeds 50MB limit. Please reduce file size or compress images."
          });
        }
        
        if (err.message === 'File type not allowed') {
          return res.status(400).json({ 
            message: "File type not allowed", 
            error: "Only HTML, PDF, image files (JPEG, PNG, GIF, SVG) and plain text files are supported."
          });
        }
        
        return res.status(400).json({ 
          message: "Upload failed", 
          error: err.message 
        });
      }

      try {
        console.log("Upload request received:", {
          files: req.files,
          body: req.body,
          contentType: req.headers['content-type']
        });

        if (!req.files || !Array.isArray(req.files)) {
          console.log("No files in request");
          return res.status(400).json({ message: "No files uploaded" });
        }

        const uploadedFiles = [];
        for (const file of req.files) {
          console.log("Processing file:", file);
          
          const fileData = {
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            path: file.path,
          };

          console.log("File data:", fileData);
          
          const validatedData = insertUploadedFileSchema.parse(fileData);
          const savedFile = await storage.createUploadedFile(validatedData);
          uploadedFiles.push(savedFile);
        }

        console.log("Upload successful:", uploadedFiles);
        res.status(201).json(uploadedFiles);
      } catch (error) {
        console.error("Upload processing error:", error);
        res.status(400).json({ 
          message: "Failed to process uploaded files",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  });

  app.get("/api/files/:id/content", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Serving file content for ID:", id);
      const file = await storage.getUploadedFile(id);
      if (!file) {
        console.log("File not found for content:", id);
        return res.status(404).json({ message: "File not found" });
      }

      console.log("File path:", file.path);
      if (!fs.existsSync(file.path)) {
        console.log("Physical file not found:", file.path);
        return res.status(404).json({ message: "File content not found" });
      }

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
      res.sendFile(path.resolve(file.path));
    } catch (error) {
      console.error("Error serving file content:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getUploadedFile(id);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete physical file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const deleted = await storage.deleteUploadedFile(id);
      if (!deleted) {
        return res.status(404).json({ message: "File not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
