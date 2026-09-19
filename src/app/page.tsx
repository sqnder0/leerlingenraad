import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/current-user";

// "/" isn't a page of its own — it just routes you to where you actually
// need to be: /login if signed out, /pending or /rejected if your account
// isn't approved yet (requireApprovedUser handles all of that), otherwise
// straight to /dashboard.
export default async function Home() {
  await requireApprovedUser();
  redirect("/dashboard");
}
