"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { X, Upload, FolderPlus, FileText } from "lucide-react";
import {
  logProjectEvent,
  setProjectDependencies,
  addProjectFile,
} from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { useState, useEffect } from "react";
import usersData from "@/data/users.json";
import categoriesData from "@/data/categories.json";

export default function NewProjectPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [draft, setDraft] = useState({
    title: "",
    cover: "",
    description: "",
    priority: "medium",
    status: "In Progress",
    deadline: "",
    privacy: "team",
    categories: [] as string[],
    tags: [] as string[],
    members: [] as { name: string; avatarUrl?: string }[],
    dependencies: [] as string[],
    client: "",
    clientLogo: "",
    budget: "",
    sla: "",
    files: [] as File[],
  });
  const [tagInput, setTagInput] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [allCategories, setAllCategories] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pv:categories");
      return saved ? JSON.parse(saved) : categoriesData;
    }
    return categoriesData;
  });

  const onCoverFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "warning");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image too large (max 5MB)", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setDraft((d) => ({ ...d, cover: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Load templates on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("pv:projects");
        const arr = raw ? JSON.parse(raw) : [];
        const tpl = Array.isArray(arr)
          ? arr.filter((p: any) => p.isTemplate)
          : [];
        setTemplates(tpl);
        setAvailableProjects(Array.isArray(arr) ? arr : []);
      } catch {}
    }
  }, []);

  // Prefill when template selected
  const applyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    setDraft({
      title: "",
      cover: tpl.cover || "",
      description: tpl.description || "",
      priority: tpl.priority || "medium",
      status: tpl.status || "In Progress",
      deadline: "",
      privacy: tpl.privacy || "team",
      categories: Array.isArray(tpl.categories) ? [...tpl.categories] : [],
      tags: Array.isArray(tpl.tags) ? [...tpl.tags] : [],
      members: [],
      dependencies: [],
      client: (tpl as any).client || "",
      clientLogo: (tpl as any).clientLogo || "",
      budget: (tpl as any).budget || "",
      sla: (tpl as any).sla || "",
      files: [],
    });
  };

  return (
    <section className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add New Project</h1>
        <Button variant="outline" onClick={() => router.push("/projects")}>
          Cancel
        </Button>
      </div>
      {templates.length > 0 && (
        <Card className="p-4 bg-accent/30">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium whitespace-nowrap">
              Start from template:
            </label>
            <select
              className="flex-1 rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                if (e.target.value) applyTemplate(e.target.value);
              }}
            >
              <option value="">-- None (blank project) --</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Select a template to prefill the form with its structure
          </p>
        </Card>
      )}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Title</label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Title"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Project Cover (URL or Upload)
            </label>
            <div className="space-y-2">
              <Input
                value={draft.cover}
                onChange={(e) => setDraft({ ...draft, cover: e.target.value })}
                placeholder="Paste image URL (https://...)"
              />
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onCoverFileSelected}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border file:border-border file:bg-card file:text-foreground hover:file:bg-accent"
                />
                {draft.cover && (
                  <button
                    type="button"
                    className="px-2 py-2 rounded-md border border-border text-sm hover:bg-accent"
                    onClick={() => setDraft({ ...draft, cover: "" })}
                    title="Remove cover"
                  >
                    Remove
                  </button>
                )}
              </div>
              {draft.cover && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">
                    Preview
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.cover}
                    alt="Cover preview"
                    className="w-full h-40 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Description</label>
            <RichTextEditor
              value={draft.description}
              onChange={(value) => setDraft({ ...draft, description: value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <select
              value={draft.priority}
              onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            >
              <option>In Progress</option>
              <option>Active</option>
              <option>Completed</option>
              <option>Paused</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Deadline</label>
            <Input
              type="date"
              value={draft.deadline}
              onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Privacy</label>
            <select
              value={draft.privacy}
              onChange={(e) => setDraft({ ...draft, privacy: e.target.value })}
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
            >
              <option value="public">Public</option>
              <option value="team">Team</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Name</label>
              <Input
                value={draft.client}
                onChange={(e) => setDraft({ ...draft, client: e.target.value })}
                placeholder="Client or organization name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Client Logo</label>
              <div className="flex gap-2">
                <Input
                  value={draft.clientLogo}
                  onChange={(e) =>
                    setDraft({ ...draft, clientLogo: e.target.value })
                  }
                  placeholder="Paste URL or upload"
                />
                <input
                  type="file"
                  id="client-logo-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 1 * 1024 * 1024) {
                        showToast("Logo must be less than 1MB", "warning");
                        e.target.value = "";
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setDraft((d) => ({
                          ...d,
                          clientLogo: reader.result as string,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("client-logo-upload")?.click()
                  }
                  title="Upload Logo"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              {draft.clientLogo && (
                <div className="mt-2 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.clientLogo}
                    alt="Client logo preview"
                    className="w-10 h-10 rounded border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, clientLogo: "" })}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Budget (USD)</label>
            <Input
              value={draft.budget}
              onChange={(e) => setDraft({ ...draft, budget: e.target.value })}
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
            <Input
              value={draft.sla}
              onChange={(e) => setDraft({ ...draft, sla: e.target.value })}
              placeholder="e.g., 30"
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categories</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {draft.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="bg-accent px-2 py-1 rounded-md text-xs flex items-center gap-1"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          categories: draft.categories.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
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
                  if (value && !draft.categories.includes(value)) {
                    setDraft({
                      ...draft,
                      categories: [...draft.categories, value],
                    });
                  }
                  e.target.value = "";
                }}
                value=""
              >
                <option value="">+ Select Category</option>
                {allCategories
                  .filter((c) => !draft.categories.includes(c))
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
              <div className="flex gap-2">
                <Input
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
                      if (!draft.categories.includes(newCat)) {
                        setDraft({
                          ...draft,
                          categories: [...draft.categories, newCat],
                        });
                      }
                      setCategoryInput("");
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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
                      if (!draft.categories.includes(newCat)) {
                        setDraft({
                          ...draft,
                          categories: [...draft.categories, newCat],
                        });
                      }
                      setCategoryInput("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select from list or add new category
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {draft.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-accent px-2 py-1 rounded-md text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          tags: draft.tags.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    setDraft({
                      ...draft,
                      tags: [...draft.tags, tagInput.trim()],
                    });
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
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FolderPlus className="w-4 h-4" />
              Attachments
            </label>
            <div className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center bg-accent/20">
              <input
                type="file"
                multiple
                className="hidden"
                id="file-attachments"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  setDraft((d) => ({
                    ...d,
                    files: [...d.files, ...newFiles],
                  }));
                  // Reset input
                  e.target.value = "";
                }}
              />
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="p-3 bg-background rounded-full shadow-sm">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Click to upload documents
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, Images (max 10MB)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("file-attachments")?.click()
                  }
                >
                  Select Files
                </Button>
              </div>
              {draft.files.length > 0 && (
                <div className="w-full max-w-md space-y-2 mt-2">
                  {draft.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-card border border-border rounded-md text-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            files: d.files.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Team Members</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {draft.members.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-accent px-2 py-1 rounded-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      m.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`
                    }
                    alt={m.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-xs">{m.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        members: draft.members.filter((_, i) => i !== idx),
                      })
                    }
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
                const selected = usersData.find(
                  (u) => u.name === e.target.value
                );
                if (
                  selected &&
                  !draft.members.find((m) => m.name === selected.name)
                ) {
                  setDraft({
                    ...draft,
                    members: [
                      ...draft.members,
                      {
                        name: selected.name,
                        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selected.name)}`,
                      },
                    ],
                  });
                }
                e.target.value = "";
              }}
              value=""
            >
              <option value="">+ Add Member</option>
              {usersData.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Dependencies</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {draft.dependencies.map((depId, idx) => {
                const dep = availableProjects.find((p) => p.id === depId);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-accent px-2 py-1 rounded-md"
                  >
                    <span className="text-xs">{dep?.name || depId}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          dependencies: draft.dependencies.filter(
                            (_, i) => i !== idx
                          ),
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            <select
              className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm"
              onChange={(e) => {
                const depId = e.target.value;
                if (depId && !draft.dependencies.includes(depId)) {
                  setDraft({
                    ...draft,
                    dependencies: [...draft.dependencies, depId],
                  });
                }
                e.target.value = "";
              }}
              value=""
            >
              <option value="">+ Add Dependency</option>
              {availableProjects
                .filter((p) => !draft.dependencies.includes(p.id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Select projects this one depends on
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="primary"
            onClick={() => {
              const newProj = {
                id: `p_${Date.now()}`,
                name: draft.title || "Untitled",
                owner: "You",
                status: draft.status as any,
                deadline: draft.deadline || "",
                priority: draft.priority as any,
                starred: false,
                members: draft.members,
                cover: draft.cover || "",
                tags: draft.tags,
                privacy: draft.privacy as any,
                categories: draft.categories,
                description: draft.description || "",
                client: draft.client || "",
                clientLogo: draft.clientLogo || "",
                budget: draft.budget || "",
                sla: draft.sla || "",
              };
              try {
                const raw = localStorage.getItem("pv:projects");
                const arr = raw ? JSON.parse(raw) : [];
                const next = Array.isArray(arr) ? [...arr, newProj] : [newProj];
                localStorage.setItem("pv:projects", JSON.stringify(next));
                logProjectEvent(newProj.id, "create", { name: newProj.name });
                // Save dependencies
                if (draft.dependencies.length > 0) {
                  setProjectDependencies(newProj.id, draft.dependencies);
                }
                // Save attachments
                if (draft.files.length > 0) {
                  draft.files.forEach(async (file) => {
                    await addProjectFile(newProj.id, file, "You");
                  });
                }
                showToast(
                  `Project "${newProj.name}" created successfully`,
                  "success"
                );
              } catch (error) {
                showToast("Failed to create project", "error");
                return;
              }
              router.push(`/projects/${newProj.id}`);
            }}
          >
            Save & Open
          </Button>
        </div>
      </Card>
    </section>
  );
}
