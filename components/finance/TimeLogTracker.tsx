"use client";

import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/finance/SectionHeader";
import { Clock, Plus, Download, Upload } from "lucide-react";

type Project = { id: string; name: string; hourlyRate?: number };
type TimeLog = { id: string; projectId: string; date: string; hours: number };

interface TimeLogTrackerProps {
  projects: Project[];
  timeLogs: TimeLog[];
  setTimeLogs: (logs: TimeLog[]) => void;
  currency: (n: number) => string;
  onExport: () => void;
  onExportCSV: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pushToast: (msg: string, type?: "info" | "warning" | "error") => void;
}

export function TimeLogTracker({
  projects,
  timeLogs,
  setTimeLogs,
  currency,
  onExport,
  onExportCSV,
  onImport,
  pushToast,
}: TimeLogTrackerProps) {
  const [timeFilter, setTimeFilter] = useState({
    projectId: "",
    from: "",
    to: "",
  });

  const [newTimeLog, setNewTimeLog] = useState({
    projectId: "",
    date: new Date().toISOString().slice(0, 10),
    hours: "",
  });

  const filtered = useMemo(() => {
    return timeLogs.filter((t) => {
      if (timeFilter.projectId && t.projectId !== timeFilter.projectId)
        return false;
      if (timeFilter.from && t.date < timeFilter.from) return false;
      if (timeFilter.to && t.date > timeFilter.to) return false;
      return true;
    });
  }, [timeLogs, timeFilter]);

  const handleAddLog = () => {
    if (!newTimeLog.projectId || !newTimeLog.hours) return;
    setTimeLogs([
      {
        id: `tl-${Date.now()}`,
        projectId: newTimeLog.projectId,
        date: newTimeLog.date,
        hours: parseFloat(newTimeLog.hours),
      },
      ...timeLogs,
    ]);
    setNewTimeLog({
      projectId: "",
      date: newTimeLog.date,
      hours: "",
    });
    pushToast("Time log added successfully", "info");
  };

  return (
    <Card className="p-6">
      <SectionHeader
        icon={
          <div className="p-3 rounded-lg bg-blue-500/10">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
        }
        title="Time-based Billing"
        subtitle="Track billable hours and calculate labor costs"
        right={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={onExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                document.getElementById("import-timelogs")?.click()
              }
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <input
              id="import-timelogs"
              type="file"
              accept=".json"
              className="hidden"
              onChange={onImport}
            />
          </div>
        }
      />

      <Card className="p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-3">
          <select
            className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm"
            value={timeFilter.projectId}
            onChange={(e) =>
              setTimeFilter({ ...timeFilter, projectId: e.target.value })
            }
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={timeFilter.from}
            onChange={(e) =>
              setTimeFilter({ ...timeFilter, from: e.target.value })
            }
          />
          <Input
            type="date"
            value={timeFilter.to}
            onChange={(e) =>
              setTimeFilter({ ...timeFilter, to: e.target.value })
            }
          />
          <Button
            variant="outline"
            onClick={() => setTimeFilter({ projectId: "", from: "", to: "" })}
          >
            Reset
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5 bg-linear-to-br from-blue-500/5 to-purple-500/5 border-2">
          <div className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Log Hours
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <select
              className="px-3 py-2.5 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary"
              value={newTimeLog.projectId}
              onChange={(e) =>
                setNewTimeLog({ ...newTimeLog, projectId: e.target.value })
              }
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Input
              type="date"
              value={newTimeLog.date}
              onChange={(e) =>
                setNewTimeLog({ ...newTimeLog, date: e.target.value })
              }
            />
            <Input
              type="number"
              placeholder="Hours"
              value={newTimeLog.hours}
              onChange={(e) =>
                setNewTimeLog({ ...newTimeLog, hours: e.target.value })
              }
            />
            <Button onClick={handleAddLog} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </Card>

        <Card className="p-5 border-2">
          <div className="font-semibold mb-4">Cost Summary</div>
          <div className="space-y-3">
            {projects.map((p) => {
              const hours = filtered
                .filter((tl) => tl.projectId === p.id)
                .reduce((s, tl) => s + tl.hours, 0);
              const cost = hours * (p.hourlyRate || 0);
              return (
                <div key={p.id} className="pb-3 border-b last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{p.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {hours.toFixed(2)}h
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      @ {currency(p.hourlyRate || 0)}/hr
                    </span>
                    <span className="font-semibold">{currency(cost)}</span>
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">
                  {currency(
                    filtered.reduce((sum, t) => {
                      const proj = projects.find((p) => p.id === t.projectId);
                      return sum + t.hours * (proj?.hourlyRate || 0);
                    }, 0),
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  );
}
