import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ProjectDetailsClient } from "@/components/projects/details/ProjectDetailsClient";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeftIcon } from "lucide-react";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) return notFound();

  // Parallel data fetching for performance
  const [project, allProjects] = await Promise.all([
    prisma.project.findUnique({
      where: { uid: id },
      include: {
        members: { include: { user: true } },
        tasks: { include: { assignees: true } },
        milestones: true,
        // Include other necessary relations if needed
      },
    }),
    prisma.project.findMany({
      select: { id: true, uid: true, name: true }, // Minimized for dependencies dropdown
    }),
  ]);

  if (!project) {
    return (
      <section className="flex flex-col gap-8 p-4 md:p-8">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Project not found
          </h1>
        </div>
      </section>
    );
  }

  // Fetch Finance Data (Expenses & Invoices)
  // We do this separately or included in project query?
  // Separately is fine to keep project query lighter and maybe parallelize better if independent.
  // Actually, we can include them in the Promise.all

  // Note: API used projectId (int) for expenses/invoices mostly?
  // Let's fetch using the project we just found.

  const [expenses, invoices] = await Promise.all([
    prisma.expense.findMany({
      where: { projectId: project.id },
      orderBy: { date: "desc" },
      include: { project: true }, // match what API returns if needed, or minimal
    }),
    prisma.invoice.findMany({
      where: { projectId: project.id },
      orderBy: { issueDate: "desc" },
      include: { project: true },
    }),
  ]);

  // Serialize dates if any (Prisma returns Date objects, Client Components need serializable props, usually works in Next 13+ but safe to check)
  // Next.js passes Server Component props to Client Components via serialization. Date objects are fine in recent versions if passed directly to Client Components in keys.
  // However, explicit JSON serialization ensures no warning.
  // Let's pass them as is, Next.js handles Date serializaton in SC props now (partial support, sometimes warns).
  // Safest is to map dates to strings if we encounter issues.

  // Transform to match API shape if needed (API returns strings for dates usually).
  // The components expect strings in some inputs (e.g. date inputs), but maybe Date objects for display.
  // ProjectFinance.tsx : `new Date(e.date).toLocaleDateString()` -> handles Date object or string.
  // Input value: `value={newExpense.date}` defaults to string `toISOString().slice(0,10)`.
  // So Date objects from Prisma are fine for display, but for initial state they might need handling?
  // `useState(initialExpenses)` -> `expenses`.
  // If Prisma returns Date, `e.date` is Date. `new Date(e.date)` works.

  return (
    <ProjectDetailsClient
      project={project}
      allProjects={allProjects}
      initialExpenses={JSON.parse(JSON.stringify(expenses))}
      initialInvoices={JSON.parse(JSON.stringify(invoices))}
    />
  );
}
