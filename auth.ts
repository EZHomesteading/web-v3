import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import authConfig from "@/auth.config";
import { getUserById } from "@/utils/user";
import { fullName, Notification, UserRole } from "@prisma/client";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { sign } from "jsonwebtoken"; //missing?

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "credentials") return true;
      return true;
    },

    async session({ token, session }: { token: JWT; session: Session }) {
      if (session.user) {
        // Basic user info
        session.user.id = token.sub ?? (token.id as string);
        session.user.name = token.name;
        session.user.email = token.email ?? "";

        // Extended user info
        session.user.fullName = token.fullName as fullName;
        session.user.phone = token.phone as string | undefined;
        session.user.image = token.image as string | undefined;
        session.user.stripeAccountId = token.stripeAccountId as
          | string
          | undefined;
        session.user.url = token.url as string;
        session.user.role = token.role as UserRole;

        // Timestamps and metadata
        session.user.createdAt = token.createdAt as Date | undefined;
        session.user.updatedAt = token.updatedAt as Date | undefined;
        session.user.hasPickedRole = token.hasPickedRole as boolean | undefined;

        // Business logic
        session.user.subscriptions = token.subscriptions as string | undefined;
        session.user.totalPaidOut = token.totalPaidOut as number;
        session.user.notifications = token.notifications as Notification[];
        session.user.openClosedTemplates = token.openClosedTemplates as any;
        session.user.canRecievePayouts = token.canRecievePayouts as boolean;

        // token to make api calls to go backend
        session.user.goToken = token.goToken as string;
      }
      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;
      const goCompatibleToken = sign(
        {
          id: existingUser.id,
          role: existingUser.role,
        },
        process.env.JWT_SECRET!,
        { expiresIn: "14d" }
      );
      return {
        ...token,
        id: existingUser.id,
        fullName: existingUser.fullName ?? { first: null, last: null },
        name: existingUser.name,
        email: existingUser.email,
        emailVerified: existingUser.emailVerified,
        phone: existingUser.phone ?? undefined,
        image: existingUser.image ?? undefined,
        hasPickedRole: existingUser.hasPickedRole ?? false,
        url: existingUser.url ?? "",
        role: existingUser.role,
        password: existingUser.password,
        stripeAccountId: existingUser.stripeAccountId ?? undefined,
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt,
        subscriptions: existingUser.subscriptions ?? undefined,
        totalPaidOut: existingUser.totalPaidOut ?? 0,
        notifications: existingUser.notifications,
        openClosedTemplates: existingUser.openCloseTemplates,
        canRecievePayouts: existingUser.canRecievePayouts ?? undefined,
        goToken: goCompatibleToken,
      };
    },
  },
  jwt: {
    maxAge: 14 * 24 * 60 * 60, // 3 days
  },
  ...authConfig,
});
