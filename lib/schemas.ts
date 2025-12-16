import { z } from "zod";

/**
 * Validation schemas for API endpoints using Zod
 */

// =============================================================================
// USER SCHEMAS
// =============================================================================

// User registration/creation schema
export const CreateAdminSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email must not exceed 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),
  avatarUrl: z.string().url("Invalid avatar URL").optional().nullable(),
});

// Login schema
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  code: z.string().optional(),
  useBackupCode: z.boolean().optional(),
});

// Update user schema (removed deprecated fields)
export const UpdateUserSchema = z
  .object({
    email: z.string().email().max(255).optional(),
    name: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional().nullable(),
    role: z.string().max(50).optional(),
    roleId: z.string().uuid().optional().nullable(),
    phone: z.string().max(20).optional().nullable(),
    bio: z.string().max(1000).optional().nullable(),
    addressLine1: z.string().max(255).optional().nullable(),
    addressLine2: z.string().max(255).optional().nullable(),
    city: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    postalCode: z.string().max(20).optional().nullable(),
  })
  .strict();

// =============================================================================
// PROJECT SCHEMAS
// =============================================================================

// Project schema (updated with new fields, removed owner/progress)
export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(5000).optional(),
  status: z
    .enum(["active", "completed", "on-hold", "cancelled"])
    .default("active"),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  budget: z.number().min(0).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  userId: z.number(),
  // New fields
  clientName: z.string().max(255).optional(),
  tags: z.array(z.string()).default([]),
  visibility: z.enum(["public", "private", "team-only"]).default("private"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
});

export const UpdateProjectSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(["active", "completed", "on-hold", "cancelled"]).optional(),
    startDate: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    budget: z.number().min(0).optional().nullable(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional().nullable(),
    completedAt: z.string().optional().nullable(),
    clientName: z.string().max(255).optional().nullable(),
    tags: z.array(z.string()).optional(),
    visibility: z.enum(["public", "private", "team-only"]).optional(),
    archivedAt: z.string().optional().nullable(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .nullable(),
  })
  .strict();

// =============================================================================
// PROJECT MEMBER SCHEMAS
// =============================================================================

export const AddProjectMemberSchema = z.object({
  projectId: z.number(),
  userId: z.number(),
  role: z.enum(["owner", "admin", "member", "viewer"]).default("member"),
});

export const UpdateProjectMemberRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

// =============================================================================
// MILESTONE SCHEMAS
// =============================================================================

export const CreateMilestoneSchema = z.object({
  projectId: z.number(),
  name: z.string().min(1, "Milestone name is required").max(255),
  description: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  order: z.number().int().min(0).default(0),
});

export const UpdateMilestoneSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional().nullable(),
    dueDate: z.string().optional().nullable(),
    status: z.enum(["pending", "in-progress", "completed"]).optional(),
    order: z.number().int().min(0).optional(),
  })
  .strict();

// =============================================================================
// TASK SCHEMAS
// =============================================================================

// Task schema (updated with new fields)
export const CreateTaskSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Task title is required").max(255),
  description: z.string().max(5000).optional(),
  status: z.enum(["todo", "in-progress", "done", "blocked"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  due: z.string().optional(),
  estimateHours: z.number().min(0).optional(),
  // New fields
  assigneeId: z.number().optional(),
  labels: z.array(z.string()).default([]),
  boardColumn: z
    .enum(["todo", "in-progress", "done", "blocked"])
    .default("todo"),
  order: z.number().int().min(0).default(0),
  parentTaskId: z.string().optional(),
  attachments: z.record(z.string(), z.unknown()).optional(),
  watchers: z.array(z.string()).default([]),
});

export const UpdateTaskSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: z.enum(["todo", "in-progress", "done", "blocked"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    due: z.string().optional().nullable(),
    estimateHours: z.number().min(0).optional().nullable(),
    loggedHours: z.number().min(0).optional(),
    assigneeId: z.number().optional().nullable(),
    labels: z.array(z.string()).optional(),
    boardColumn: z.enum(["todo", "in-progress", "done", "blocked"]).optional(),
    order: z.number().int().min(0).optional(),
    parentTaskId: z.string().optional().nullable(),
    attachments: z.record(z.string(), z.unknown()).optional().nullable(),
    completedAt: z.string().optional().nullable(),
    startedAt: z.string().optional().nullable(),
    blockedBy: z.string().optional().nullable(),
    watchers: z.array(z.string()).optional(),
  })
  .strict();

export const ReorderTasksSchema = z.array(
  z.object({
    uid: z.string(),
    order: z.number().int().min(0),
    boardColumn: z.enum(["todo", "in-progress", "done", "blocked"]).optional(),
  })
);

// =============================================================================
// COMMENT SCHEMAS
// =============================================================================

