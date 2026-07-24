import type { NextAuthConfig } from "next-auth";

// Edge-safe config used by middleware. No adapter, no Node-only providers —
// this only decides "is there a session at all," a cheap redirect hint.
// The authoritative, DB-backed checks (session validity, age, onboarding
// status) live in getCurrentUser() and run on every request in the app
// layout, never trusting this JWT-derived value alone.
export const authConfig = {
  pages: {
    signIn: "/sign-in",
    verifyRequest: "/sign-in/verify",
  },
  session: {
    strategy: "jwt",
  },
  // Vercel assigns a new deployment URL on every deploy (no fixed AUTH_URL
  // to pin), so Auth.js's production host-check needs to be told the
  // dynamic Host header is trustworthy — Vercel's own routing guarantees
  // that. Without this, sign-in fails with a generic "Configuration" error
  // in production while working fine in dev (which trusts the host by
  // default).
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isPublicPath =
        pathname === "/" ||
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/api/auth");

      if (isPublicPath) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
