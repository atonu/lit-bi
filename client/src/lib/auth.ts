import { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Extend NextAuth typings to include custom user fields
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      organizationId: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    organizationId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    organizationId: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-client-secret",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!isValid) {
          throw new Error("Invalid email or password.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role.toString(),
          organizationId: user.organizationId,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;

        let dbUser = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });

        // If user doesn't exist, create an organization and a new user record
        if (!dbUser) {
          const userName = user.name || "User";
          const baseSlug = userName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          const slug = `${baseSlug || "org"}-${Math.random().toString(36).substring(2, 6)}`;

          // Create organization and user using raw MongoClient to avoid transaction replica set requirements on local standalone DBs
          const { MongoClient, ObjectId } = await import("mongodb");
          const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb://localhost:27017/bi_lite";
          const client = new MongoClient(uri);
          await client.connect();

          try {
            const mdb = client.db();
            const orgsColl = mdb.collection("organizations");
            const usersColl = mdb.collection("users");

            const orgId = new ObjectId();
            const userId = new ObjectId();

            await orgsColl.insertOne({
              _id: orgId,
              name: `${userName}'s Workspace`,
              slug,
              created_at: new Date(),
              updated_at: new Date(),
            });

            await usersColl.insertOne({
              _id: userId,
              email: user.email.toLowerCase(),
              name: userName,
              avatar_url: user.image || null,
              role: "OWNER",
              organization_id: orgId,
              created_at: new Date(),
              updated_at: new Date(),
            });

            // Reconstruct the dbUser object that NextAuth expects
            dbUser = {
              id: userId.toString(),
              email: user.email.toLowerCase(),
              name: userName,
              avatarUrl: user.image || null,
              role: "OWNER" as any,
              organizationId: orgId.toString(),
              createdAt: new Date(),
              updatedAt: new Date(),
              hashedPassword: null,
            };
          } finally {
            await client.close();
          }
        } else if (user.image && dbUser.avatarUrl !== user.image) {
          // Sync profile picture
          await db.user.update({
            where: { id: dbUser.id },
            data: { avatarUrl: user.image },
          });
        }

        // Attach DB details to next-auth user object for the jwt callback to collect
        user.id = dbUser.id;
        user.role = dbUser.role.toString();
        user.organizationId = dbUser.organizationId;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.organizationId = user.organizationId;
      } else if (token.sub && !token.organizationId) {
        // Fallback DB check for token persistence refresh
        const dbUser = await db.user.findUnique({
          where: { id: token.sub },
          select: { role: true, organizationId: true },
        });
        if (dbUser) {
          token.role = dbUser.role.toString();
          token.organizationId = dbUser.organizationId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id || token.sub || "";
        session.user.role = token.role || "MEMBER";
        session.user.organizationId = token.organizationId || "";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.NEXTAUTH_SECRET || "bi-lite-jwt-secret-key-super-secure",
};
