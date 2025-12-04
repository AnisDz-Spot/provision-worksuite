"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Eye, EyeOff, Bell, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export type ProjectSubscription = {
  projectId: string;
  projectName: string;
  events: (
    | "task_created"
    | "task_completed"
    | "milestone_reached"
    | "deadline_changed"
    | "member_added"
    | "status_changed"
  )[];
  subscribedAt: string;
};

export function ProjectWatch() {
  const [subscriptions, setSubscriptions] = useState<ProjectSubscription[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  const availableEvents = [
    { id: "task_created", label: "Task Created", color: "blue" },
    { id: "task_completed", label: "Task Completed", color: "green" },
    { id: "milestone_reached", label: "Milestone Reached", color: "purple" },
    { id: "deadline_changed", label: "Deadline Changed", color: "amber" },
    { id: "member_added", label: "Member Added", color: "cyan" },
    { id: "status_changed", label: "Status Changed", color: "pink" },
  ];

  useEffect(() => {
    setMounted(true);
    loadSubscriptions();
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSubscriptions = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("pv:projectSubscriptions");
      if (stored) {
        setSubscriptions(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error);
    }
  };

  const loadProjects = async () => {
    if (typeof window === "undefined") return;
    try {
      const { loadProjects: fetchProjects } = await import("@/lib/data");
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      setProjects([]);
    }
  };

  const saveSubscriptions = (updated: ProjectSubscription[]) => {
    setSubscriptions(updated);
    localStorage.setItem("pv:projectSubscriptions", JSON.stringify(updated));
  };

  const addSubscription = () => {
    if (!selectedProject || selectedEvents.length === 0) return;

    const project = projects.find((p) => p.id === selectedProject);
    if (!project) return;

    // Check if already subscribed
    if (subscriptions.some((s) => s.projectId === selectedProject)) {
      // Update existing subscription
      const updated = subscriptions.map((s) =>
        s.projectId === selectedProject
          ? { ...s, events: selectedEvents as any }
          : s
      );
      saveSubscriptions(updated);
    } else {
      // Add new subscription
      const newSub: ProjectSubscription = {
        projectId: project.id,
        projectName: project.name || project.title,
        events: selectedEvents as any,
        subscribedAt: new Date().toISOString(),
      };
      saveSubscriptions([...subscriptions, newSub]);
    }

    setSelectedProject("");
    setSelectedEvents([]);
    setAddOpen(false);
  };

  const removeSubscription = (projectId: string) => {
    if (confirm("Unsubscribe from this project's notifications?")) {
      saveSubscriptions(subscriptions.filter((s) => s.projectId !== projectId));
    }
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const unsubscribedProjects = projects.filter(
    (p) => !subscriptions.some((s) => s.projectId === p.id)
  );

  if (!mounted) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Project Watch</h2>
            <p className="text-sm text-muted-foreground">
              Subscribe to project notifications
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setAddOpen(!addOpen)}
          disabled={unsubscribedProjects.length === 0}
        >
          <Plus className="w-4 h-4 mr-1" />
          Watch Project
        </Button>
      </div>

      {/* Add subscription form */}
      {addOpen && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-accent/20">
          <h3 className="font-semibold mb-4">Subscribe to Project</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="">Choose a project...</option>
                {unsubscribedProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name || project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Select Events to Watch
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-left ${
                      selectedEvents.includes(event.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-accent"
                    }`}
                  >
                    <Bell className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{event.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={addSubscription}
                disabled={!selectedProject || selectedEvents.length === 0}
              >
                Subscribe
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions list */}
      <div className="space-y-3">
        {subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Not watching any projects</p>
            <p className="text-sm">
              Subscribe to receive notifications for project events
            </p>
          </div>
        ) : (
          subscriptions.map((sub) => (
            <div
              key={sub.projectId}
              className="border border-border rounded-lg p-4 bg-card"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold">{sub.projectName}</h4>
                </div>
                <button
                  onClick={() => removeSubscription(sub.projectId)}
                  className="p-1 hover:bg-accent rounded transition-colors"
                  title="Unsubscribe"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {sub.events.map((event) => {
                  const eventInfo = availableEvents.find((e) => e.id === event);
                  return (
                    <Badge key={event} variant="secondary" className="text-xs">
                      {eventInfo?.label || event}
                    </Badge>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Subscribed {new Date(sub.subscribedAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
