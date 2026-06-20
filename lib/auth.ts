import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";
import { readSession, SESSION_COOKIE } from "./crypto-auth";

/** The logged-in user (or null). Memoized per request. */
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const s = readSession(token);
  if (!s) return null;
  return prisma.user.findUnique({ where: { id: s.uid } });
});

/** For pages: require a session, else bounce to /login. Also routes new users to onboarding. */
export async function requireUser(opts: { allowUnonboarded?: boolean } = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.onboarded && !opts.allowUnonboarded) redirect("/onboarding");
  return user;
}

/** For route handlers: returns userId or null (caller sends 401). */
export async function apiUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}