export const CreateCommentSchema = z
  .object({
    content: z.string().min(1, "Comment content is required").max(10000),
    taskId: z.string().optional(),
    projectId: z.number().optional(),
    parentCommentId: z.string().uuid().optional(),
  })
  .refine(
    (data) => data.taskId || data.projectId,
    "Either taskId or projectId must be provided"
  );

export const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(10000),
});

// =============================================================================
// NOTIFICATION SCHEMAS
// =============================================================================

export const CreateNotificationSchema = z.object({
  userId: z.number(),
  type: z.string().max(100),
  title: z.string().max(255),
  message: z.string().max(2000),
  link: z.string().url().optional(),
});

// =============================================================================
// ACTIVITY SCHEMAS
// =============================================================================

export const CreateActivitySchema = z.object({
  userId: z.number(),
  entityType: z.enum([
    "project",
    "task",
    "comment",
    "file",
    "milestone",
    "user",
  ]),
  entityId: z.string(),
  action: z.enum([
    "created",
    "updated",
    "deleted",
    "assigned",
    "commented",
    "completed",
    "archived",
    "restored",
  ]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// =============================================================================
// FILE SCHEMAS
// =============================================================================

export const FileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  fileUrl: z.string().url(),
  fileSize: z.number().int().min(0),
  mimeType: z.string().max(100),
  projectId: z.number().optional(),
  taskId: z.string().optional(),
});

// Legacy file path schema for backward compatibility
export const FilePathSchema = z.object({
  path: z
    .string()
    .min(1, "File path is required")
    .max(255)
    .regex(/^[a-zA-Z0-9\-_\/\.]+$/, "File path contains invalid characters"),
});

// =============================================================================
// CALENDAR EVENT SCHEMAS
// =============================================================================

export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(255),
  description: z.string().max(2000).optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().max(255).optional(),
  attendees: z.array(z.string()).default([]),
  projectId: z.number().optional(),
  taskId: z.string().optional(),
});

export const UpdateCalendarEventSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional().nullable(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    location: z.string().max(255).optional().nullable(),
    attendees: z.array(z.string()).optional(),
    projectId: z.number().optional().nullable(),
    taskId: z.string().optional().nullable(),
  })
  .strict();

// =============================================================================
// EXPENSE SCHEMAS
// =============================================================================

export const CreateExpenseSchema = z.object({
  projectId: z.number(),
  date: z.string(),
  vendor: z.string().max(255).optional(),
  amount: z.number().min(0),
  category: z.string().max(100).optional(),
  note: z.string().max(2000).optional(),
});

export const UpdateExpenseSchema = z
  .object({
    date: z.string().optional(),
    vendor: z.string().max(255).optional().nullable(),
    amount: z.number().min(0).optional(),
    category: z.string().max(100).optional().nullable(),
    note: z.string().max(2000).optional().nullable(),
  })
  .strict();

// =============================================================================
// INVOICE SCHEMAS
// =============================================================================

export const InvoiceItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

export const CreateInvoiceSchema = z.object({
  projectId: z.number(),
  clientName: z.string().min(1).max(255),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z
    .enum(["draft", "sent", "paid", "overdue", "cancelled"])
    .default("draft"),
  items: z.array(InvoiceItemSchema).min(1),
  total: z.number().min(0),
  notes: z.string().max(2000).optional(),
});

export const UpdateInvoiceSchema = z
  .object({
    clientName: z.string().min(1).max(255).optional(),
    issueDate: z.string().optional(),
    dueDate: z.string().optional(),
    status: z
      .enum(["draft", "sent", "paid", "overdue", "cancelled"])
      .optional(),
    items: z.array(InvoiceItemSchema).min(1).optional(),
    total: z.number().min(0).optional(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .strict();

// =============================================================================
// TIME LOG SCHEMAS
// =============================================================================

export const CreateTimeLogSchema = z.object({
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  hours: z.number().min(0.01).max(24),
  note: z.string().max(1000).optional(),
  loggedBy: z.string().min(1),
});

// =============================================================================
// BLOCKER SCHEMAS
// =============================================================================

export const CreateBlockerSchema = z.object({
  title: z.string().min(1, "Blocker title is required").max(255),
  description: z.string().max(5000).optional(),
  level: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "resolved"]).default("open"),
  impactedTasks: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  categoryId: z.string().min(1),
  projectId: z.string().optional(),
});

export const UpdateBlockerSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(5000).optional().nullable(),
    level: z.enum(["low", "medium", "high", "critical"]).optional(),
    status: z.enum(["open", "resolved"]).optional(),
    impactedTasks: z.array(z.string()).optional(),
    assignedTo: z.string().optional().nullable(),
    resolution: z.string().max(5000).optional().nullable(),
    resolvedDate: z.string().optional().nullable(),
  })
  .strict();
