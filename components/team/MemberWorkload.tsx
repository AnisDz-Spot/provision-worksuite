"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  status: "todo" | "in-progress" | "done" | "blocked";
  priority: "low" | "medium" | "high";
  estimatedHours?: number;
  assignee?: string;
  dueDate?: string;
  assigneeName?: string;
};

type Member = {
  id: string;
  name: string;
  avatarUrl?: string;
  capacity: number; // hours per week
  skills?: string[];
};

type MemberWorkloadProps = {
  projectId?: string;
};

// Mock data - in production, load from API/localStorage
const MEMBERS: Member[] = [
  {
    id: "1",
    name: "Anis Dzed",
    capacity: 40,
    skills: ["React", "TypeScript", "Node.js"],
  },
  {
    id: "2",
    name: "Alice Johnson",
    capacity: 35,
    skills: ["UI/UX", "React", "CSS"],
  },
  {
    id: "3",
    name: "Bob Smith",
    capacity: 40,
    skills: ["Backend", "Database", "API"],
  },
  {
    id: "4",
    name: "Carol Davis",
    capacity: 30,
    skills: ["QA", "Testing", "Automation"],
  },
  {
    id: "5",
    name: "David Lee",
    capacity: 40,
    skills: ["DevOps", "Cloud", "Docker"],
  },
];

const TASKS: Task[] = [
  {
    id: "t1",
    title: "Implement user authentication",
    status: "in-progress",
    priority: "high",
    estimatedHours: 16,
    assignee: "Anis Dzed",
    dueDate: "2025-12-10",
  },
  {
    id: "t2",
    title: "Design dashboard UI",
    status: "in-progress",
    priority: "high",
    estimatedHours: 12,
    assignee: "Alice Johnson",
    dueDate: "2025-12-08",
  },
  {
    id: "t3",
    title: "API integration",
    status: "todo",
    priority: "medium",
    estimatedHours: 8,
    assignee: "Bob Smith",
    dueDate: "2025-12-15",
  },
  {
    id: "t4",
    title: "Database optimization",
    status: "in-progress",
    priority: "high",
    estimatedHours: 20,
    assignee: "Bob Smith",
    dueDate: "2025-12-12",
  },
  {
    id: "t5",
    title: "Write unit tests",
    status: "todo",
    priority: "medium",
    estimatedHours: 10,
    assignee: "Carol Davis",
    dueDate: "2025-12-20",
  },
  {
    id: "t6",
    title: "Setup CI/CD pipeline",
    status: "in-progress",
    priority: "high",
    estimatedHours: 15,
    assignee: "David Lee",
    dueDate: "2025-12-09",
  },
  {
    id: "t7",
    title: "Mobile responsive fixes",
    status: "todo",
    priority: "low",
    estimatedHours: 6,
    assignee: "Alice Johnson",
    dueDate: "2025-12-18",
  },
  {
    id: "t8",
    title: "Security audit",
    status: "blocked",
    priority: "high",
    estimatedHours: 12,
    assignee: "David Lee",
    dueDate: "2025-12-11",
  },
  {
    id: "t9",
    title: "Performance testing",
    status: "todo",
    priority: "medium",
    estimatedHours: 8,
    assignee: "Carol Davis",
    dueDate: "2025-12-22",
  },
  {
    id: "t10",
    title: "Documentation update",
    status: "todo",
    priority: "low",
    estimatedHours: 4,
    assignee: "Anis Dzed",
    dueDate: "2025-12-25",
  },
  {
    id: "t11",
    title: "Code refactoring",
    status: "in-progress",
    priority: "medium",
    estimatedHours: 18,
    assignee: "Anis Dzed",
    dueDate: "2025-12-14",
  },
  {
    id: "t12",
    title: "User feedback analysis",
    status: "todo",
    priority: "low",
    estimatedHours: 5,
    assignee: "Alice Johnson",
    dueDate: "2025-12-28",
  },
];

