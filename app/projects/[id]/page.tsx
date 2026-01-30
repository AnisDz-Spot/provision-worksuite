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

  // Try finding by Slug first, then UID, then ID (Int)
  let project = await prisma.project.findFirst({
    where: { slug: id },
    include: {
      members: { include: { user: true } },
      tasks: { include: { assignee: true } },
      milestones: true,
      department: true,
      client: true,
    },
  });

  if (!project) {
    project = await prisma.project.findFirst({
      where: { uid: id },
      include: {
        members: { include: { user: true } },
        tasks: { include: { assignee: true } },
        milestones: true,
        department: true,
        client: true,
      },
    });
  }

  if (!project) {
    const idAsInt = parseInt(id);
    if (!isNaN(idAsInt)) {
      project = await prisma.project.findUnique({
        where: { id: idAsInt },
        include: {
          members: { include: { user: true } },
          tasks: { include: { assignee: true } },
          milestones: true,
          department: true,
          client: true,
        },
      });
    }
  }

  const allProjects = await prisma.project.findMany({
    select: { id: true, uid: true, name: true, slug: true },
  });

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

  const [expenses, invoices] = await Promise.all([
    prisma.expense.findMany({
      where: { projectId: project.id },
      orderBy: { date: "desc" },
      include: { project: true },
    }),
    prisma.invoice.findMany({
      where: { projectId: project.id },
      orderBy: { issueDate: "desc" },
      include: { project: true },
    }),
  ]);

  // Explicit serialization to avoid Date object issues and ensure field consistency
  const serializedProject = JSON.parse(JSON.stringify(project));
  const serializedExpenses = JSON.parse(JSON.stringify(expenses));
  const serializedInvoices = JSON.parse(JSON.stringify(invoices));

  return (
    <ProjectDetailsClient
      project={serializedProject}
      allProjects={allProjects}
      initialExpenses={serializedExpenses}
      initialInvoices={serializedInvoices}
    />
  );
}
