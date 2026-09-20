"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateUsername } from "@/lib/username";

const createMemberSchema = z.object({
  firstName: z.string().trim().min(1, "Voornaam is verplicht."),
  lastName: z.string().trim().min(1, "Achternaam is verplicht."),
  classGroup: z.string().trim().optional(),
  role: z.enum(["MEMBER", "ADMIN"]),
  isTeacher: z.coerce.boolean(),
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
    isTeacher: formData.get("isTeacher") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }
  const { firstName, lastName, classGroup, role, isTeacher } = parsed.data;

  // Fallback-auth scheme (plan §Confirmed decisions): password = last name,
  // as entered. Guessable by design for now; Smartschool OAuth (M9) is the
  // real fix.
  const username = await generateUsername(firstName, lastName);
  const passwordHash = await hashPassword(lastName);

  await prisma.user.create({
    data: { firstName, lastName, username, classGroup, role, isTeacher, passwordHash },
  });

  revalidatePath("/admin/members");
  return { status: "success", username, password: lastName };
}

const updateMemberSchema = z.object({
  firstName: z.string().trim().min(1, "Voornaam is verplicht."),
  lastName: z.string().trim().min(1, "Achternaam is verplicht."),
  classGroup: z.string().trim().optional(),
  role: z.enum(["MEMBER", "ADMIN"]),
  isTeacher: z.coerce.boolean(),
});

export type UpdateMemberState = { status: "idle" } | { status: "error"; message: string };

export async function updateMember(
  userId: string,
  _prevState: UpdateMemberState,
  formData: FormData,
): Promise<UpdateMemberState> {
  await requireAdmin();

  const parsed = updateMemberSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    classGroup: formData.get("classGroup") || undefined,
    role: formData.get("role"),
    isTeacher: formData.get("isTeacher") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  await prisma.user.update({ where: { id: userId }, data: parsed.data });

  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${userId}`);
  return { status: "idle" };
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
