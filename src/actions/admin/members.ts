"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

// Strips accents/spaces so "Ó. Émile" -> "emile" style names still produce
// a clean ASCII username.
function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * username = lowercased first name; on collision, append the last-name
 * initial (e.g. "sander" -> "sanderp"), per docs/plan.md §1.
 */
async function generateUsername(firstName: string, lastName: string): Promise<string> {
  const base = slugifyName(firstName);
  const withInitial = `${base}${slugifyName(lastName).slice(0, 1)}`;

  const [baseTaken, withInitialTaken] = await Promise.all([
    prisma.user.findUnique({ where: { username: base } }),
    prisma.user.findUnique({ where: { username: withInitial } }),
  ]);

  if (!baseTaken) return base;
  if (!withInitialTaken) return withInitial;

  // Rare: both collide. Fall back to a numbered suffix rather than fail.
  for (let n = 2; n < 100; n++) {
    const candidate = `${withInitial}${n}`;
    if (!(await prisma.user.findUnique({ where: { username: candidate } }))) {
      return candidate;
    }
  }
  throw new Error("Kon geen unieke gebruikersnaam genereren.");
}

const createMemberSchema = z.object({
  firstName: z.string().trim().min(1, "Voornaam is verplicht."),
  lastName: z.string().trim().min(1, "Achternaam is verplicht."),
  classGroup: z.string().trim().optional(),
  role: z.enum(["MEMBER", "ADMIN"]),
});

export type CreateMemberState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; username: string; password: string };

export async function createMember(
  _prevState: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  await requireAdmin();

  const parsed = createMemberSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    classGroup: formData.get("classGroup") || undefined,
    role: formData.get("role") ?? "MEMBER",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const { firstName, lastName, classGroup, role } = parsed.data;

  // Fallback-auth scheme (plan §Confirmed decisions): password = last name,
  // as entered. Guessable by design for now; Smartschool OAuth (M9) is the
  // real fix.
  const username = await generateUsername(firstName, lastName);
  const passwordHash = await hashPassword(lastName);

  await prisma.user.create({
    data: { firstName, lastName, username, classGroup, role, passwordHash },
  });

  revalidatePath("/admin/members");
  return { status: "success", username, password: lastName };
}

export async function approveMember(userId: string) {
  const admin = await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { status: "APPROVED", approvedById: admin.id, approvedAt: new Date() },
  });
  revalidatePath("/admin/members");
  revalidatePath("/admin");
}

export async function rejectMember(userId: string) {
  const admin = await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { status: "REJECTED", approvedById: admin.id, approvedAt: new Date() },
  });
  revalidatePath("/admin/members");
  revalidatePath("/admin");
}
