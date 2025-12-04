"use client";
import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getTasksByAssignee, getProjectTimeRollup } from "@/lib/utils";
import { loadUsers, loadProjects as fetchProjects } from "@/lib/data";

type Member = {
  id: string;
  name: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  location?: string;
  joinDate?: string;
  bio?: string;
  skills?: string[];
  status?: "active" | "away" | "busy" | "offline";
};

type Project = {
  id: string;
  name: string;
  status: "Active" | "Completed" | "Paused" | "In Progress";
  deadline: string;
  members?: { name: string; avatarUrl?: string }[];
};

async function loadMember(id: string): Promise<Member | null> {
  try {
    const users = await loadUsers();
    const found = users.find(
      (u) => u.uid === id || u.name.toLowerCase().replace(/\s+/g, "-") === id
    );
    if (found) {
      return {
        id: found.uid,
        name: found.name,
        avatarUrl: found.avatar_url,
        email: found.email,
        role: found.role,
        department: found.department,
        status: found.status as
          | "active"
          | "away"
          | "busy"
          | "offline"
          | undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function loadAllProjects(): Promise<Project[]> {
  try {
    const projects = await fetchProjects();
    return Array.isArray(projects) ? projects : [];
  } catch {
    return [];
  }
}

export default function MemberDetailPage() {
  const params = useParams();
  const memberId = params.id as string;
  const [member, setMember] = React.useState<Member | null>(null);
  const [allProjects, setAllProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      if (typeof window !== "undefined") {
        const [memberData, projectsData] = await Promise.all([
          loadMember(memberId),
          loadAllProjects(),
        ]);
        setMember(memberData);
        setAllProjects(projectsData);
        setIsLoading(false);
      }
    }
    loadData();
  }, [memberId]);

  if (isLoading) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/team">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Team
          </Button>
        </Link>
        <div className="flex items-center justify-center py-20">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-muted-foreground border-t-transparent"
            aria-label="Loading"
          />
        </div>
      </section>
    );
  }

  if (!member) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/team">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Team
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Member not found
          </h1>
        </div>
      </section>
    );
  }

  // Get member's projects
  const memberProjects = allProjects.filter((p) =>
    p.members?.some((m) => m.name === member.name)
  );

  // Get member's tasks
  const memberTasks = getTasksByAssignee(member.name);
  const taskStats = {
    total: memberTasks.length,
    todo: memberTasks.filter((t) => t.status === "todo").length,
    inProgress: memberTasks.filter((t) => t.status === "in-progress").length,
    done: memberTasks.filter((t) => t.status === "done").length,
  };

  // Calculate total time logged across all projects
  const totalTimeLogged = memberProjects.reduce((sum, p) => {
    const rollup = getProjectTimeRollup(p.id);
    return sum + rollup.logged;
  }, 0);

  const statusColors = {
    active: "bg-green-100 text-green-700",
    away: "bg-amber-100 text-amber-700",
    busy: "bg-red-100 text-red-700",
    offline: "bg-muted text-muted-foreground",
  };

  return (
    <section className="flex flex-col gap-8 p-4 md:p-8">
      <Link href="/team">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Team
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  member.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`
                }
                alt={member.name}
                className="w-32 h-32 rounded-full border-4 border-primary/20"
              />
              <div className="w-full">
                <h1 className="text-2xl font-bold text-foreground">
                  {member.name}
                </h1>
                {member.role && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {member.role}
                  </p>
                )}
                {member.status && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge className={statusColors[member.status]} pill>
                      <div className="w-2 h-2 rounded-full bg-current mr-1" />
                      {member.status.charAt(0).toUpperCase() +
                        member.status.slice(1)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {member.bio && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            )}
          </Card>

          {/* Contact Info */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-4">Contact Information</h3>
            <div className="space-y-3">
              {member.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`mailto:${member.email}`}
                    className="text-foreground hover:underline"
                  >
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`tel:${member.phone}`}
                    className="text-foreground hover:underline"
                  >
                    {member.phone}
                  </a>
                </div>
              )}
              {member.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{member.location}</span>
                </div>
              )}
              {member.department && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{member.department}</span>
                </div>
              )}
              {member.joinDate && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">
                    Joined {member.joinDate}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Skills */}
          {member.skills && member.skills.length > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-4">Skills & Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Activity & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Projects
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {memberProjects.length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Tasks
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {taskStats.total}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Completed
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {taskStats.done}
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Hours Logged
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {totalTimeLogged.toFixed(1)}
              </div>
            </Card>
          </div>

          {/* Task Distribution */}
          {taskStats.total > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-4">Task Distribution</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">To Do</span>
                    <span className="font-medium">{taskStats.todo} tasks</span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(taskStats.todo / taskStats.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">In Progress</span>
                    <span className="font-medium">
                      {taskStats.inProgress} tasks
                    </span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${(taskStats.inProgress / taskStats.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Done</span>
                    <span className="font-medium">{taskStats.done} tasks</span>
                  </div>
                  <div className="h-2 bg-accent rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(taskStats.done / taskStats.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Projects */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold mb-4">
              Active Projects ({memberProjects.length})
            </h3>
            {memberProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No projects assigned yet.
              </p>
            ) : (
              <div className="space-y-3">
                {memberProjects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="p-4 border border-border rounded-lg hover:bg-accent/10 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">
                          {project.name}
                        </h4>
                        <Badge
                          variant={
                            project.status === "Active"
                              ? "info"
                              : project.status === "Completed"
                                ? "success"
                                : "warning"
                          }
                          pill
                        >
                          {project.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Due: {project.deadline}</span>
                        {project.members && (
                          <span>
                            {project.members.length} team member
                            {project.members.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Tasks */}
          {memberTasks.length > 0 && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-4">Recent Tasks</h3>
              <div className="space-y-2">
                {memberTasks.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {task.title}
                      </span>
                      <Badge
                        variant={
                          task.status === "done"
                            ? "success"
                            : task.status === "in-progress"
                              ? "info"
                              : "secondary"
                        }
                        pill
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {task.priority && (
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "warning"
                              : task.priority === "medium"
                                ? "info"
                                : "secondary"
                          }
                        >
                          {task.priority}
                        </Badge>
                      )}
                      {task.due && <span>Due: {task.due}</span>}
                      {task.estimateHours && (
                        <span>Est: {task.estimateHours}h</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
