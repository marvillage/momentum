"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword, verifyPassword, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/crypto-auth";

export type AuthState = { error?: string } | undefined;

async function setSession(uid: string) {
  const c = await cookies();
  c.set(SESSION_COOKIE, signSession(uid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  if (!username || !password) return { error: "Enter your username and password." };

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "Wrong username or password." };
  }
  await setSession(user.id);
  redirect(user.onboarded ? "/" : "/onboarding");
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim() || null;

  if (username.length < 3) return { error: "Username must be at least 3 characters." };
  if (!/^[a-z0-9_]+$/.test(username)) return { error: "Username can only use letters, numbers, and underscore." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  if (await prisma.user.findUnique({ where: { username } })) return { error: "That username is taken." };

  const user = await prisma.user.create({ data: { username, name, passwordHash: hashPassword(password) } });
  await prisma.settings.create({ data: { userId: user.id } });
  await setSession(user.id);
  redirect("/onboarding");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}

export async function completeOnboarding() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.user.update({ where: { id: user.id }, data: { onboarded: true } });
  redirect("/");
}

export async function resetStats() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Baseline everything from now: XP, rank, streak start fresh.
  await prisma.user.update({ where: { id: user.id }, data: { statsResetAt: new Date(), lastRank: null } });
  redirect("/stats");
}

export async function deleteAccount() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.user.delete({ where: { id: user.id } }); // cascades to all their data
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
