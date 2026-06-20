import { NextResponse } from "next/server";
import { ensureToday, getDashboard } from "@/lib/planner";
import { apiUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await ensureToday(userId);
  const data = await getDashboard(userId);
  return NextResponse.json(data);
}
