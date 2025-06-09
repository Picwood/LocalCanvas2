import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const canvasProjects = pgTable("canvas_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  data: jsonb("data").notNull(), // Canvas state including nodes, connections, viewport
});

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
});

// Node types for canvas
export const NodeType = z.enum(["text", "image", "pdf", "html"]);

export const CanvasNode = z.object({
  id: z.string(),
  type: NodeType,
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }),
  content: z.string(),
  fileId: z.number().optional(), // Reference to uploadedFiles for image/pdf/markdown nodes
  style: z.object({
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
  }).optional(),
});

export const CanvasConnection = z.object({
  id: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  style: z.object({
    strokeColor: z.string().optional(),
    strokeWidth: z.number().optional(),
    strokeDasharray: z.string().optional(),
  }).optional(),
});

export const CanvasData = z.object({
  nodes: z.array(CanvasNode),
  connections: z.array(CanvasConnection),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }),
});

export const insertCanvasProjectSchema = createInsertSchema(canvasProjects).omit({
  id: true,
});

export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
});

export type InsertCanvasProject = z.infer<typeof insertCanvasProjectSchema>;
export type CanvasProject = typeof canvasProjects.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type CanvasNodeType = z.infer<typeof CanvasNode>;
export type CanvasConnectionType = z.infer<typeof CanvasConnection>;
export type CanvasDataType = z.infer<typeof CanvasData>;
