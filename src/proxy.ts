import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Edge layer 1 of the two-layer gating in docs/plan.md §2: only checks
// "is there a session at all" (optimistic, cookie-only — see Next's Proxy
// auth guide). Role/status are re-checked fresh against Postgres in
// app/(protected)/layout.tsx, which can't run on the edge.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/events/:path*",
    "/my/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
