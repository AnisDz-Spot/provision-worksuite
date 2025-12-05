"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { readProjects, readTasks, getTasksByProject } from "@/lib/utils";

type ReportType =
  | "project_summary"
  | "task_breakdown"
  | "time_tracking"
  | "team_performance"
  | "budget_report"
  | "risk_report";

type ReportConfig = {
  type: ReportType;
  title: string;
  dateRange: { start: string; end: string };
  projects: string[];
  includeSections: {
    overview: boolean;
    tasks: boolean;
    timeline: boolean;
    team: boolean;
    budget: boolean;
    risks: boolean;
    charts: boolean;
  };
};

export function ReportBuilder() {
  const [config, setConfig] = useState<ReportConfig>({
    type: "project_summary",
    title: "Project Report",
    dateRange: {
      start: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      end: new Date().toISOString().slice(0, 10),
    },
    projects: [],
    includeSections: {
      overview: true,
      tasks: true,
      timeline: true,
      team: true,
      budget: false,
      risks: false,
      charts: true,
    },
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const projects = readProjects();
  const allTasks = readTasks();

  const reportTypes: { value: ReportType; label: string; icon: any }[] = [
    { value: "project_summary", label: "Project Summary", icon: FileText },
    { value: "task_breakdown", label: "Task Breakdown", icon: CheckCircle },
    { value: "time_tracking", label: "Time Tracking", icon: Clock },
    { value: "team_performance", label: "Team Performance", icon: Users },
    { value: "budget_report", label: "Budget Report", icon: TrendingUp },
    { value: "risk_report", label: "Risk Report", icon: AlertTriangle },
  ];

  const toggleProject = (projectId: string) => {
    setConfig((prev) => ({
      ...prev,
      projects: prev.projects.includes(projectId)
        ? prev.projects.filter((id) => id !== projectId)
        : [...prev.projects, projectId],
    }));
  };

  const toggleSection = (section: keyof ReportConfig["includeSections"]) => {
    setConfig((prev) => ({
      ...prev,
      includeSections: {
        ...prev.includeSections,
        [section]: !prev.includeSections[section],
      },
    }));
  };

  const generateHTML = () => {
    const selectedProjects = projects.filter((p) =>
      config.projects.includes(p.id)
    );

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 40px; color: #1f2937; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; }
    .header h1 { margin: 0; font-size: 32px; color: #1f2937; }
    .header .date { color: #6b7280; font-size: 14px; margin-top: 8px; }
    .section { margin-bottom: 40px; page-break-inside: avoid; }
    .section-title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 16px; border-left: 4px solid #3b82f6; padding-left: 12px; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .project-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .project-name { font-size: 18px; font-weight: 600; color: #1f2937; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger { background: #fee2e2; color: #991b1b; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
    .stat-box { background: white; padding: 16px; border-radius: 6px; border: 1px solid #e5e7eb; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 24px; font-weight: 700; color: #1f2937; margin-top: 4px; }
    .task-list { margin-top: 16px; }
    .task-item { padding: 12px; background: white; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #3b82f6; }
    .task-title { font-weight: 500; color: #1f2937; }
    .task-meta { font-size: 12px; color: #6b7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; background: white; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; color: #1f2937; font-size: 14px; }
    td { font-size: 14px; color: #374151; }
    .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${config.title}</h1>
    <div class="date">Generated on ${new Date().toLocaleDateString()} | ${config.dateRange.start} to ${config.dateRange.end}</div>
  </div>
`;

    // Overview Section
    if (config.includeSections.overview) {
      const totalTasks = selectedProjects.reduce(
        (sum, p) => sum + getTasksByProject(p.id).length,
        0
      );
      const completedTasks = selectedProjects.reduce(
        (sum, p) =>
          sum +
          getTasksByProject(p.id).filter((t) => t.status === "done").length,
        0
      );
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      html += `
  <div class="section">
    <div class="section-title">Overview</div>
    <div class="stat-grid">
      <div class="stat-box">
        <div class="stat-label">Projects</div>
        <div class="stat-value">${selectedProjects.length}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Total Tasks</div>
        <div class="stat-value">${totalTasks}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Completed</div>
        <div class="stat-value">${completedTasks}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Completion Rate</div>
        <div class="stat-value">${completionRate}%</div>
      </div>
    </div>
  </div>
`;
    }

    // Projects Section
    selectedProjects.forEach((project) => {
      const tasks = getTasksByProject(project.id);
      const completedTasks = tasks.filter((t) => t.status === "done").length;
      const statusBadge =
        project.status === "Completed"
          ? "badge-success"
          : project.status === "Active"
            ? "badge-warning"
            : "badge-danger";

      html += `
  <div class="section">
    <div class="card">
      <div class="project-header">
        <div class="project-name">${project.name}</div>
        <span class="badge ${statusBadge}">${project.status}</span>
      </div>
      <p style="color: #6b7280; margin: 8px 0;">${project.description || "No description"}</p>
      <div style="display: flex; gap: 24px; margin-top: 16px; font-size: 14px;">
        <div><strong>Owner:</strong> ${project.owner}</div>
        <div><strong>Deadline:</strong> ${project.deadline ? new Date(project.deadline).toLocaleDateString() : "No deadline"}</div>
        <div><strong>Tasks:</strong> ${completedTasks}/${tasks.length} completed</div>
      </div>
`;

      // Tasks Section
      if (config.includeSections.tasks && tasks.length > 0) {
        html += `
      <div class="task-list">
        <h4 style="margin: 16px 0 8px 0; font-size: 16px;">Tasks</h4>
`;
        tasks.slice(0, 10).forEach((task) => {
          html += `
        <div class="task-item">
          <div class="task-title">${task.title}</div>
          <div class="task-meta">
            Status: ${task.status} | 
            ${task.assignee ? `Assigned to: ${task.assignee}` : "Unassigned"} |
            ${task.priority ? `Priority: ${task.priority}` : ""}
          </div>
        </div>
`;
        });
        if (tasks.length > 10) {
          html += `<div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 8px;">+ ${tasks.length - 10} more tasks</div>`;
        }
        html += `</div>`;
      }

      // Team Section
      if (
        config.includeSections.team &&
        project.members &&
        Array.isArray(project.members) &&
        project.members.length > 0
      ) {
        html += `
      <div style="margin-top: 20px;">
        <h4 style="margin: 0 0 8px 0; font-size: 16px;">Team Members</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${project.members.map((m: any) => `<span class="badge badge-success">${m.name}</span>`).join("")}
        </div>
      </div>
`;
      }

      html += `
    </div>
  </div>
`;
    });

    // Summary Table
    if (config.includeSections.charts) {
      html += `
  <div class="section">
    <div class="section-title">Project Summary Table</div>
    <table>
      <thead>
        <tr>
          <th>Project</th>
          <th>Status</th>
          <th>Tasks</th>
          <th>Completed</th>
          <th>Progress</th>
          <th>Deadline</th>
        </tr>
      </thead>
      <tbody>
`;
      selectedProjects.forEach((project) => {
        const tasks = getTasksByProject(project.id);
        const completed = tasks.filter((t) => t.status === "done").length;
        const progress =
          tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

        html += `
        <tr>
          <td>${project.name}</td>
          <td><span class="badge ${project.status === "Completed" ? "badge-success" : project.status === "Active" ? "badge-warning" : "badge-danger"}">${project.status}</span></td>
          <td>${tasks.length}</td>
          <td>${completed}</td>
          <td>${progress}%</td>
          <td>${project.deadline ? new Date(project.deadline).toLocaleDateString() : "No deadline"}</td>
        </tr>
`;
      });
      html += `
      </tbody>
    </table>
  </div>
`;
    }

    html += `
  <div class="footer">
    <p>Generated by ProvisionWorkSuite | ${new Date().toISOString()}</p>
  </div>
</body>
</html>
`;

    return html;
  };

  const exportToPDF = async () => {
    setIsGenerating(true);
    try {
      const htmlContent = generateHTML();

      // Open in new window for printing
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToHTML = () => {
    const htmlContent = generateHTML();
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              Custom Report Builder
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create and export detailed project reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportToHTML}>
              <Download className="w-4 h-4 mr-2" />
              Export HTML
            </Button>
            <Button onClick={exportToPDF} disabled={isGenerating}>
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Print/PDF"}
            </Button>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Report Type
            </label>
            <div className="grid md:grid-cols-3 gap-3">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setConfig({ ...config, type: type.value })}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      config.type === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-2" />
                    <div className="font-medium">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Report Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Report Title
            </label>
            <Input
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Enter report title..."
            />
          </div>

          {/* Date Range */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={config.dateRange.start}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dateRange: { ...config.dateRange, start: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <Input
                type="date"
                value={config.dateRange.end}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    dateRange: { ...config.dateRange, end: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Project Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Select Projects ({config.projects.length} selected)
            </label>
            <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-accent/20 rounded-lg">
              {projects.map((project) => (
                <label
                  key={project.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.projects.includes(project.id)}
                    onChange={() => toggleProject(project.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{project.name}</span>
                </label>
              ))}
              {projects.length === 0 && (
                <div className="col-span-2 text-center text-muted-foreground py-4 text-sm">
                  No projects available
                </div>
              )}
            </div>
          </div>

          {/* Sections to Include */}
          <div>
            <label className="block text-sm font-medium mb-3">
              Include Sections
            </label>
            <div className="grid md:grid-cols-3 gap-2">
              {Object.entries(config.includeSections).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() =>
                      toggleSection(
                        key as keyof ReportConfig["includeSections"]
                      )
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Preview */}
      {config.projects.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
          <div className="bg-accent/20 p-4 rounded-lg space-y-2 text-sm">
            <div>
              <strong>Report:</strong> {config.title}
            </div>
            <div>
              <strong>Type:</strong>{" "}
              {reportTypes.find((t) => t.value === config.type)?.label}
            </div>
            <div>
              <strong>Period:</strong> {config.dateRange.start} to{" "}
              {config.dateRange.end}
            </div>
            <div>
              <strong>Projects:</strong> {config.projects.length} selected
            </div>
            <div>
              <strong>Sections:</strong>{" "}
              {Object.values(config.includeSections).filter((v) => v).length}{" "}
              included
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
