"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

type TimeLogsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  logs: any[];
};

export function TimeLogsModal({
  isOpen,
  onClose,
  task,
  logs,
}: TimeLogsModalProps) {
  if (!task) return null;

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()} size="md">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Time Logs for {task.title}</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No time logs for this task yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 border rounded-lg bg-accent/50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">
                      {log.hours}h
                    </span>
                    {log.loggedBy && (
                      <span className="text-xs text-muted-foreground">
                        by {log.loggedBy}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.loggedAt).toLocaleString()}
                  </span>
                </div>
                {log.note && (
                  <p className="text-sm text-muted-foreground italic">
                    {log.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
