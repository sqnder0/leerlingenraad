import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { isLockedOut, recordFailedAttempt, clearAttempts } from "@/lib/rate-limit";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        username: { label: "Gebruikersnaam" },
        password: { label: "Wachtwoord", type: "password" },
      },
      // Only checks username/password correctness — does NOT gate on
      // `status`. That gating happens post-authentication in
      // app/(protected)/layout.tsx, per docs/plan.md §2, so a PENDING user
      // still reaches an "awaiting approval" page instead of a bare
      // access-denied at the login form.
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;
        const key = username.toLowerCase();

        // M7 hardening: the fallback-auth password is a guessable last
        // name by design (plan §Confirmed decisions), so throttle
        // repeated attempts against one account. Deliberately returns
        // the same generic failure as a wrong password — not revealing
        // account existence or lockout state is itself good practice.
        if (isLockedOut(key)) return null;

        const user = await prisma.user.findUnique({ where: { username: key } });
        if (!user || !user.passwordHash) {
          recordFailedAttempt(key);
          return null;
        }

        const valid = await verifyPassword(user.passwordHash, password);
        if (!valid) {
          recordFailedAttempt(key);
          return null;
        }
        clearAttempts(key);

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
});
