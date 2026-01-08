export async function register() {
  // Only start the scheduler on the server-side
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startDigestScheduler } =
      await import("./lib/reports/digest-scheduler");
    startDigestScheduler();
  }
}
