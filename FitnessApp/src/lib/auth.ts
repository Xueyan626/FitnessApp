import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ALG = "HS256";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function signSession(payload: object, maxAgeSec = 60 * 60 * 24 * 7) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt(now)
    .setExpirationTime(now + maxAgeSec)
    .sign(secret);
}

export async function readSession<T = any>(): Promise<T | null> {
  const token = (await cookies()).get("auth")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
    return payload as T;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string, maxAgeSec = 60 * 60 * 24 * 7) {
  (await cookies()).set("auth", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSec,
  });
}

export async function clearAuthCookie() {
  (await cookies()).set("auth", "", { httpOnly: true, maxAge: 0, path: "/" });
}

export async function verifySession() {
  const session = await readSession();
  if (!session || !session.uid) return null;
  return session;
}