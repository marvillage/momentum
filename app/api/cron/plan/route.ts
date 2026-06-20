import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureToday, getDashboard } from "@/lib/planner";
import { morning } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { cronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Build today's tasks for every user, and push them a morning nudge.
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await ensureToday(u.id);
    const { todays } = await getDashboard(u.id);
    const pending = todays.filter((t) => t.status !== "DONE").length;
    if (pending > 0) {
      await sendPushToUser(u.id, { title: "☀️ Today's plan", body: `${pending} task${pending === 1 ? "" : "s"} to crush today.`, url: "/" });
    }
  }

  const primary = users[0];
  const { subject, html } = primary ? await morning(primary.id) : { subject: "", html: "" };

  // dev-only preview: /api/cron/plan?dry=1
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  if (dry && process.env.NODE_ENV !== "production") {
    return new NextResponse(html, { headers: { "content-type": "text/html" } });
  }

  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = primary ? await sendEmail(subject, html) : { skipped: true as const };
  return NextResponse.json({ ok: true, users: users.length, ...result });
}
