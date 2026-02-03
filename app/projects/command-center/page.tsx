"use client";

import React from "react";
import {
  useProjects,
  ProjectsProvider,
} from "@/components/context/ProjectsContext";
import { ProjectHealthHeatmap } from "@/components/dashboard/ProjectHealthHeatmap";
import { MilestonePulse } from "@/components/dashboard/MilestonePulse";
import { GlobalActivityFeed } from "@/components/dashboard/GlobalActivityFeed";
import { ShieldAlert, BarChart3, Users, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";

import { PortfolioRiskAI } from "@/components/dashboard/PortfolioRiskAI";
import { GlobalResourceHeatmap } from "@/components/dashboard/GlobalResourceHeatmap";
import { FinancialRadar } from "@/components/dashboard/FinancialRadar";

function CommandCenterContent() {
  const { projects, isLoading } = useProjects();

  return (
    <section className="p-4 md:p-8 flex flex-col gap-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Portfolio Command Center
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              High-level strategic monitoring across all organizational projects
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="cursor-pointer"
          >
            <Link href="/projects">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Project List
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Top Row: Situation Awareness */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ProjectHealthHeatmap projects={projects} />
            </div>
            <div className="lg:col-span-1">
              <MilestonePulse />
            </div>
            <div className="lg:col-span-1">
              <GlobalActivityFeed />
            </div>
          </div>

          {/* Placeholders for new strong features */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="h-80 bg-card/50 border-2 border-dashed border-primary/20 rounded-xl flex flex-center items-center justify-center flex-col gap-2">
              <BarChart3 className="w-8 h-8 text-primary/40" />
              <p className="font-semibold text-muted-foreground">
                Portfolio Risk Analysis (AI)
              </p>
            </div>
            <div className="h-80 bg-card/50 border-2 border-dashed border-primary/20 rounded-xl flex flex-center items-center justify-center flex-col gap-2">
              <Users className="w-8 h-8 text-primary/40" />
              <p className="font-semibold text-muted-foreground">
                Global Resource Heatmap
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default function CommandCenterPage() {
  return (
    <ProjectsProvider>
      <CommandCenterContent />
    </ProjectsProvider>
  );
}
