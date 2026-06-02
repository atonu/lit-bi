import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ---------------------------------------------------------------------------
// Prisma Client Singleton
// ---------------------------------------------------------------------------
// Prisma 7.x requires an explicit driver adapter (no auto-connect via
// DATABASE_URL). We use @prisma/adapter-pg which wraps the `pg` library.
//
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

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL environment variable is not set. " +
        "Please configure it in your .env file."
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