export function MemberWorkload({ projectId }: MemberWorkloadProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]); // Start empty to prevent flicker
  const [members, setMembers] = useState<Member[]>([]); // Start empty to prevent flicker
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [applyTimeOff, setApplyTimeOff] = useState<boolean>(true);
  const [timeOffData, setTimeOffData] = useState<{
    holidays: { date: string; name: string; hours: number }[];
    pto: { member: string; from: string; to: string; hoursPerDay: number }[];
  } | null>(null);

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { shouldUseDatabaseData } = await import("@/lib/dataSource");

        if (shouldUseDatabaseData()) {
          // Fetch real data
          const [usersRes, tasksRes] = await Promise.all([
            fetch("/api/users").then((r) => r.json()),
            fetch("/api/tasks").then((r) => r.json()),
          ]);

          if (usersRes.success && usersRes.data) {
            const dbMembers = usersRes.data.map((u: any) => ({
              id: String(u.uid || u.id),
              name: u.name,
              avatarUrl: u.avatar_url || u.avatarUrl,
              capacity: 40,
              skills: u.role ? [u.role] : [],
            }));
            setMembers(dbMembers);
          } else {
            setMembers(MEMBERS); // Fallback only if explicitly returned success=false
          }

          if (tasksRes.success && tasksRes.data) {
            const dbTasks = tasksRes.data.map((t: any) => ({
              id: String(t.id),
              title: t.title,
              status:
                t.status === "in_progress"
                  ? "in-progress"
                  : t.status === "completed"
                    ? "done"
                    : t.status || "todo",
              priority: t.priority?.toLowerCase() || "medium",
              estimatedHours: t.estimateHours || t.estimatedHours || 0,
              assignee: t.assigneeName || t.assignee?.name || "Unassigned",
              dueDate: t.due ? t.due.split("T")[0] : undefined,
            }));
            setTasks(dbTasks);
          } else {
            setTasks(TASKS); // Fallback only if explicitly returned success=false
          }
        } else {
          // Use mock data explicitly
          setMembers(MEMBERS);
          setTasks(TASKS);

          fetch("/data/time_off.json")
            .then((res) => res.json())
            .then((json) => setTimeOffData(json))
            .catch(() => setTimeOffData(null));
        }
      } catch (err) {
        console.error("Failed to load live data", err);
        // On hard error, fallback to mock to keep app usable
        setMembers(MEMBERS);
        setTasks(TASKS);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const workloadData = useMemo(() => {
    return members.map((member) => {
      const memberTasks = tasks.filter((t) => t.assignee === member.name);
      const activeTasks = memberTasks.filter((t) => t.status !== "done");
      const blockedTasks = memberTasks.filter((t) => t.status === "blocked");

      const totalHours = activeTasks.reduce(
        (sum, t) => sum + (t.estimatedHours || 0),
        0
      );

      // Determine effective capacity based on PTO/holidays in current week
      let effectiveCapacity = member.capacity;
      if (applyTimeOff && timeOffData) {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const holidayHours = timeOffData.holidays
          .filter((h) => {
            const d = new Date(h.date);
            return d >= weekStart && d <= weekEnd;
          })
          .reduce((sum, h) => sum + h.hours, 0);

        const ptoHours = timeOffData.pto
          .filter((p) => p.member === member.name)
          .reduce((sum, p) => {
            const from = new Date(p.from);
            const to = new Date(p.to);
            let hours = 0;
            for (
              let d = new Date(weekStart);
              d <= weekEnd;
              d.setDate(d.getDate() + 1)
            ) {
              if (d >= from && d <= to) hours += p.hoursPerDay;
            }
            return sum + hours;
          }, 0);

        effectiveCapacity = Math.max(
          0,
          effectiveCapacity - holidayHours - ptoHours
        );
      }

      const utilization =
        effectiveCapacity > 0 ? (totalHours / effectiveCapacity) * 100 : 100;

      let status: "available" | "optimal" | "near-capacity" | "overloaded" =
        "available";
      if (utilization >= 100) status = "overloaded";
      else if (utilization >= 85) status = "near-capacity";
      else if (utilization >= 50) status = "optimal";

      // Priority score (high=3, medium=2, low=1)
      const priorityScore = activeTasks.reduce((sum, t) => {
        return (
          sum + (t.priority === "high" ? 3 : t.priority === "medium" ? 2 : 1)
        );
      }, 0);

      return {
        member,
        tasks: memberTasks,
        activeTasks: activeTasks.length,
        blockedTasks: blockedTasks.length,
        totalHours,
        utilization: Math.round(utilization),
        status,
        priorityScore,
        effectiveCapacity,
      };
    });
  }, [members, tasks, applyTimeOff, timeOffData]);

  const overloadedMembers = workloadData.filter(
    (w) => w.status === "overloaded"
  );
  const availableMembers = workloadData.filter((w) => w.status === "available");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overloaded":
        return "text-red-600 bg-red-500/10 border-red-500/20";
      case "near-capacity":
        return "text-amber-600 bg-amber-500/10 border-amber-500/20";
      case "optimal":
        return "text-green-600 bg-green-500/10 border-green-500/20";
      case "available":
        return "text-blue-600 bg-blue-500/10 border-blue-500/20";
      default:
        return "text-gray-600 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overloaded":
        return <AlertTriangle className="w-4 h-4" />;
      case "near-capacity":
        return <Clock className="w-4 h-4" />;
      case "optimal":
        return <CheckCircle className="w-4 h-4" />;
      case "available":
        return <Users className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetMemberName: string) => {
    if (!draggedTask) return;

    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === draggedTask.id ? { ...t, assignee: targetMemberName } : t
      )
    );
    setDraggedTask(null);
  };

  if (isLoading) {
    return (
      <Card className="p-6 h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <span className="text-sm font-medium text-muted-foreground animate-pulse">
            Analyzing team workload...
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              Team Workload Distribution
            </h3>
            <p className="text-sm text-muted-foreground">
              Task allocation and capacity analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={applyTimeOff}
              onChange={(e) => setApplyTimeOff(e.target.checked)}
            />
            Apply PTO & Holidays
          </label>
          <Badge variant="secondary">{members.length} members</Badge>
        </div>
      </div>

      {/* Alerts */}
      {overloadedMembers.length > 0 && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">Workload Alert</span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-300">
            {overloadedMembers.length} team member
            {overloadedMembers.length > 1 ? "s are" : " is"} overloaded.
            Consider redistributing tasks to available members.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">Total Tasks</div>
          <div className="text-2xl font-bold">
            {tasks.filter((t) => t.status !== "done").length}
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">Overloaded</div>
          <div className="text-2xl font-bold text-red-600">
            {overloadedMembers.length}
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">Available</div>
          <div className="text-2xl font-bold text-green-600">
            {availableMembers.length}
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="text-xs text-muted-foreground mb-1">Blocked</div>
          <div className="text-2xl font-bold text-amber-600">
            {workloadData.reduce((sum, w) => sum + w.blockedTasks, 0)}
          </div>
        </div>
      </div>

      {/* Member Cards */}
      <div className="space-y-3">
        {workloadData
          .sort((a, b) => b.utilization - a.utilization)
          .map((data) => (
            <div
              key={data.member.id}
              className={`border rounded-lg p-4 transition-all ${
                selectedMember === data.member.id ? "ring-2 ring-primary" : ""
              } ${draggedTask ? "hover:ring-2 hover:ring-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20" : "hover:shadow-md"} cursor-pointer`}
              onClick={() =>
                setSelectedMember(
                  selectedMember === data.member.id ? null : data.member.id
                )
              }
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(data.member.name)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary/20 to-purple-500/20 flex items-center justify-center font-semibold">
                    {data.member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{data.member.name}</h4>
                      <div
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(data.status)}`}
                      >
                        {getStatusIcon(data.status)}
                        {data.status.replace("-", " ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{data.activeTasks} active</span>
                      {data.blockedTasks > 0 && (
                        <span className="text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {data.blockedTasks} blocked
                        </span>
                      )}
                      <span>
                        {data.totalHours}h /{" "}
                        {data.effectiveCapacity ?? data.member.capacity}h
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold mb-1">
                    {data.utilization}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    utilization
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    data.status === "overloaded"
                      ? "bg-red-500"
                      : data.status === "near-capacity"
                        ? "bg-amber-500"
                        : data.status === "optimal"
                          ? "bg-green-500"
                          : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, data.utilization)}%` }}
                />
              </div>

              {/* Skills */}
              {data.member.skills && data.member.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {data.member.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Expanded Task List */}
              {selectedMember === data.member.id && data.tasks.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="font-medium text-sm mb-2 flex items-center gap-2">
                    <span>Assigned Tasks:</span>
                    {draggedTask && (
                      <Badge variant="info" className="text-xs">
                        Drop task here to reassign
                      </Badge>
                    )}
                  </div>
                  {data.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm hover:bg-secondary cursor-move"
                      draggable
                      onDragStart={() => handleDragStart(task)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Badge
                          variant={
                            task.status === "done"
                              ? "success"
                              : task.status === "blocked"
                                ? "warning"
                                : task.status === "in-progress"
                                  ? "info"
                                  : "secondary"
                          }
                          className="text-xs shrink-0"
                        >
                          {task.status}
                        </Badge>
                        <span className="flex-1">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "warning"
                              : task.priority === "medium"
                                ? "info"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {task.priority}
                        </Badge>
                        <span>{task.estimatedHours}h</span>
                        {task.dueDate && (
                          <span>
                            {new Date(task.dueDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      {/* Rebalancing Suggestions */}
      {overloadedMembers.length > 0 && availableMembers.length > 0 && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-3">
            <ArrowRight className="w-4 h-4" />
            <span className="font-semibold">Rebalancing Suggestions</span>
          </div>
          <div className="space-y-2 text-sm">
            {overloadedMembers.slice(0, 2).map((overloaded) => {
              const available = availableMembers[0];
              const tasksToMove = overloaded.tasks
                .filter((t) => t.status === "todo")
                .sort((a, b) => (a.priority === "low" ? -1 : 1))
                .slice(0, 2);

              return (
                tasksToMove.length > 0 && (
                  <div
                    key={overloaded.member.id}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-300"
                  >
                    <span>
                      Move {tasksToMove.length} task(s) from{" "}
                      <strong>{overloaded.member.name}</strong> →{" "}
                      <strong>{available.member.name}</strong>
                    </span>
                    <Button variant="outline" size="sm" className="ml-auto">
                      Reassign
                    </Button>
                  </div>
                )
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
