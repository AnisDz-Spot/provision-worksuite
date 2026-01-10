import { getAuthenticatedUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TemplatesClient } from "@/components/templates/TemplatesClient";

export default async function TemplatesPage() {
  // SECURITY: Server-side authentication check
  const currentUser = await getAuthenticatedUser();

  if (!currentUser) {
    redirect("/login");
  }

  return <TemplatesClient />;
}
