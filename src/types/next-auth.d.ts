import type { DefaultSession } from "next-auth";
import type { Role, UserStatus } from "@/generated/prisma/enums";

// Module augmentation: add our own fields to the session/JWT shapes.
declare module "next-auth" {
  interface User {
    role: Role;
    status: UserStatus;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    status: UserStatus;
  }
}
