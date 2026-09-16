"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    // `signIn`'s own redirect-on-success throws a special Next.js signal
    // that must NOT be swallowed here, so only handle actual auth errors.
    if (error instanceof AuthError) {
      return "Ongeldige gebruikersnaam of wachtwoord.";
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
