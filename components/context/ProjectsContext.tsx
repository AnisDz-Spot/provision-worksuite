"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Project } from "@/lib/data";
import { log } from "@/lib/logger";

interface ProjectsContextType {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  updateProject: (updatedProject: Project) => void;
  deleteProjectInCache: (projectId: string) => void;
  lastFetched: number | null;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(
  undefined
);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const fetchProjects = useCallback(
    async (force = false) => {
      // If we have data and it's fresh, don't refetch unless forced
      if (
        !force &&
        lastFetched &&
        Date.now() - lastFetched < CACHE_DURATION &&
        projects.length > 0
      ) {
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Dynamic import to avoid server-side issues if any
        const { loadProjects } = await import("@/lib/data");
        const data = await loadProjects();

        if (Array.isArray(data)) {
          setProjects(data);
          setLastFetched(Date.now());
        } else {
          setProjects([]);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
        setError("Failed to load projects");
        // Don't clear projects on error to show stale data if possible
      } finally {
        setIsLoading(false);
      }
    },
    [lastFetched, projects.length]
  );

  // Initial load
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const refreshProjects = async () => {
    await fetchProjects(true);
  };

  const updateProject = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const deleteProjectInCache = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        isLoading,
        error,
        refreshProjects,
        updateProject,
        deleteProjectInCache,
        lastFetched,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}
