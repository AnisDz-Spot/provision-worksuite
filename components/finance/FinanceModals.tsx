"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  budget?: number;
  hourlyRate?: number;
  revenue?: number;
  alertThresholds?: number[];
};

interface FinanceModalsProps {
  projects: Project[];
  setProjects: (p: Project[]) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  editingProject: Project | null;
  setEditingProject: (p: Project | null) => void;
  invoiceOpen: boolean;
  setInvoiceOpen: (open: boolean) => void;
  newInvoice: {
    projectId: string;
    clientName: string;
    issueDate: string;
    dueDate: string;
  };
  setNewInvoice: (data: any) => void;
  timeLogs: any[];
  expenses: any[];
  onCreateInvoice: () => void;
}

export function FinanceModals({
  projects,
  setProjects,
  settingsOpen,
  setSettingsOpen,
  editingProject,
  setEditingProject,
  invoiceOpen,
  setInvoiceOpen,
  newInvoice,
  setNewInvoice,
  timeLogs,
  expenses,
  onCreateInvoice,
}: FinanceModalsProps) {
  const router = useRouter();

  const handleSaveSettings = () => {
    if (!editingProject) return;
    setProjects(
      projects.map((p) => (p.id === editingProject.id ? editingProject : p)),
    );
    setSettingsOpen(false);
  };

  return (
    <>
      <Modal open={settingsOpen} onOpenChange={setSettingsOpen} size="md">
        <h2 className="text-xl font-semibold mb-4">
          Project Financial Settings
        </h2>
        {projects.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">No Projects Found</h3>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                You need to create a project before you can configure its
                financial settings.
              </p>
            </div>
            <Button onClick={() => router.push("/projects/new")}>
              Create Project
            </Button>
          </div>
        ) : editingProject ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project</label>
              <select
                value={editingProject.id}
                onChange={(e) =>
                  setEditingProject(
                    projects.find((p) => p.id === e.target.value) || null,
                  )
                }
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm w-full"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Budget ($)
                </label>
                <Input
                  type="number"
                  value={editingProject.budget || 0}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      budget: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Hourly Rate ($)
                </label>
                <Input
                  type="number"
                  value={editingProject.hourlyRate || 0}
                  onChange={(e) =>
                    setEditingProject({
                      ...editingProject,
                      hourlyRate: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Expected Revenue ($)
              </label>
              <Input
                type="number"
                value={editingProject.revenue || 0}
                onChange={(e) =>
                  setEditingProject({
                    ...editingProject,
                    revenue: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Budget Alert Thresholds (%)
              </label>
              <div className="flex gap-2">
                {(editingProject.alertThresholds || [80, 90, 100]).map(
                  (val, idx) => (
                    <Input
                      key={idx}
                      type="number"
                      value={val}
                      onChange={(e) => {
                        const newThresholds = [
                          ...(editingProject.alertThresholds || [80, 90, 100]),
                        ];
                        newThresholds[idx] = parseFloat(e.target.value) || 0;
                        setEditingProject({
                          ...editingProject,
                          alertThresholds: newThresholds,
                        });
                      }}
                      className="w-20"
                    />
                  ),
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>Save</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal open={invoiceOpen} onOpenChange={setInvoiceOpen} size="md">
        <h2 className="text-xl font-semibold mb-4">Create Invoice</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project</label>
            <select
              value={newInvoice.projectId}
              onChange={(e) =>
                setNewInvoice({ ...newInvoice, projectId: e.target.value })
              }
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm w-full"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Client Name
            </label>
            <Input
              value={newInvoice.clientName}
              onChange={(e) =>
                setNewInvoice({ ...newInvoice, clientName: e.target.value })
              }
              placeholder="Acme Corp"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                Issue Date
              </label>
              <Input
                type="date"
                value={newInvoice.issueDate}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, issueDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <Input
                type="date"
                value={newInvoice.dueDate}
                onChange={(e) =>
                  setNewInvoice({ ...newInvoice, dueDate: e.target.value })
                }
              />
            </div>
          </div>
          {newInvoice.projectId && (
            <Card className="p-3 bg-accent/10">
              <div className="text-xs font-medium mb-2">
                Preview (Auto-calculated Items)
              </div>
              <div className="text-sm space-y-1">
                <div>
                  Time Logs:{" "}
                  {timeLogs
                    .filter((t) => t.projectId === newInvoice.projectId)
                    .reduce((s, t) => s + t.hours, 0)}{" "}
                  hrs
                </div>
                <div>
                  Expenses:{" "}
                  {
                    expenses.filter((e) => e.projectId === newInvoice.projectId)
                      .length
                  }{" "}
                  items
                </div>
              </div>
            </Card>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onCreateInvoice}>Create Invoice</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
