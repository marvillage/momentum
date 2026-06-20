import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { todayStr } from "@/lib/date";
import { apiUserId } from "@/lib/auth";

export async function GET(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const date = new URL(req.url).searchParams.get("date") || todayStr();
  const logs = await prisma.foodLog.findMany({ where: { userId, date }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(logs);
}

export async function POST(req: Request) {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json();
  const name: string = (b.name || "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const kcal = Math.max(0, Math.round(Number(b.kcal) || 0));
  const protein = Math.max(0, Math.round(Number(b.protein) || 0));
  const carbs = Math.max(0, Math.round(Number(b.carbs) || 0));

  const log = await prisma.foodLog.create({
    data: { userId, date: b.date || todayStr(), bucket: b.bucket || "SNACK", name, kcal, protein, carbs },
  });

  // Quick-add from a saved meal → bump its usage count.
  if (b.savedMealId) {
    await prisma.savedMeal.updateMany({ where: { id: b.savedMealId, userId }, data: { uses: { increment: 1 } } });
  }
  // "Save for quick-add" → remember this meal (dedupe by name).
  if (b.save) {
    const existing = await prisma.savedMeal.findFirst({ where: { userId, name } });
    if (!existing) await prisma.savedMeal.create({ data: { userId, name, kcal, protein, carbs } });
  }

  return NextResponse.json(log);
}
