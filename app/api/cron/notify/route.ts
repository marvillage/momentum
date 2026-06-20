import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureToday, getDashboard } from "@/lib/planner";
import { morning } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { cronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

// Generic "where are you at today" send — call this as many times a day as you
// like (Vercel cron and/or an external scheduler such as cron-job.org).
export async function GET(req: Request) {
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  if (!dry && !cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({ select: { id: true } });
  let sent = 0;
  for (const u of users) {
    await ensureToday(u.id);
    const { todays } = await getDashboard(u.id);
    const pending = todays.filter((t) => t.status !== "DONE").length;
    if (pending === 0) continue;
    const { subject, html } = await morning(u.id);
    if (!dry) {
      await sendEmail(subject, html);
      await sendPushToUser(u.id, { title: "⏰ Momentum", body: `${pending} task${pending === 1 ? "" : "s"} left today.`, url: "/" });
    }
    sent++;
  }
  return NextResponse.json({ ok: true, users: users.length, sent });
}
