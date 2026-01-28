"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // invoiceId could be retrieved from URL if we passed it, but stripe success_url redirects to project page usually.
  // Wait, my implementation redirected to /projects/[id]?tab=invoices&payment=success.
  // So this page might be redundant if I redirect directly to project.
  // Let's check my checkout session code.
  // success_url: `${origin}/projects/${invoice.projectId}?tab=invoices&payment=success&invoice=${invoice.id}`,

  // Ah, I implemented success_url to go back to Project Page!
  // So I don't technically need a dedicated /payments/success page unless I change the strategy.
  // The plan said "UI: Handle success/cancel redirect pages", but my code handled it by query params on project page.
  // I should stick to the code I wrote in route.ts which keeps context.

  // However, I should probably handle the "payment=success" state IN ProjectFinance or ProjectDetailsPage to show a celebration/toast.

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle>Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for your payment. Your invoice has been updated.
          </p>
          <Button onClick={() => router.push("/projects")}>
            Return to Projects
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
