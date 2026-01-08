export async function register() {
  console.log("🚀 [Instrumentation] Registering background services...");
  const { startDigestScheduler } =
    await import("./lib/reports/digest-scheduler");
  startDigestScheduler();
}
