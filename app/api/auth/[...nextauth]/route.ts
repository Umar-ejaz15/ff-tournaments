import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { wallet: true },
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Ensure wallet exists
        if (!user.wallet) {
          await prisma.wallet.create({
            data: { userId: user.id, balance: 0 },
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // ✅ Ensure user and wallet exist
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) {
          return false;
        }

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { wallet: true },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              name: user.name ?? "Unnamed User",
              email: user.email,
              role: "user",
              image: user.image,
              wallet: { create: { balance: 0 } },
            },
          });
        } else if (!existingUser.wallet) {
          await prisma.wallet.create({
            data: { userId: existingUser.id, balance: 0 },
          });
        }

        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },

    // ✅ Attach role to JWT - IMPORTANT: Always fetch fresh data
    async jwt({ token, user, trigger, session }) {
      // When user first signs in (for both credentials and OAuth)
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role.toLowerCase(); // Normalize to lowercase
          token.email = dbUser.email;
          token.name = dbUser.name;
        }
      }

      // If session is being updated (e.g., role change)
      if (trigger === "update" && session?.role) {
        token.role = session.role.toLowerCase();
      }

      // Always ensure we have the latest role from database (normalize to lowercase)
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
        });
        if (dbUser) {
          token.role = dbUser.role.toLowerCase();
        }
      }

      return token;
    },

    // ✅ Include role in session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },

    // ✅ Role-based redirect after login
    async redirect({ url, baseUrl }) {
      // Clean the URL to get the path
      let targetPath = url.replace(baseUrl, "");

      // If URL is the base or login page, redirect to user page by default
      // The login page will then redirect based on role
      if (targetPath === "/" || targetPath.startsWith("/auth/login")) {
        return `${baseUrl}/user`;
      }

      // Validate the URL is from same origin
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Default to user page
      return `${baseUrl}/user`;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

