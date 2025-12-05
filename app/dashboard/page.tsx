"use client";

export default function DashboardPage() {
  return (
    <>
      <section className="flex flex-col items-center justify-center h-[80vh] text-center gap-8">
        <div className="w-28 h-28 bg-linear-to-br from-indigo-500 to-pink-500 rounded-2xl mb-2"></div>
        <h1 className="text-4xl font-bold">Welcome to your Dashboard</h1>
        <p className="text-muted-foreground max-w-sm">
          Here is where you can see your analytics, projects, and team activity.
        </p>
      </section>
    </>
  );
}
