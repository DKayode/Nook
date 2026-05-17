import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

const isHttp = (process.env.NEXTAUTH_URL ?? "").startsWith("http://");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Nodemailer({
      // Placeholder during `next build` (env isn't injected in the builder stage of the Dockerfile).
      // At runtime the real EMAIL_SERVER from docker-compose env wins.
      server: process.env.EMAIL_SERVER || "smtp://build-placeholder:25",
      from: process.env.EMAIL_FROM || "noreply@example.com",
    }),
  ],
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
      }
    : undefined,
  callbacks: {
    async session({ session, user }) {
      if (user) session.user.id = user.id;
      return session;
    },
  },
});
