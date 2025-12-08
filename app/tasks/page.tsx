import { KanbanBoard } from "@/components/tasks/KanbanBoard";

export default function TasksPage() {
  return (
    <section className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Tasks (Kanban)</h1>
      <KanbanBoard />
    </section>
  );
}

