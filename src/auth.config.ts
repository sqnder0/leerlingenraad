import type { NextAuthConfig } from "next-auth";
import type { Role, UserStatus } from "@/generated/prisma/enums";

// Edge-safe half of the Auth.js config (see docs/plan.md §2). No Prisma
// adapter and no Credentials.authorize here — both need a real Postgres
// connection, which the Edge runtime (middleware.ts) can't open. This half
// only knows how to read/verify the JWT, which is enough for middleware's
// coarse "is there a session at all" check.
export const authConfig = {
  // Self-hosted (Dokploy), not Vercel — Auth.js can't auto-detect a
  // trusted host. Needed here (not just in auth.ts) because proxy.ts
  // builds its own NextAuth instance from this same config to read the
  // session; without this it silently treats every request as signed out.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.status = token.status as UserStatus;
      return session;
    },
  },
} satisfies NextAuthConfig;
