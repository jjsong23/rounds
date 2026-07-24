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
