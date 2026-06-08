"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export interface SignUpState {
  success: boolean;
  error?: string;
}

export async function signUp(
  _prevState: SignUpState | null,
  formData: FormData
): Promise<SignUpState> {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!email || !name || !password) {
    return { success: false, error: "All fields are required." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." };
  }

  try {
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const baseSlug = name
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
        name: `${name}'s Workspace`,
        slug,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await usersColl.insertOne({
        _id: userId,
        email: email.toLowerCase(),
        name,
        hashed_password: hashedPassword,
        role: "OWNER",
        organization_id: orgId,
        created_at: new Date(),
        updated_at: new Date(),
      });
    } finally {
      await client.close();
    }

    return { success: true };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: "An unexpected error occurred during signup." };
  }
}
