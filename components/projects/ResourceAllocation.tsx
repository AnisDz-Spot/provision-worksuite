"use client";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Users, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  capacity: number; // hours per week
  projects: { projectId: string; projectName: string; allocated: number }[];
};

type ResourceAllocationProps = {
  members?: TeamMember[];
};

// Mock team data
const defaultMembers: TeamMember[] = [
  {
    id: "u1",
    name: "Alice",
    role: "Project Manager",
    capacity: 40,
    projects: [
      { projectId: "p1", projectName: "Project Alpha", allocated: 20 },
      { projectId: "p2", projectName: "Project Beta", allocated: 15 },
    ],
  },
];

export function ResourceAllocation({
  members = defaultMembers,
}: ResourceAllocationProps) {
  const [filter, setFilter] = useState<"all" | "overallocated" | "available">(
    "all"
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    members && members.length > 0 ? members : defaultMembers
  );

  useMemo(() => {
    async function loadData() {
      const { shouldUseMockData } = await import("@/lib/dataSource");
      if (shouldUseMockData() && members && members.length > 0) return; // Use props if mock mode or provided

      // In real mode, load users and tasks
      const { loadUsers, loadTasks, loadProjects } = await import("@/lib/data");
      try {
        const [users, tasks, projects] = await Promise.all([
          loadUsers(),
          loadTasks(),
          loadProjects(),
        ]);

        // Calculate allocation based on tasks
        // Simplified logic: Each active task = 5 hours/week allocation (placeholder logic)
        const newMembers: TeamMember[] = users.map((u) => {
          const userTasks = tasks.filter(
            (t) =>
              (t.assignee === u.name || t.assignee === u.uid) &&
              t.status !== "Done" &&
              t.status !== "Completed"
          );

          // Group by project
          const projectAllocations: Record<string, number> = {};
          userTasks.forEach((t) => {
            const pid = t.projectId || "unknown";
            projectAllocations[pid] = (projectAllocations[pid] || 0) + 5;
          });

          const allocationList = Object.entries(projectAllocations).map(
            ([pid, hours]) => {
              const proj = projects.find((p) => p.id === pid);
              return {
                projectId: pid,
                projectName: proj ? proj.name : "Unknown Project",
                allocated: hours,
              };
            }
          );

          return {
            id: u.uid,
            name: u.name,
            role: u.role || "Team Member",
            capacity: 40, // Default capacity
            projects: allocationList,
          };
        });

        if (newMembers.length > 0) {
          setTeamMembers(newMembers);
        }
      } catch (e) {
        console.error("Failed to load resource data", e);
      }
    }
    loadData();
  }, [members]);

  const memberStats = useMemo(() => {
    return teamMembers.map((member) => {
      const totalAllocated = member.projects.reduce(
        (sum, p) => sum + p.allocated,
        0
      );
      const utilization = (totalAllocated / member.capacity) * 100;
      const available = member.capacity - totalAllocated;

      let status: "available" | "optimal" | "full" | "overallocated" =
        "available";
      if (utilization > 100) status = "overallocated";
      else if (utilization > 90) status = "full";
      else if (utilization > 70) status = "optimal";

      return {
        ...member,
        totalAllocated,
        utilization,
        available,
        status,
      };
    });
  }, [members]);

  const filteredMembers = useMemo(() => {
    switch (filter) {
      case "overallocated":
        return memberStats.filter((m) => m.status === "overallocated");
      case "available":
        return memberStats.filter((m) => m.available > 0);
      default:
        return memberStats;
    }
  }, [memberStats, filter]);

  const teamStats = useMemo(() => {
    const totalCapacity = memberStats.reduce((sum, m) => sum + m.capacity, 0);
    const totalAllocated = memberStats.reduce(
      (sum, m) => sum + m.totalAllocated,
      0
    );
    const overallocated = memberStats.filter(
      (m) => m.status === "overallocated"
    ).length;
    const available = memberStats.filter((m) => m.available > 0).length;

    return {
      totalCapacity,
      totalAllocated,
      totalAvailable: totalCapacity - totalAllocated,
      avgUtilization: Math.round((totalAllocated / totalCapacity) * 100),
      overallocated,
      available,
    };
  }, [memberStats]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-blue-500";
      case "optimal":
        return "bg-green-500";
      case "full":
        return "bg-amber-500";
      case "overallocated":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "optimal":
        return "Optimal";
      case "full":
        return "At Capacity";
      case "overallocated":
        return "Overallocated";
      default:
        return "Unknown";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Resource Allocation</h2>
            <p className="text-sm text-muted-foreground">
              Team capacity planning and utilization
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-accent hover:bg-accent/80"
            }`}
          >
            All ({memberStats.length})
          </button>
          <button
            onClick={() => setFilter("overallocated")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === "overallocated"
                ? "bg-red-500 text-white"
                : "bg-accent hover:bg-accent/80"
            }`}
          >
            Over ({teamStats.overallocated})
          </button>
          <button
            onClick={() => setFilter("available")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              filter === "available"
                ? "bg-blue-500 text-white"
                : "bg-accent hover:bg-accent/80"
            }`}
          >
            Available ({teamStats.available})
          </button>
        </div>
      </div>

      {/* Team overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-accent/50 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">
            Total Capacity
          </div>
          <div className="text-2xl font-bold">{teamStats.totalCapacity}h</div>
          <div className="text-xs text-muted-foreground mt-1">per week</div>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Allocated</div>
          <div className="text-2xl font-bold text-blue-600">
            {teamStats.totalAllocated}h
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {teamStats.avgUtilization}% utilized
          </div>
        </div>
        <div className="bg-green-500/10 rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Available</div>
          <div className="text-2xl font-bold text-green-600">
            {teamStats.totalAvailable}h
          </div>
          <div className="text-xs text-green-600 mt-1">Can be assigned</div>
        </div>
        <div
          className={`rounded-lg p-4 ${teamStats.overallocated > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}
        >
          <div className="text-xs text-muted-foreground mb-1">
            Overallocated
          </div>
          <div
            className={`text-2xl font-bold ${teamStats.overallocated > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {teamStats.overallocated}
          </div>
          <div
            className={`text-xs mt-1 ${teamStats.overallocated > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {teamStats.overallocated > 0 ? "Need rebalancing" : "All balanced"}
          </div>
        </div>
      </div>

      {/* Member allocation details */}
      <div className="space-y-4">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No team members match the filter</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                    member.status === "overallocated"
                      ? "bg-red-500/10 text-red-600 border border-red-500/20"
                      : member.status === "full"
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : member.status === "optimal"
                          ? "bg-green-500/10 text-green-600 border border-green-500/20"
                          : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                  }`}
                >
                  {member.status === "overallocated" && (
                    <AlertTriangle className="w-3 h-3" />
                  )}
                  {getStatusText(member.status)}
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">
                    {member.totalAllocated}h / {member.capacity}h
                    <span className="text-muted-foreground ml-2">
                      ({Math.round(member.utilization)}%)
                    </span>
                  </span>
                </div>
                <div className="h-3 bg-accent rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${getStatusColor(member.status)}`}
                    style={{ width: `${Math.min(100, member.utilization)}%` }}
                  />
                </div>
                {member.available > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {member.available}h available for new assignments
                  </p>
                )}
                {member.status === "overallocated" && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Overallocated by{" "}
                    {member.totalAllocated - member.capacity}h - needs
                    rebalancing
                  </p>
                )}
              </div>

              {/* Project allocations */}
              {member.projects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Project Allocations:
                  </p>
                  {member.projects.map((project) => (
                    <div
                      key={project.projectId}
                      className="flex items-center justify-between py-2 px-3 bg-accent/30 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{project.projectName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {project.allocated}h
                        </span>
                        <div className="w-16 h-1.5 bg-accent rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${(project.allocated / member.capacity) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {Math.round(
                            (project.allocated / member.capacity) * 100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Recommendations */}
      {teamStats.overallocated > 0 && (
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Resource Rebalancing Needed
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {teamStats.overallocated} team member
                {teamStats.overallocated > 1 ? "s are" : " is"} overallocated.
                Consider redistributing tasks or extending deadlines to prevent
                burnout.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
