import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/current-user";
import { getVrijroosterenRows, toCsv } from "@/lib/data/vrijroosteren";

// Route Handlers don't inherit gating from a parent layout.tsx (that only
// wraps page rendering) — the admin check must happen explicitly here,
// same as in every admin server action.
export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  const startDate = start ? new Date(`${start}T00:00:00`) : new Date();
  const endDate = end ? new Date(`${end}T23:59:59`) : new Date();

  const rows = await getVrijroosterenRows(startDate, endDate);
  const csv = toCsv(rows);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vrijroosteren-${start ?? "export"}-${end ?? ""}.csv"`,
    },
  });
}
