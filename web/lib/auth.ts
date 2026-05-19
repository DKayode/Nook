import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import Passkey from "next-auth/providers/passkey";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

// Local dev (HTTP) needs the cookie names stripped of __Secure- prefix or the browser
// refuses to store them; in prod (HTTPS) Auth.js's defaults are correct.
const isHttp = (process.env.NEXTAUTH_URL ?? "").startsWith("http://");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // Magic-link: enrollment for new accounts, fallback on devices without a passkey,
    // and the always-available recovery path.
    Nodemailer({
      // Build-time placeholder so `next build` doesn't crash; runtime env wins.
      server: process.env.EMAIL_SERVER || "smtp://build-placeholder:25",
      from: process.env.EMAIL_FROM || "noreply@example.com",
    }),
    // WebAuthn: daily-use sign-in via biometric / device unlock once a credential is enrolled.
    Passkey,
  ],
  experimental: { enableWebAuthn: true },
  pages: { signIn: "/sign-in", verifyRequest: "/verify-request" },
  useSecureCookies: !isHttp,
  cookies: isHttp
    ? {
        sessionToken: {
          name: "authjs.session-token",
          options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
        },
        csrfToken: {
          name: "authjs.csrf-token",
          options: { httpOnly: true, sameSite: "lax", path: "/", secure: false },
        },
        callbackUrl: {
          name: "authjs.callback-url",
          options: { sameSite: "lax", path: "/", secure: false },
        },
        webauthnChallenge: {
          name: "authjs.challenge-token",
          options: { httpOnly: true, sameSite: "lax", path: "/", secure: false, maxAge: 60 * 15 },
        },
      }
    : undefined,
  callbacks: {
    async session({ session, user }) {
      if (user) session.user.id = user.id;
      return session;
    },
  },
});
