import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle } from "lucide-react";
import { DigestData } from "./types";

interface DigestPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  digestData: DigestData | null;
}

export const DigestPreviewModal: React.FC<DigestPreviewModalProps> = ({
  open,
  onOpenChange,
  digestData,
}) => {
  if (!digestData) return null;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <h3 className="text-lg font-semibold mb-4">Digest Preview</h3>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="border-b pb-4">
          <h3 className="text-xl font-bold">📊 Weekly Project Digest</h3>
          <p className="text-sm text-muted-foreground">
            {digestData.weekRange}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-accent rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">
              Tasks Completed
            </div>
            <div className="text-2xl font-bold">
              {digestData.summary.tasksCompleted}
            </div>
          </div>
          <div className="p-3 bg-accent rounded-lg">
            <div className="text-xs text-muted-foreground mb-1">Progress</div>
            <div className="text-2xl font-bold">
              {digestData.summary.progressPercent}%
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3">🚀 Project Status</h4>
          {digestData.projects.map((p) => (
            <div key={p.id} className="border rounded-lg p-3 mb-2">
              <div className="flex justify-between items-start mb-2">
                <strong>{p.name}</strong>
                <Badge variant={p.risk === "low" ? "success" : "warning"}>
                  {p.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                ✅ {p.tasksCompleted} tasks • 📅 Due {p.upcomingDeadline}
              </div>
              <div className="h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-semibold mb-3">🎉 Achievements</h4>
          {digestData.achievements.map((a, i) => (
            <div key={i} className="flex items-start gap-2 mb-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{a}</span>
            </div>
          ))}
        </div>

        <div>
          <h4 className="font-semibold mb-3">⚠️ Active Blockers</h4>
          {digestData.blockers.map((b, i) => (
            <div
              key={i}
              className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-2"
            >
              <div className="font-medium">{b.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Project: {b.project} • Severity: {b.severity.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full">
          Close Preview
        </Button>
      </div>
    </Modal>
  );
};
