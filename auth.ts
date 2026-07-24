import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";
import { sendVerificationRequest } from "@/lib/email";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Nodemailer({
      id: "email",
      name: "Email",
      // Unused: sendVerificationRequest below fully overrides delivery
      // (Resend in production, console log in dev). Auth.js still requires
      // a syntactically valid `server` value even when it's never called.
      server: "smtp://localhost:1025",
      from: process.env.EMAIL_FROM ?? "Rounds <onboarding@rounds.app>",
      sendVerificationRequest,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    // Auth.js creates the User row with only {email, emailVerified, name,
    // image} at first sign-in. Backfill our own display fields here so
    // onboarding has something reasonable to prefill; displayName stays
    // authoritative once the user edits it in onboarding.
    async createUser({ user }) {
      if (!user.id) return;
      const emailDomain = user.email?.split("@")[1];
      await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName: user.name ?? user.email?.split("@")[0] ?? null,
          avatarUrl: user.image ?? null,
          emailDomain: emailDomain ?? null,
        },
      });
    },
  },
});
