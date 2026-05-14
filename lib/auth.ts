import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production"
);

export interface SessionPayload {
  userId?: string;
  username: string;
  email: string;
}

export async function createSession(payload: SessionPayload): Promise<string> {
  console.log("Creating session with payload:", payload);
  const token = await createJWT(payload);
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  cookieStore.set("usersession", payload.username, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
    cookieStore.set("useremail", payload.email, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return token;
}

export async function getSession(): Promise<SessionPayload | null | { username: string; email: string } > {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;


  if (!token) return null;
  return {
    username: cookieStore.get("usersession")?.value || "",
    email: cookieStore.get("useremail")?.value || "",
  };
  /*try {
    const verified = await jwtVerify(token, secret);
    console.log("Verified token payload:", verified.payload);
    return verified.payload as unknown as SessionPayload;
  } catch (err) {
    return null;
  }*/
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

async function createJWT(payload: SessionPayload): Promise<string> {
  // Simple JWT-like token (for production, use a proper JWT library)
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  
  return `${header}.${body}`;
}
