"use client";
import * as React from "react";
import { Play, Pause, StopCircle, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { addTimeLog, getTasksByProject } from "@/lib/utils";

type ActiveTimer = {
  taskId: string;
  taskTitle: string;
  projectId: string;
  assignee?: string;
  startTime: number;
  pausedTime?: number;
  isPaused: boolean;
};

export function TimeTrackingWidget() {
  const [activeTimer, setActiveTimer] = React.useState<ActiveTimer | null>(
    null
  );
  const [elapsed, setElapsed] = React.useState(0);
  const [note, setNote] = React.useState("");
  const [isMinimized, setIsMinimized] = React.useState(false);

  // Load timer from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pv:activeTimer");
      if (saved) {
        const timer = JSON.parse(saved) as ActiveTimer;
        setActiveTimer(timer);
        if (!timer.isPaused) {
          const now = Date.now();
          setElapsed(Math.floor((now - timer.startTime) / 1000));
        } else if (timer.pausedTime) {
          setElapsed(Math.floor((timer.pausedTime - timer.startTime) / 1000));
        }
      }
    }
  }, []);

  // Update elapsed time every second
  React.useEffect(() => {
    if (!activeTimer || activeTimer.isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed(Math.floor((now - activeTimer.startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  // Save timer to localStorage whenever it changes
  React.useEffect(() => {
    if (activeTimer && typeof window !== "undefined") {
      localStorage.setItem("pv:activeTimer", JSON.stringify(activeTimer));
    }
  }, [activeTimer]);

  function startTimer(taskId: string, taskTitle: string, projectId: string) {
    const timer: ActiveTimer = {
      taskId,
      taskTitle,
      projectId,
      startTime: Date.now(),
      isPaused: false,
    };
    setActiveTimer(timer);
    setElapsed(0);
    setNote("");
  }

  function pauseTimer() {
    if (!activeTimer) return;
    setActiveTimer({
      ...activeTimer,
      pausedTime: Date.now(),
      isPaused: true,
    });
  }

  function resumeTimer() {
    if (!activeTimer || !activeTimer.pausedTime) return;
    const pausedDuration = Date.now() - activeTimer.pausedTime;
    setActiveTimer({
      ...activeTimer,
      startTime: activeTimer.startTime + pausedDuration,
      pausedTime: undefined,
      isPaused: false,
    });
  }

  function stopTimer() {
    if (!activeTimer) return;

    const hours = parseFloat((elapsed / 3600).toFixed(2));
    if (hours > 0) {
      addTimeLog(
        activeTimer.taskId,
        activeTimer.projectId,
        hours,
        note || undefined,
        activeTimer.assignee
      );
    }

    setActiveTimer(null);
    setElapsed(0);
    setNote("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("pv:activeTimer");
    }
  }

  function cancelTimer() {
    setActiveTimer(null);
    setElapsed(0);
    setNote("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("pv:activeTimer");
    }
  }

  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  if (!activeTimer) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Clock className="w-4 h-4" />
          <span className="font-mono font-bold">{formatTime(elapsed)}</span>
          {activeTimer.isPaused && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-card border border-border rounded-lg shadow-xl">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Time Tracker</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded hover:bg-accent transition-colors"
              title="Minimize"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <button
              onClick={cancelTimer}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Info */}
        <div className="p-3 rounded-lg bg-accent/20">
          <div className="text-xs text-muted-foreground mb-1">
            Tracking time for:
          </div>
          <div className="font-medium text-sm truncate">
            {activeTimer.taskTitle}
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold text-foreground">
            {formatTime(elapsed)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {(elapsed / 3600).toFixed(2)} hours
          </div>
        </div>

        {/* Note Input */}
        <div>
          <label className="block text-xs font-medium mb-1">
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about this time entry..."
            className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2 text-sm min-h-16 resize-none"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {activeTimer.isPaused ? (
            <Button variant="primary" className="flex-1" onClick={resumeTimer}>
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" onClick={pauseTimer}>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          <Button variant="primary" className="flex-1" onClick={stopTimer}>
            <StopCircle className="w-4 h-4 mr-2" />
            Stop & Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// Provider to manage timer state globally
type TimeTrackerContextType = {
  startTimer: (
    taskId: string,
    taskTitle: string,
    projectId: string,
    assignee?: string
  ) => void;
  hasActiveTimer: boolean;
};

const TimeTrackerContext = React.createContext<TimeTrackerContextType | null>(
  null
);

export function TimeTrackerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasTimer, setHasTimer] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pv:activeTimer");
      setHasTimer(!!saved);
    }
  }, []);

  function startTimer(
    taskId: string,
    taskTitle: string,
    projectId: string,
    assignee?: string
  ) {
    const timer = {
      taskId,
      taskTitle,
      projectId,
      assignee,
      startTime: Date.now(),
      isPaused: false,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("pv:activeTimer", JSON.stringify(timer));
    }
    setHasTimer(true);
    window.location.reload(); // Simple way to refresh widget
  }

  return (
    <TimeTrackerContext.Provider
      value={{ startTimer, hasActiveTimer: hasTimer }}
    >
      {children}
      <TimeTrackingWidget />
    </TimeTrackerContext.Provider>
  );
}

export function useTimeTracker() {
  const context = React.useContext(TimeTrackerContext);
  if (!context) {
    throw new Error("useTimeTracker must be used within TimeTrackerProvider");
  }
  return context;
}
