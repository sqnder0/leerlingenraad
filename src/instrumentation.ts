// Next.js calls register() once when the server process starts (see
// https://nextjs.org/docs — "instrumentation"). The app runs as a single
// long-lived Node process per container (Dockerfile CMD, no serverless
// functions), so a plain setInterval here is enough for both periodic
// checks below — no external cron/queue needed.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { sendUpcomingEventReminders } = await import("@/lib/reminders");
  const { ensureCurrentSchoolYear } = await import("@/lib/school-year");

  const runReminders = () =>
    sendUpcomingEventReminders().catch((err) => {
      console.error("24u-herinneringen versturen mislukt:", err);
    });
  const REMINDER_INTERVAL_MS = 20 * 60 * 1000;
  setTimeout(runReminders, 10 * 1000);
  setInterval(runReminders, REMINDER_INTERVAL_MS);

  // Only matters once a year (the Sept 1 rollover) but is idempotent and
  // cheap, so checking every few hours is simplest — no need to compute
  // "wake me right at midnight on Sept 1".
  const runSchoolYearCheck = () =>
    ensureCurrentSchoolYear().catch((err) => {
      console.error("Automatisch schooljaar bijwerken mislukt:", err);
    });
  const SCHOOL_YEAR_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
  setTimeout(runSchoolYearCheck, 15 * 1000);
  setInterval(runSchoolYearCheck, SCHOOL_YEAR_CHECK_INTERVAL_MS);
}
