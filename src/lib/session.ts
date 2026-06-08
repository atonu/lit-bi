import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const REFRESH_SECRET = process.env.REFRESH_SECRET || "bi-lite-refresh-secret-key";

export async function getServerSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;
  
  if (!refreshToken) return null;
  
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;
    return {
      user: {
        id: decoded.id,
        role: decoded.role,
        organizationId: decoded.organizationId,
      }
    };
  } catch (error) {
    return null;
  }
}
