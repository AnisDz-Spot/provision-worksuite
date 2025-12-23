import { notFound } from "next/navigation";
import ClientForm from "@/components/clients/ClientForm";
import prisma from "@/lib/prisma";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    notFound();
  }

  // Convert dates to ISO strings if needed, or pass as is if ClientForm expects strings.
  // The form expects:
  // type ClientData = { ... all fields ... }
  // Prisma returns stricter types (DateTime for createdAt), but our form uses initialData loosely.
  // However, form state init uses `initialData || defaults`.
  // We might need to ensure types match perfectly or cast.
  // Since ClientForm uses ClientData which has optional fields, we should be good mostly.
  // But `hourlyRate` in Prisma is Float (number | null), form expects number | undefined.
  // We can pass `client` directly and cast to `any` or strict `ClientData` to satisfy TS.

  return <ClientForm initialData={client as any} isEditing />;
}
