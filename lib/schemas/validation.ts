import { z } from "zod";

// ============================================================================
// PROJECT SCHEMAS
// ============================================================================

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200, "Name too long"),
  description: z
    .string()
    .max(5000, "Description too long")
    .optional()
    .nullable(),
  status: z
    .string()
    .transform((val) => {
      // Normalize status to match database enum
      const normalized = val.toLowerCase().replace(/-/g, "_");
      if (
        ["active", "completed", "on_hold", "cancelled", "paused"].includes(
          normalized
        )
      ) {
        return normalized;
      }
      return "active"; // default fallback
    })
    .pipe(z.enum(["active", "completed", "on_hold", "cancelled"]))
    .default("active"),
  startDate: z.string().datetime().optional().nullable(),
  deadline: z
    .union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Accept YYYY-MM-DD format
      z.string().length(0), // Accept empty string
    ])
    .optional()
    .nullable()
    .transform((val) => {
      if (!val || val === "") return null;
      // If it's just a date, add time component
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return `${val}T00:00:00.000Z`;
      }
      return val;
    }),
  budget: z
    .union([
      z.number(),
      z.string().transform((val) => {
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      }),
    ])
    .optional()
    .nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().nullable(),
  clientName: z.string().max(200).optional().nullable(),
  clientId: z.string().uuid("Invalid client ID").optional().nullable(),
  tags: z
    .array(z.string().max(50, "Tag too long"))
    .max(20, "Too many tags")
    .default([]),
  categories: z.array(z.string().max(50)).max(20).default([]),
  visibility: z.enum(["public", "private", "team-only"]).default("private"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color hex")
    .optional()
    .nullable(),
  cover: z.string().url("Invalid cover URL").optional().nullable(),
  clientLogo: z.string().url("Invalid logo URL").optional().nullable(),
  sla: z.string().max(500).optional().nullable(),
  members: z
    .array(z.string().uuid("Invalid member ID"))
    .max(100, "Too many members")
    .default([]),
  files: z
    .array(
      z.object({
        name: z.string().max(255),
        url: z.string().url(),
        size: z.number().positive(),
        type: z.string().max(100),
      })
    )
    .max(50)
    .optional()
    .default([]),
  attachments: z.array(z.string().url()).max(50).optional().default([]),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  isTemplate: z.boolean().optional(),
});

// ============================================================================
// CLIENT SCHEMAS
// ============================================================================

export const createClientSchema = z.object({
  name: z.string().min(1, "Client name is required").max(200),
  primaryContact: z.string().max(200).optional().nullable(),
  primaryEmail: z
    .string()
    .email("Invalid email")
    .max(200)
    .optional()
    .nullable(),
  secondaryEmail: z
    .string()
    .email("Invalid email")
    .max(200)
    .optional()
    .nullable(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url("Invalid website URL").max(500).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  timezone: z.string().max(100).optional().nullable(),
  language: z.string().max(10).optional().nullable(),
  billingEmail: z
    .string()
    .email("Invalid billing email")
    .max(200)
    .optional()
    .nullable(),
  vatNumber: z.string().max(50).optional().nullable(),
  currency: z
    .string()
    .length(3, "Currency must be 3 letters")
    .optional()
    .nullable(),
  hourlyRate: z
    .number()
    .positive("Rate must be positive")
    .optional()
    .nullable(),
  paymentTerms: z.string().max(500).optional().nullable(),
  defaultVisibility: z
    .enum(["public", "private", "team-only"])
    .optional()
    .nullable(),
  customFields: z.record(z.string(), z.any()).optional().default({}),
  notes: z.string().max(5000).optional().nullable(),
  type: z.enum(["company", "individual"]).default("company"),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  logo: z.string().url("Invalid logo URL").optional().nullable(),
});

export const updateClientSchema = createClientSchema.partial();

// ============================================================================
// TIME LOG SCHEMAS
// ============================================================================

export const createTimeLogSchema = z.object({
  taskId: z.string().uuid("Invalid task ID"),
  hours: z
    .number()
    .positive("Hours must be positive")
    .max(24, "Cannot log more than 24 hours")
    .multipleOf(0.25, "Hours must be in 15-minute increments"),
  description: z
    .string()
    .max(1000, "Description too long")
    .optional()
    .nullable(),
  date: z.string().datetime("Invalid date format").optional(),
  billable: z.boolean().default(true),
});

export const updateTimeLogSchema = createTimeLogSchema.partial();

// ============================================================================
// SEARCH & FILTER SCHEMAS
// ============================================================================

export const searchQuerySchema = z.object({
  search: z
    .string()
    .max(100, "Search query too long")
    .regex(/^[a-zA-Z0-9\s@._-]*$/, "Invalid characters in search")
    .optional(),
});

export const projectFilterSchema = z.object({
  status: z
    .enum(["all", "active", "completed", "on_hold", "cancelled"])
    .optional(),
  visibility: z.enum(["all", "public", "private", "team-only"]).optional(),
  clientId: z.string().uuid().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  error?: { message: string; details: z.ZodError };
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: {
      message: "Validation failed",
      details: result.error,
    },
  };
}

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;
export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>;
