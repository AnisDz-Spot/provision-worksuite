import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import categoriesData from "@/data/categories.json";

export type Project = {
  id: string;
  uid?: string;
  slug?: string;
  name: string;
  owner: string;
  status: "Active" | "Completed" | "Paused" | "In Progress";
  deadline: string;
  priority?: "low" | "medium" | "high";
  starred?: boolean;
  cover?: string;
  tags?: string[];
  privacy?: "public" | "team" | "private";
  categories?: string[] | string;
  description?: string;
  isTemplate?: boolean;
  client?: string;
  clientId?: string;
  budget?: string;
  sla?: string;
  members?: { uid: string; name: string; avatarUrl?: string }[];
};

export function useProjectEditData(projectId: string) {
  const router = useRouter();
  const { showToast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [allCategories, setAllCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pv:categories");
      return saved ? JSON.parse(saved) : categoriesData;
    }
    return categoriesData;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [authRes, projectRes, clientsRes, usersRes, allProjectsRes] =
          await Promise.all([
            fetch("/api/auth/me"),
            fetch(`/api/projects/${projectId}`),
            fetch("/api/clients"),
            fetch("/api/users"),
            fetch("/api/projects"),
          ]);

        if (authRes.ok) {
          const authData = await authRes.json();
          if (authData.success) {
            const user = authData.user;
            setCurrentUser(user);

            const role = user.role?.toLowerCase() || "";
            const isAuthorized =
              [
                "admin",
                "administrator",
                "master admin",
                "project manager",
              ].includes(role) || user.uid === "admin-global";

            if (!isAuthorized) {
              showToast(
                "Unauthorized: Only admins and project managers can edit projects",
                "error"
              );
              router.push(`/projects/${projectId}`);
              return;
            }
          }
        }

        if (projectRes.ok) {
          const data = await projectRes.json();
          if (data.success) {
            const p = data.project;
            setProject({
              id: p.id.toString(),
              uid: p.uid,
              slug: p.slug,
              name: p.name,
              owner: p.userId ? p.userId.toString() : "",
              status: p.status,
              deadline: p.deadline ? p.deadline.split("T")[0] : "",
              priority: p.priority,
              cover: p.coverUrl,
              tags: p.tags,
              privacy: p.visibility,
              categories: p.categories,
              description: p.description,
              client: p.clientName,
              clientId: p.clientId,
              budget: p.budget ? p.budget.toString() : "",
              sla: p.sla ? p.sla.toString() : "",
              isTemplate: p.isTemplate,
              members: (p.members || []).map((m: any) => ({
                uid: m.user?.uid || "",
                name: m.user?.name || "Member",
                avatarUrl: m.user?.avatarUrl,
              })),
            });
          }
        }

        if (allProjectsRes.ok) {
          const data = await allProjectsRes.json();
          if (data.success) setAllProjects(data.data);
        }

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          if (data.success) setClients(data.data);
        }

        if (usersRes.ok) {
          const data = await usersRes.json();
          if (data.success) setUsers(data.data);
        }
      } catch (error) {
        console.error(error);
        showToast("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, router, showToast]);

  return {
    project,
    setProject,
    currentUser,
    users,
    clients,
    allProjects,
    loading,
    allCategories,
    setAllCategories,
  };
}
