import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// One-time production bootstrap: this app has no self-registration by
// design (docs/plan.md — accounts are admin-created only), which is a
// chicken-and-egg problem for the very first deploy where no admin
// exists yet to create one. This route creates exactly one ADMIN
// account and then permanently refuses to do anything more.
//
// Two independent locks, either one alone would be enough:
// 1. BOOTSTRAP_SECRET must match (set it as a Dokploy env var, use it
//    once, then feel free to remove the env var or leave it — see 2).
// 2. Only works while the users table is empty. Once any user exists,
//    this always 403s, secret or not, forever.
//
// Not under (protected) — there's no session to gate on yet.

const bodySchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  username: z.string().trim().min(1).optional(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const expected = process.env.BOOTSTRAP_SECRET;
  const provided = request.headers.get("x-bootstrap-secret");
  // Constant-shape check first so a missing env var can't accidentally
  // make every request "match" — both branches return the same 404.
  if (!expected || !provided || provided !== expected) {
    return new Response("Not found", { status: 404 });
  }

  const existingUserCount = await prisma.user.count();
  if (existingUserCount > 0) {
    return new Response("Already bootstrapped", { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { firstName, lastName, password } = parsed.data;
  const username = (parsed.data.username ?? firstName).toLowerCase();

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { firstName, lastName, username, passwordHash, role: "ADMIN", status: "APPROVED" },
  });

  return Response.json({ id: user.id, username: user.username });
}
