"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Users,
  Briefcase,
  TrendingUp,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface DeptStat {
  id: string;
  name: string;
  projectCount: number;
  userCount: number;
  avgHealth: number;
  completionRate: number;
  avgMemberPerProject: number;
  statusDistribution: Record<string, number>;
}

export function DepartmentDashboard() {
  const [stats, setStats] = React.useState<DeptStat[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { showToast } = useToast();

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/analytics/departments");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch department stats:", error);
      showToast("Failed to load analytics data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-linear-to-br from-primary/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-bold text-success flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              Live
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Total Departments
          </p>
          <p className="text-3xl font-bold mt-1">{stats.length}</p>
        </Card>

        <Card className="p-6 bg-linear-to-br from-success/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-success/20">
              <Heart className="w-6 h-6 text-success" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Avg Portfolio Health
          </p>
          <p className="text-3xl font-bold mt-1">
            {stats.length > 0
              ? Math.round(
                  stats.reduce((acc, s) => acc + s.avgHealth, 0) / stats.length
                )
              : 0}
            %
          </p>
        </Card>

        <Card className="p-6 bg-linear-to-br from-info/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-info/20">
              <Users className="w-6 h-6 text-info" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Resources Across Depts
          </p>
          <p className="text-3xl font-bold mt-1">
            {stats.reduce((acc, s) => acc + s.userCount, 0)}
          </p>
        </Card>

        <Card className="p-6 bg-linear-to-br from-warning/10 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-warning/20">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Avg Completion Rate
          </p>
          <p className="text-3xl font-bold mt-1">
            {stats.length > 0
              ? Math.round(
                  stats.reduce((acc, s) => acc + s.completionRate, 0) /
                    stats.length
                )
              : 0}
            %
          </p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Comparison */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6">
            Department Health Comparison
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Bar
                  dataKey="avgHealth"
                  name="Health Score"
                  radius={[4, 4, 0, 0]}
                >
                  {stats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.avgHealth > 80
                          ? "#10b981"
                          : entry.avgHealth > 60
                            ? "#f59e0b"
                            : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Project Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-6">
            Resource Intensity per Dept
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                />
                <Bar
                  dataKey="avgMemberPerProject"
                  name="Avg Members/Project"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Multi-Dept Table View */}
      <Card className="overflow-hidden border-none shadow-xl">
        <div className="p-6 border-b border-border bg-card/50">
          <h3 className="text-lg font-bold">Department Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-accent/50 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Projects</th>
                <th className="px-6 py-4">Health</th>
                <th className="px-6 py-4">Completion</th>
                <th className="px-6 py-4">Active Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.map((dept) => (
                <tr
                  key={dept.id}
                  className="hover:bg-accent/30 transition-colors"
                >
                  <td className="px-6 py-4 font-semibold">{dept.name}</td>
                  <td className="px-6 py-4">{dept.projectCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 w-20 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${dept.avgHealth}%`,
                            backgroundColor:
                              dept.avgHealth > 80
                                ? "#10b981"
                                : dept.avgHealth > 60
                                  ? "#f59e0b"
                                  : "#ef4444",
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold">
                        {dept.avgHealth}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-success">
                    {dept.completionRate}%
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold uppercase">
                      {(
                        ((dept.statusDistribution.active || 0) /
                          dept.projectCount) *
                          100 || 0
                      ).toFixed(0)}
                      % Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
