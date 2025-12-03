"use client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Error() {
  return (
    <section className="flex flex-col items-center justify-center h-[80vh] text-center gap-8">
      <div className="w-28 h-28 bg-gradient-to-br from-destructive to-pink-500 rounded-2xl mb-2"></div>
      <h1 className="text-4xl font-bold">Server Error</h1>
      <p className="text-muted-foreground max-w-sm">Something went wrong. Please try again.</p>
      <Link href="/">
        <Button variant="primary">Retry</Button>
      </Link>
    </section>
  );
}
