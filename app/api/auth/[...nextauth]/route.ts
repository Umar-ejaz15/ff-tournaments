import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

// Use shared Prisma client to avoid excess connections in serverless

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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // ✅ Ensure user and wallet exist, handle account linking
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) {
          return false;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { 
            wallet: true,
            accounts: true 
          },
        });

        // If user doesn't exist, create new user
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
          return true;
        }

        // If user exists, check if account is already linked
        if (account && account.provider) {
          const existingAccount = await prisma.account.findFirst({
            where: {
              userId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

          // If account is not linked, link it now
          if (!existingAccount && account.provider !== "credentials") {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            });
          }
        }

        // Ensure wallet exists
        if (!existingUser.wallet) {
          await prisma.wallet.create({
            data: { userId: existingUser.id, balance: 0 },
          });
        }

        // Update user image if provided and different
        if (user.image && existingUser.image !== user.image) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { image: user.image },
          });
        }

        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        // Don't block sign-in if it's just a linking issue
        // The PrismaAdapter will handle account creation
        return true;
      }
    },

    // ✅ Attach role to JWT - IMPORTANT: Always fetch fresh data
    async jwt({ token, user, trigger, session }) {
      // When user first signs in (for both credentials and OAuth)
      if (user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role.toLowerCase(); // Normalize to lowercase
            token.email = dbUser.email;
            token.name = dbUser.name;
          }
        } catch (error) {
          console.error("JWT callback Prisma error:", error);
          // Use user data from the sign-in if Prisma fails
          if (user.email) {
            token.email = user.email;
            token.name = user.name || "User";
            token.role = "user"; // Default role
          }
        }
      }

      // If session is being updated (e.g., role change)
      if (trigger === "update" && session?.role) {
        token.role = session.role.toLowerCase();
      }

      // Only try to fetch from database if we don't already have a role
      // This prevents infinite loops when Prisma is unavailable
      if (token.email && !token.role) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          if (dbUser) {
            token.role = dbUser.role.toLowerCase();
          } else {
            token.role = "user"; // Default role if user not found
          }
        } catch (error) {
          console.error("JWT callback Prisma error (role fetch):", error);
          // Use default role if Prisma fails
          token.role = token.role || "user";
        }
      }

      return token;
    },

    // ✅ Include role in session
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "user"; // Default to "user" if no role
        session.user.email = (token.email as string) || session.user.email;
        session.user.name = (token.name as string) || session.user.name;
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

