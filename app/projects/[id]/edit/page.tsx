"use client";
import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeftIcon, X } from "lucide-react";
import { logProjectEvent } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { useToast } from "@/components/ui/Toast";
import usersData from "@/data/users.json";
import categoriesData from "@/data/categories.json";
import { log } from "@/lib/logger";
import Image from "next/image";
import { getCsrfToken } from "@/lib/csrf-client";

type Project = {
  id: string;
  uid?: string;
  slug?: string;
  name: string;
  owner: string;
  status: "Active" | "Completed" | "Paused" | "In Progress";
  deadline: string;
  priority?: "low" | "medium" | "high";
  starred?: boolean;
  members?: { name: string; avatarUrl?: string }[];
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
};

// Local storage load removed

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const projectId = params.id as string;
  const [project, setProject] = React.useState<Project | null>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [tagInput, setTagInput] = React.useState("");
  const [categoryInput, setCategoryInput] = React.useState("");
  const [allCategories, setAllCategories] = React.useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pv:categories");
      return saved ? JSON.parse(saved) : categoriesData;
    }
    return categoriesData;
  });

  const [clients, setClients] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectRes, clientsRes, usersRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch("/api/clients"),
          fetch("/api/users"),
        ]);

        if (projectRes.ok) {
          const data = await projectRes.json();
          if (data.success) {
            const p = data.project;
            // Map API response to local state structure
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
              sla: p.slaTargetDays ? p.slaTargetDays.toString() : "",
              isTemplate: p.isTemplate,
            });
          }
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
  }, [projectId]);

  const handleSave = async () => {
    if (!project) return;
    try {
      const csrfToken = getCsrfToken();

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken || "",
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
          deadline: project.deadline,
          budget: (project as any).budget,
          clientId: (project as any).clientId,
          clientName: (project as any).client,
          tags: project.tags,
          categories: project.categories,
          visibility: project.privacy,
          cover: project.cover,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      logProjectEvent(project.id, "edit", { name: project.name });
      showToast("Project saved successfully", "success");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      log.error({ err: error }, "Failed to save project");
      showToast("Failed to save project", "error");
    }
  };

  if (loading) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading project...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Project not found
          </h1>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8 p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href={`/projects/${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <div className="w-32" /> {/* Spacer for centering */}
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Title</label>
              <input
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={project.name || ""}
                onChange={(e) =>
                  setProject((p) => (p ? { ...p, name: e.target.value } : p))
                }
                placeholder="Title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Image</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                  value={project.cover || ""}
                  onChange={(e) =>
                    setProject((p) => (p ? { ...p, cover: e.target.value } : p))
                  }
                  placeholder="https://..."
                />
                <input
                  type="file"
                  id="cover-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        showToast("Image must be less than 2MB", "error");
                        e.target.value = "";
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProject((p) =>
                          p ? { ...p, cover: reader.result as string } : p
                        );
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-[42px] shrink-0"
                  onClick={() =>
                    document.getElementById("cover-upload")?.click()
                  }
                >
                  Upload
                </Button>
              </div>
              {project.cover && (
                <div className="mt-3 rounded-lg border border-border overflow-hidden bg-muted relative group">
                  <Image
                    src={project.cover}
                    alt="Project cover preview"
                    width={800}
                    height={192}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLElement).parentElement;
                      if (parent && !parent.querySelector(".error-message")) {
                        const errorDiv = document.createElement("div");
                        errorDiv.className =
                          "error-message flex items-center justify-center h-48 text-sm text-muted-foreground";
                        errorDiv.textContent = "Invalid image URL";
                        parent.appendChild(errorDiv);
                      }
                    }}
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.display = "block";
                      const parent = (e.target as HTMLElement).parentElement;
                      const errorDiv = parent?.querySelector(".error-message");
                      if (errorDiv) errorDiv.remove();
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProject((p) => (p ? { ...p, cover: "" } : p))
                    }
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-destructive/90 text-white hover:bg-destructive transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Enter URL or upload an image (max 2MB)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <RichTextEditor
              value={project.description || ""}
              onChange={(value) =>
                setProject((p) => (p ? { ...p, description: value } : p))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={project.priority || "medium"}
                onChange={(e) =>
                  setProject((p) =>
                    p ? { ...p, priority: e.target.value as any } : p
                  )
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={project.status || "In Progress"}
                onChange={(e) =>
                  setProject((p) =>
                    p ? { ...p, status: e.target.value as any } : p
                  )
                }
              >
                <option>In Progress</option>
                <option>Active</option>
                <option>Completed</option>
                <option>Paused</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <input
                type="date"
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={project.deadline || ""}
                onChange={(e) =>
                  setProject((p) =>
                    p ? { ...p, deadline: e.target.value } : p
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Privacy</label>
              <select
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={project.privacy || "team"}
                onChange={(e) =>
                  setProject((p) =>
                    p ? { ...p, privacy: e.target.value as any } : p
                  )
                }
              >
                <option value="public">Public</option>
                <option value="team">Team</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <select
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={(project as any).clientId || ""}
                onChange={(e) => {
                  const cid = e.target.value;
                  const c = clients.find((cl) => cl.id === cid);
                  setProject((p) =>
                    p
                      ? ({ ...p, clientId: cid, client: c?.name || "" } as any)
                      : p
                  );
                }}
              >
                <option value="">-- Select Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Budget (USD)</label>
              <input
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={(project as any).budget || ""}
                onChange={(e) =>
                  setProject((p) =>
                    p ? ({ ...p, budget: e.target.value } as any) : p
                  )
                }
                placeholder="e.g., 50000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                <abbr
                  className="border-b border-dashed border-current no-underline cursor-help"
                  title="Service Level Agreement"
                >
                  SLA
                </abbr>{" "}
                Target (days)
              </label>
              <input
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={(project as any).sla || ""}
                onChange={(e) =>
                  setProject((p) =>
                    p ? ({ ...p, sla: e.target.value } as any) : p
                  )
                }
                placeholder="e.g., 30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={project.isTemplate || false}
                onChange={(e) =>
                  setProject((p) =>
                    p ? { ...p, isTemplate: e.target.checked } : p
                  )
                }
                className="w-4 h-4 rounded border-border"
              />
              Mark as Template
            </label>
            <p className="text-xs text-muted-foreground">
              Allow this project to be used as a template for new projects
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categories</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(Array.isArray(project.categories)
                  ? project.categories
                  : []
                ).map((cat: string, idx: number) => (
                  <span
                    key={idx}
                    className="bg-accent px-2 py-1 rounded-md text-xs flex items-center gap-1"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => {
                        const cats = Array.isArray(project.categories)
                          ? project.categories
                          : [];
                        setProject((p) =>
                          p
                            ? {
                                ...p,
                                categories: cats.filter((_, i) => i !== idx),
                              }
                            : p
                        );
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <select
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm mb-2"
                onChange={(e) => {
                  const value = e.target.value;
                  const cats = Array.isArray(project.categories)
                    ? project.categories
                    : [];
                  if (value && !cats.includes(value)) {
                    setProject((p) =>
                      p ? { ...p, categories: [...cats, value] } : p
                    );
                  }
                  e.target.value = "";
                }}
                value=""
              >
                <option value="">+ Select Category</option>
                {allCategories
                  .filter(
                    (c) =>
                      !(
                        Array.isArray(project.categories)
                          ? project.categories
                          : []
                      ).includes(c)
                  )
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="Add new category"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && categoryInput.trim()) {
                      e.preventDefault();
                      const newCat = categoryInput.trim();
                      if (!allCategories.includes(newCat)) {
                        const updated = [...allCategories, newCat];
                        setAllCategories(updated);
                        localStorage.setItem(
                          "pv:categories",
                          JSON.stringify(updated)
                        );
                      }
                      const cats = Array.isArray(project.categories)
                        ? project.categories
                        : [];
                      if (!cats.includes(newCat)) {
                        setProject((p) =>
                          p ? { ...p, categories: [...cats, newCat] } : p
                        );
                      }
                      setCategoryInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-md border border-border bg-card text-foreground text-sm hover:bg-accent"
                  onClick={() => {
                    if (categoryInput.trim()) {
                      const newCat = categoryInput.trim();
                      if (!allCategories.includes(newCat)) {
                        const updated = [...allCategories, newCat];
                        setAllCategories(updated);
                        localStorage.setItem(
                          "pv:categories",
                          JSON.stringify(updated)
                        );
                      }
                      const cats = Array.isArray(project.categories)
                        ? project.categories
                        : [];
                      if (!cats.includes(newCat)) {
                        setProject((p) =>
                          p ? { ...p, categories: [...cats, newCat] } : p
                        );
                      }
                      setCategoryInput("");
                    }
                  }}
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select from list or add new category
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(project.tags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-accent px-2 py-1 rounded-md text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setProject((p) =>
                          p
                            ? {
                                ...p,
                                tags: (p.tags || []).filter(
                                  (_, i) => i !== idx
                                ),
                              }
                            : p
                        )
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    setProject((p) =>
                      p
                        ? { ...p, tags: [...(p.tags || []), tagInput.trim()] }
                        : p
                    );
                    setTagInput("");
                  }
                }}
                placeholder="Type tag and press Enter"
              />
              <p className="text-xs text-muted-foreground">
                Press Enter to add a tag
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Team Members</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(project.members || []).map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-accent px-2 py-1 rounded-md"
                >
                  <Image
                    src={
                      m.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`
                    }
                    alt={m.name}
                    width={20}
                    height={20}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-xs">{m.name}</span>
                  <button
                    onClick={() => {
                      setProject((p) =>
                        p
                          ? {
                              ...p,
                              members: (p.members || []).filter(
                                (_, i) => i !== idx
                              ),
                            }
                          : p
                      );
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <select
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              onChange={(e) => {
                const selected = users.find((u) => u.name === e.target.value);
                if (
                  selected &&
                  !project.members?.find((m) => m.name === selected.name)
                ) {
                  setProject((p) =>
                    p
                      ? {
                          ...p,
                          members: [
                            ...(p.members || []),
                            {
                              name: selected.name,
                              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selected.name)}`,
                            },
                          ],
                        }
                      : p
                  );
                }
                e.target.value = "";
              }}
              value=""
            >
              <option value="">Select members…</option>
              {users.map((u) => (
                <option key={u.uid} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </section>
  );
}
