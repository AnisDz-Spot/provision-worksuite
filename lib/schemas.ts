import { z } from "zod";

/**
 * Validation schemas for API endpoints using Zod
 */

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
  timezone: z.string().max(50).optional(),
});

// Login schema
export const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Project schema
export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(5000).optional(),
  status: z
    .enum(["active", "completed", "on-hold", "cancelled"])
    .default("active"),
  owner: z.string().min(1),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  budget: z.number().min(0).optional(),
  progress: z.number().min(0).max(100).default(0),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  userId: z.string(),
});

// Task schema
export const CreateTaskSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().min(1, "Task title is required").max(255),
  description: z.string().max(5000).optional(),
  status: z.enum(["todo", "in-progress", "done", "blocked"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  assignee: z.string().optional(),
  due: z.string().optional(),
  estimateHours: z.number().min(0).optional(),
});

// File upload schema
export const FileUploadSchema = z.object({
  path: z
    .string()
    .min(1, "File path is required")
    .max(255)
    .regex(/^[a-zA-Z0-9\-_\/\.]+$/, "File path contains invalid characters"),
});

// Update user schema (partial)
export const UpdateUserSchema = z
  .object({
    email: z.string().email().max(255).optional(),
    fullName: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional().nullable(),
    isActive: z.boolean().optional(),
    systemRole: z.string().max(50).optional(),
    jobTitle: z.string().max(100).optional(),
    department: z.string().max(100).optional(),
    timezone: z.string().max(50).optional(),
    themePreference: z.string().max(20).optional(),
    phoneNumber: z.string().max(20).optional(),
    slackHandle: z.string().max(50).optional(),
    hourlyCostRate: z.number().min(0).optional(),
    hourlyBillableRate: z.number().min(0).optional(),
    isBillable: z.boolean().optional(),
    employmentType: z.string().max(50).optional(),
    defaultWorkingHoursPerDay: z.number().min(0).max(24).optional(),
    hireDate: z.string().optional(),
    terminationDate: z.string().optional(),
  })
  .strict(); // Strict mode prevents unexpected fields
