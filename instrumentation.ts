// Force Node.js runtime for server-side instrumentation
export const runtime = "nodejs";

export async function register() {
  // Only run in Node.js environment (server-side)
  if (typeof window === "undefined") {
    console.log("🚀 [Instrumentation] Registering background services...");
    const { startDigestScheduler } =
      await import("./lib/reports/digest-scheduler");
    startDigestScheduler();
  }
}
