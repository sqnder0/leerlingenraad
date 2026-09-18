// Next.js calls register() once when the server process starts (see
// https://nextjs.org/docs — "instrumentation"). The app runs as a single
// long-lived Node process per container (Dockerfile CMD, no serverless
// functions), so a plain setInterval here is enough for the periodic
// 24h-reminder check — no external cron/queue needed.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { sendUpcomingEventReminders } = await import("@/lib/reminders");

  const run = () =>
    sendUpcomingEventReminders().catch((err) => {
      console.error("24u-herinneringen versturen mislukt:", err);
    });

  const CHECK_INTERVAL_MS = 20 * 60 * 1000;
  setTimeout(run, 10 * 1000);
  setInterval(run, CHECK_INTERVAL_MS);
}
