import { prisma } from "@/lib/prisma";

// Strips accents/spaces so "Ó. Émile" -> "emile" style names still produce
// a clean ASCII username.
function slugifyName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * username = lowercased first name; on collision, append the last-name
 * initial (e.g. "sander" -> "sanderp"), per docs/plan.md §1. Shared by the
 * admin "nieuw lid" form and invite-link self-registration.
 */
export async function generateUsername(firstName: string, lastName: string): Promise<string> {
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
