import { useState, useEffect, useRef } from "react";

export type Project = {
  id: string | number;
  uid: string;
  slug?: string;
  name: string;
  owner?: string;
  ownerName?: string;
  ownerRole?: string;
  ownerAvatar?: string;
  ownerId?: string;
  status: string;
  deadline: string;
  priority?: string;
  starred?: boolean;
  members?: any[];
  coverUrl?: string; // Real DB field
  cover?: string; // Legacy fallback
  tags?: string[];
  visibility?: string; // Real DB field
  privacy?: string; // Legacy fallback
  categories?: string[] | string;
  description?: string;
  isTemplate?: boolean;
  budget?: number;
  spent?: number;
  sla?: string;
  client?: any; // Object from relation
  clientLogo?: string;
  clientName?: string;
  clientId?: string;
  tasks?: any[];
  department?: any; // Object from relation
};

export function useProjectDetails(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("pv:timeUpdated", handler);
    return () => window.removeEventListener("pv:timeUpdated", handler);
  }, []);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [projectRes, allProjectsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`, {
            next: { tags: ["projects", "tasks"] },
          }),
          fetch("/api/projects"),
        ]);

        const projectData = await projectRes.json();
        if (projectData.success && projectData.project) {
          const p = projectData.project;
          if (p.members) {
            p.members = p.members.map((m: any) => ({
              uid: m.user?.uid || m.uid,
              name: m.user?.name || m.name || "Member",
              avatarUrl: m.user?.avatarUrl || m.avatarUrl,
              role: m.user?.role || m.role,
            }));
          }
          // Also handle owner from creator userId if needed
          p.ownerId = p.userId?.toString();
          p.ownerRole = p.user?.role;
          p.ownerAvatar = p.user?.avatarUrl;
          if (p.coverUrl) p.cover = p.coverUrl;
          if (p.sla) p.sla = p.sla.toString();
          setProject(p);
        } else {
          setProject(null);
        }

        const allProjectsData = await allProjectsRes.json();
        if (allProjectsData.success) {
          setAllProjects(allProjectsData.data);
        }
      } catch (err) {
        console.error(err);
        setProject(null);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [projectId, refreshKey]);

  return {
    project,
    setProject,
    allProjects,
    isLoading,
    refresh: () => setRefreshKey((k) => k + 1),
  };
}
