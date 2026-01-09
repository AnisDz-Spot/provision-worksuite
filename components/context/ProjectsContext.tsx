"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Project, loadProjects } from "@/lib/data";
import { log } from "@/lib/logger";
import { useRevalidatedData } from "@/hooks/useRevalidatedData";

interface ProjectsContextType {
  projects: Project[];
  isLoading: boolean;
  refreshing: boolean;
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
  const options = React.useMemo(
    () => ({
      persistKey: "projects",
      onError: (err: any) => console.error("Failed to load projects:", err),
    }),
    []
  );

  const {
    data: projectsData,
    loading: isLoading,
    refreshing,
    error,
    refresh: refreshProjects,
    setData: setProjects,
  } = useRevalidatedData<Project[]>(loadProjects, options);

  const projects = projectsData || [];
  const lastFetched = null; // No longer explicitly tracked outside the hook if not needed

  const updateProject = (updatedProject: Project) => {
    setProjects((prev) =>
      (prev || []).map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const deleteProjectInCache = (projectId: string) => {
    setProjects((prev) => (prev || []).filter((p) => p.id !== projectId));
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        isLoading,
        refreshing,
        error: error ? String(error) : null,
        refreshProjects: async () => {
          await refreshProjects();
        },
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
