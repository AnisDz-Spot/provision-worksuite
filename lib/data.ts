/**
 * Centralized data loading utility
 * Automatically switches between database and localStorage based on configuration
 */

import { shouldUseDatabaseData } from "./dataSource";
import { getCsrfToken } from "@/lib/csrf-client";

// Mock data imports
import PROJECTS from "@/data/projects.json";
import TASKS from "@/data/tasks.json";
import USERS from "@/data/users.json";

function mapMockUsers(users: any[]): User[] {
  return users.map((u: any) => ({
    uid: u.id || u.uid,
    email: u.email,
    name: u.name,
    avatar_url: u.avatar_url || undefined,
    role: u.role,
    department: u.department || undefined,
    status: u.status || undefined,
    created_at: u.created_at || undefined,
  }));
}

export interface Project {
  id: string;
  uid?: string;
  slug?: string;
  name: string;
  owner: string;
  status: "Active" | "Completed" | "Paused" | "In Progress";
  deadline: string; // ISO date
  description?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  team?: string[];
  starred?: boolean;
  budget?: number;
  spent?: number;
  hourlyRate?: number; // optional, for billing calculations
  priority?: "low" | "medium" | "high";
  category?: string;
  members?: { name: string; avatarUrl?: string }[];
  isTemplate?: boolean;
  archived?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignee?: string;
  projectId?: string;
  dueDate?: string;
  tags?: string[];
  progress?: number;
}

export interface User {
  uid: string;
  email: string;
  name: string;
  avatar_url?: string;
  role?: string;
  department?: string;
  status?: string;
  created_at?: string;
}

/**
 * Load projects from database or localStorage
 */
/**
 * Load projects from database or localStorage
 */
export async function loadProjects(): Promise<Project[]> {
  if (shouldUseDatabaseData()) {
    try {
      const res = await fetch("/api/projects");
      const result = await res.json();
      if (result.success) {
        return result.data || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }
  // Fallback behavior only if explicitly NOT in database mode
  const stored = localStorage.getItem("pv:projects");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Project[];
      }
    } catch {}
  }
  return PROJECTS as Project[];
}

/**
 * Save projects to database or localStorage
 */
export async function saveProjects(projects: Project[]): Promise<boolean> {
  if (shouldUseDatabaseData()) {
    try {
      const res = await fetch("/api/projects/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken() || "",
        },
        credentials: "include",
        body: JSON.stringify({ projects }),
      });

      const result = await res.json();
      if (result.success) {
        return true;
      }

      console.error("Failed to bulk save projects:", result.error);
      return false;
    } catch (error) {
      console.error("Error bulk saving projects:", error);
      return false;
    }
  }

  try {
    localStorage.setItem("pv:projects", JSON.stringify(projects));
    return true;
  } catch (error) {
    console.error("Error saving projects to localStorage:", error);
    return false;
  }
}

/**
 * Load tasks from database or localStorage
 */
export async function loadTasks(): Promise<Task[]> {
  if (shouldUseDatabaseData()) {
    try {
      const res = await fetch("/api/tasks");
      const result = await res.json();
      if (result.success) {
        return result.data || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }
  // Fallback behavior only if explicitly NOT in database mode
  const stored = localStorage.getItem("pv:tasks");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Task[];
      }
    } catch {}
  }
  return TASKS as Task[];
}

/**
 * Save tasks to database or localStorage
 */
export async function saveTasks(tasks: Task[]): Promise<boolean> {
  if (shouldUseDatabaseData()) {
    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": getCsrfToken() || "",
        },
        credentials: "include",
        body: JSON.stringify({ tasks }),
      });

      const result = await res.json();
      if (result.success) {
        return true;
      }

      console.error("Failed to bulk save tasks:", result.error);
      return false;
    } catch (error) {
      console.error("Error bulk saving tasks:", error);
      return false;
    }
  }

  try {
    localStorage.setItem("pv:tasks", JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Error saving tasks to localStorage:", error);
    return false;
  }
}

/**
 * Load users from database or localStorage
 */
export async function loadUsers(): Promise<User[]> {
  if (shouldUseDatabaseData()) {
    try {
      const res = await fetch("/api/users");
      const result = await res.json();
      if (result.success) {
        return result.data || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }
  // Fallback behavior only if explicitly NOT in database mode
  const stored = localStorage.getItem("pv:users");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as User[];
      }
    } catch {}
  }
  // Convert USERS data to User format
  return mapMockUsers(USERS as any[]);
}

/**
 * Get data source for debugging
 */
export function getDataSourceDebugInfo(): {
  source: "database" | "mock";
  configured: boolean;
} {
  const configured = shouldUseDatabaseData();
  return {
    source: configured ? "database" : "mock",
    configured,
  };
}
