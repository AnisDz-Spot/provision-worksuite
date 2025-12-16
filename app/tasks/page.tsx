"use client";

import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { RecurringTaskManager } from "@/components/tasks/RecurringTaskManager";
import { useState } from "react";

export default function TasksPage() {
  const [selectedProjectId] = useState<string>("");

  return (
    <section className="p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">Tasks (Kanban)</h1>

      {/* Recurring Tasks Section */}
      <RecurringTaskManager
        projectId={selectedProjectId || "default-project"}
      />

      <KanbanBoard />
    </section>
  );
}


