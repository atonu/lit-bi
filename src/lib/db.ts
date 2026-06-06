import { PrismaClient } from "@/generated/prisma";

// ---------------------------------------------------------------------------
// Prisma Client Singleton
// ---------------------------------------------------------------------------
// In development, Next.js hot-reloads on every change. Without a singleton,
// each reload would create a new PrismaClient instance, eventually exhausting
// the database connection pool. This pattern stores the client on `globalThis`
// so it survives hot-reloads.
//
// In production, this simply creates a single PrismaClient instance.
// ---------------------------------------------------------------------------

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
