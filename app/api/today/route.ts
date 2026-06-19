import { NextResponse } from "next/server";
import { ensureToday, getDashboard } from "@/lib/planner";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureToday();
  const data = await getDashboard();
  return NextResponse.json(data);
}
