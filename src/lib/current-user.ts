import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Node-runtime layer of the two-layer gating in docs/plan.md §2: a fresh
// Prisma lookup on every call, never trusting the JWT for status/role.
// This is what lets an admin's approve/promote action take effect
// immediately instead of waiting for the visitor's token to refresh.
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

/** Used by app/(protected)/layout.tsx. Redirects PENDING/REJECTED users. */
export async function requireApprovedUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "PENDING") redirect("/pending");
  if (user.status === "REJECTED") redirect("/rejected");
  return user;
}

/**
 * Used by app/(protected)/admin/layout.tsx AND by every admin server
 * action, per docs/plan.md §3 ("every admin server action/page starts
 * with `await requireAdmin()`").
 */
export async function requireAdmin() {
  const user = await requireApprovedUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
