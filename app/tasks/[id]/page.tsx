"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeftIcon, CalendarIcon, UserIcon, FlagIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Mock task data - replace with real data from DB
const tasksData: { [key: string]: any } = {
  task1: {
    id: "task1",
    title: "Design Dashboard Layout",
    description:
      "Create wireframes and mockups for the new dashboard interface. Include responsive designs for mobile and desktop views.",
    project: "Project Alpha",
    projectId: "p1",
    assignee: "Alice Johnson",
    status: "In Progress",
    priority: "High",
    dueDate: "2025-12-05",
    createdDate: "2025-11-20",
    completedDate: null,
    progress: 75,
    subtasks: [
      { id: 1, title: "Create wireframes", completed: true },
      { id: 2, title: "Design mockups", completed: true },
      { id: 3, title: "Get stakeholder feedback", completed: false },
      { id: 4, title: "Finalize design system", completed: false },
    ],
  },
  task2: {
    id: "task2",
    title: "API Integration",
    description:
      "Integrate backend APIs with the frontend dashboard. Handle error states and loading states properly.",
    project: "Project Alpha",
    projectId: "p1",
    assignee: "Bob Smith",
    status: "In Progress",
    priority: "Critical",
    dueDate: "2025-12-08",
    createdDate: "2025-11-25",
    completedDate: null,
    progress: 60,
    subtasks: [
      { id: 1, title: "Setup API client", completed: true },
      { id: 2, title: "Implement authentication", completed: true },
      { id: 3, title: "Add request interceptors", completed: false },
      { id: 4, title: "Test all endpoints", completed: false },
    ],
  },
  task3: {
    id: "task3",
    title: "Write Unit Tests",
    description:
      "Write comprehensive unit tests for dashboard components with at least 80% code coverage.",
    project: "Project Beta",
    projectId: "p2",
    assignee: "Carol Davis",
    status: "Completed",
    priority: "Medium",
    dueDate: "2025-10-20",
    createdDate: "2025-10-01",
    completedDate: "2025-10-20",
    progress: 100,
    subtasks: [
      { id: 1, title: "Setup testing framework", completed: true },
      { id: 2, title: "Write component tests", completed: true },
      { id: 3, title: "Write utility tests", completed: true },
      { id: 4, title: "Achieve 80% coverage", completed: true },
    ],
  },
};

export default function TaskDetailsPage() {
  const params = useParams();
  const taskId = params.id as string;
  const task = tasksData[taskId];

  if (!task) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Task not found</h1>
        </div>
      </section>
    );
  }

  const priorityColors: { [key: string]: string } = {
    Critical: "bg-red-500/20 text-red-500",
    High: "bg-orange-500/20 text-orange-500",
    Medium: "bg-blue-500/20 text-blue-500",
    Low: "bg-green-500/20 text-green-500",
  };

  const statusColors: { [key: string]: string } = {
    "In Progress": "bg-blue-500/20 text-blue-500",
    Completed: "bg-green-500/20 text-green-500",
    "Not Started": "bg-gray-500/20 text-gray-500",
    Blocked: "bg-red-500/20 text-red-500",
  };

  const completedSubtasks = task.subtasks.filter(
    (st: any) => st.completed
  ).length;

  return (
    <section className="flex flex-col gap-8 p-4 md:p-8">
      <Link href="/tasks">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Tasks
        </Button>
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {task.title}
        </h1>
        <p className="text-muted-foreground text-lg mb-6">{task.description}</p>

        <div className="flex flex-wrap gap-3 mb-6">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[task.status] || statusColors["Not Started"]
            }`}
          >
            {task.status}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              priorityColors[task.priority] || priorityColors.Medium
            }`}
          >
            <FlagIcon className="w-3 h-3 mr-1" />
            {task.priority}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Assignee */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Assigned To
            </h3>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {task.assignee}
          </p>
        </Card>

        {/* Due Date */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">
              Due Date
            </h3>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {new Date(task.dueDate).toLocaleDateString()}
          </p>
        </Card>

        {/* Project */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Project
          </h3>
          <Link href={`/projects/${task.projectId}`}>
            <p className="text-lg font-semibold text-blue-500 hover:text-blue-600 transition-colors">
              {task.project}
            </p>
          </Link>
        </Card>

        {/* Progress */}
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Progress
          </h3>
          <div className="mb-2">
            <div className="text-2xl font-bold text-foreground">
              {task.progress}%
            </div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${task.progress}%` }}
              ></div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Subtasks</h3>
        <div className="space-y-3">
          {task.subtasks.map((subtask: any) => (
            <div
              key={subtask.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
            >
              <div
                className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  subtask.completed
                    ? "bg-green-500 border-green-500"
                    : "border-muted-foreground/30"
                }`}
              >
                {subtask.completed && (
                  <span className="text-white text-sm font-bold">✓</span>
                )}
              </div>
              <span
                className={`flex-1 ${
                  subtask.completed
                    ? "line-through text-muted-foreground"
                    : "text-foreground"
                }`}
              >
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {completedSubtasks} of {task.subtasks.length} subtasks completed
          </p>
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{
                width: `${(completedSubtasks / task.subtasks.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dates */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Timeline
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Created</p>
              <p className="text-foreground font-medium">
                {new Date(task.createdDate).toLocaleDateString()}
              </p>
            </div>
            {task.completedDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-green-500 font-medium">
                  {new Date(task.completedDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
