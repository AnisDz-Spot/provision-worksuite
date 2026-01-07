import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Mail,
  Settings,
  Eye,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Send,
  Download,
} from "lucide-react";
import { DigestData, DigestSchedule } from "./types";

interface DigestCardContentProps {
  schedule: DigestSchedule;
  digestData: DigestData;
  sendingEmail: boolean;
  setShowSettings: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  setSchedule: (schedule: DigestSchedule) => void;
  sendDigest: () => void;
  exportAsHTML: () => void;
  exportSlackJSON: () => void;
  exportTeamsJSON: () => void;
  postToSlack: () => void;
  postToTeams: () => void;
  removeRecipient: (email: string) => void;
}

export const DigestCardContent: React.FC<DigestCardContentProps> = ({
  schedule,
  digestData,
  sendingEmail,
  setShowSettings,
  setShowPreview,
  setSchedule,
  sendDigest,
  exportAsHTML,
  exportSlackJSON,
  exportTeamsJSON,
  postToSlack,
  postToTeams,
  removeRecipient,
}) => {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Weekly Digest Email</h3>
            <p className="text-sm text-muted-foreground">
              Automated project summaries for stakeholders
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
            className="flex-1 sm:flex-none"
          >
            <Settings className="w-4 h-4 mr-1" />
            Configure
          </Button>
          <Button
            onClick={() => setShowPreview(true)}
            className="flex-1 sm:flex-none"
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Schedule Status */}
      <div
        className={`p-4 rounded-lg border mb-6 ${schedule.enabled ? "bg-green-500/10 border-green-500/20" : "bg-gray-500/10 border-gray-500/20"}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${schedule.enabled ? "bg-green-500" : "bg-gray-400"}`}
            />
            <div>
              <div className="font-semibold">
                {schedule.enabled ? "Scheduled" : "Not Scheduled"}
              </div>
              {schedule.enabled && (
                <div className="text-sm text-muted-foreground">
                  Every{" "}
                  {
                    [
                      "Sunday",
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                    ][schedule.dayOfWeek]
                  }{" "}
                  at {schedule.time}
                </div>
              )}
            </div>
          </div>
          <Button
            variant={schedule.enabled ? "outline" : "primary"}
            size="sm"
            onClick={() =>
              setSchedule({ ...schedule, enabled: !schedule.enabled })
            }
          >
            {schedule.enabled ? "Disable" : "Enable"} Schedule
          </Button>
        </div>
      </div>

      {/* Quick Stats Preview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {digestData.summary.tasksCompleted}
            </div>
            <span className="text-xs text-green-600 font-medium">
              +
              {digestData.summary.tasksCompleted -
                digestData.lastWeekSummary.tasksCompleted}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            vs {digestData.lastWeekSummary.tasksCompleted} last week
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-muted-foreground">Blockers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-red-600">
              {digestData.summary.tasksBlocked}
            </div>
            <span
              className={`text-xs font-medium ${
                digestData.summary.tasksBlocked >
                digestData.lastWeekSummary.tasksBlocked
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {digestData.summary.tasksBlocked >
              digestData.lastWeekSummary.tasksBlocked
                ? "+"
                : ""}
              {digestData.summary.tasksBlocked -
                digestData.lastWeekSummary.tasksBlocked}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            vs {digestData.lastWeekSummary.tasksBlocked} last week
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-muted-foreground">Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {digestData.summary.progressPercent}%
            </div>
            <span className="text-xs text-green-600 font-medium">
              +
              {digestData.summary.progressPercent -
                digestData.lastWeekSummary.progressPercent}
              %
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            vs {digestData.lastWeekSummary.progressPercent}% last week
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-muted-foreground">Team Use</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              {digestData.summary.teamUtilization}%
            </div>
            <span className="text-xs text-green-600 font-medium">
              +
              {digestData.summary.teamUtilization -
                digestData.lastWeekSummary.teamUtilization}
              %
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            vs {digestData.lastWeekSummary.teamUtilization}% last week
          </div>
        </div>
      </div>

      {/* Recipients */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">
          Recipients ({schedule.recipients.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {schedule.recipients.map((email) => (
            <Badge key={email} variant="secondary" className="pl-2 pr-1">
              {email}
              <button
                className="ml-2 hover:text-red-600"
                onClick={() => removeRecipient(email)}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={sendDigest} disabled={sendingEmail}>
          <Send className="w-4 h-4 mr-1" />
          {sendingEmail ? "Sending..." : "Send Now"}
        </Button>
        <Button variant="outline" onClick={exportAsHTML}>
          <Download className="w-4 h-4 mr-1" />
          Export HTML
        </Button>
        <Button
          variant="outline"
          onClick={exportSlackJSON}
          title="Export Slack message (Blocks JSON)"
        >
          <Download className="w-4 h-4 mr-1" />
          Export Slack
        </Button>
        <Button
          variant="outline"
          onClick={exportTeamsJSON}
          title="Export Teams Adaptive Card JSON"
        >
          <Download className="w-4 h-4 mr-1" />
          Export Teams
        </Button>
        <Button onClick={postToSlack} title="Post to Slack via webhook">
          <Send className="w-4 h-4 mr-1" />
          Post to Slack
        </Button>
        <Button onClick={postToTeams} title="Post to Teams via webhook">
          <Send className="w-4 h-4 mr-1" />
          Post to Teams
        </Button>
      </div>
    </>
  );
};
