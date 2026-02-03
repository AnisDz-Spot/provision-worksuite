"use client";

import React from "react";
import {
  useProjects,
  ProjectsProvider,
} from "@/components/context/ProjectsContext";
import { ProjectHealthHeatmap } from "@/components/dashboard/ProjectHealthHeatmap";
import { MilestonePulse } from "@/components/dashboard/MilestonePulse";
import { GlobalActivityFeed } from "@/components/dashboard/GlobalActivityFeed";
import {
  ShieldAlert,
  BarChart3,
  Users,
  LayoutDashboard,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/components/ui/Toast";

import { PortfolioRiskAI } from "@/components/dashboard/PortfolioRiskAI";
import { GlobalResourceHeatmap } from "@/components/dashboard/GlobalResourceHeatmap";
import { FinancialRadar } from "@/components/dashboard/FinancialRadar";
import { StrategicPlanModal } from "@/components/dashboard/StrategicPlanModal";
import { PredictiveTimeline } from "@/components/dashboard/PredictiveTimeline";
import { BudgetForecast } from "@/components/dashboard/BudgetForecast";

function CommandCenterContent() {
  const { projects, isLoading } = useProjects();
  const [planModalOpen, setPlanModalOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const { showToast } = useToast();

  const exportExecutiveReport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/reports/portfolio-snapshot");
      const result = await response.json();

      if (!result.success) throw new Error("Failed to fetch report data");

      const { projects: reportProjects, summary } = result.data;
      const doc = new jsPDF();

      // Title
      doc.setFontSize(22);
      doc.setTextColor(40, 44, 52);
      doc.text("ProVision Executive Portfolio Report", 14, 22);

      // Date and Summary
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${format(new Date(), "PPpp")}`, 14, 30);

      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text("Portfolio Summary:", 14, 45);
      doc.setFontSize(10);
      doc.text(`Total Projects: ${summary.totalProjects}`, 14, 52);
      doc.text(
        `Overall Progress: ${summary.overallProgress.toFixed(1)}%`,
        14,
        58,
      );

      // Project Table
      autoTable(doc, {
        startY: 70,
        head: [
          [
            "Project Name",
            "Status",
            "Progress",
            "Budget",
            "Spent",
            "Utilization",
          ],
        ],
        body: reportProjects.map((p: any) => [
          p.name,
          p.status.toUpperCase(),
          `${p.progress}%`,
          `$${p.budget.toLocaleString()}`,
          `$${p.spent.toLocaleString()}`,
          `${p.utilization}%`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] }, // Primary color
        styles: { fontSize: 8 },
      });

      doc.save(
        `ProVision_Executive_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`,
      );
      showToast("Executive report exported successfully!", "success");
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Failed to export report.", "error");
    } finally {
      setExporting(false);
    }
  };

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
            <Link href="/projects" className="flex items-center">
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

          {/* Advanced Features Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PortfolioRiskAI />
            </div>
            <div className="xl:col-span-1">
              <PredictiveTimeline />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1">
            <GlobalResourceHeatmap />
          </div>

          {/* Third Row: Financials and Strategic Optimization */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 border-r border-border/10">
              <div className="grid grid-cols-1 gap-6">
                <FinancialRadar />
                <BudgetForecast />
              </div>
            </div>
            <div className="xl:col-span-2 bg-linear-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl p-8 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldAlert className="w-64 h-64 -mr-12 -mt-12" />
              </div>
              <h3 className="text-2xl font-black mb-2">
                Strategic Portfolio Optimization
              </h3>
              <p className="text-muted-foreground max-w-lg mb-6 leading-relaxed">
                Looking for even deeper insights? Our AI model can suggest
                resource reallocation plans and predict delivery dates based on
                current velocity.
              </p>
              <div className="flex gap-4">
                <Button
                  size="sm"
                  className="font-bold"
                  onClick={() => setPlanModalOpen(true)}
                >
                  Generate Strategic Plan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold cursor-pointer"
                  onClick={exportExecutiveReport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    "Export Executive Report"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <StrategicPlanModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
      />
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
