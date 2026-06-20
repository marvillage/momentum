import { NextResponse } from "next/server";
import { apiUserId } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const userId = await apiUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await sendPushToUser(userId, {
    title: "Momentum 🔔",
    body: "Push is working. We'll nudge you to stay on track.",
    url: "/",
  });
  return NextResponse.json(result);
}
