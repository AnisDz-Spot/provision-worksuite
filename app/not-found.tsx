import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="flex flex-col items-center justify-center h-[80vh] text-center gap-8">
      <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-2xl mb-2"></div>
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground max-w-sm">Sorry, the page you’re looking for does not exist.</p>
      <Link href="/">
        <Button variant="primary">Back to Dashboard</Button>
      </Link>
    </section>
  );
}


