import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evening } from "@/lib/notify";
import { getDashboard } from "@/lib/planner";
import { sendEmail } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { cronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Evening nudge: ask every user to wrap up unfinished tasks.
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    const { todays } = await getDashboard(u.id);
    const left = todays.filter((t) => t.status === "PENDING").length;
    if (left > 0) {
      await sendPushToUser(u.id, { title: "🌙 Wrap up your day", body: `${left} unfinished — keep or drop each before bed.`, url: "/" });
    }
  }

  const primary = await prisma.user.findFirst({ select: { id: true } });
  const { subject, html } = primary ? await evening(primary.id) : { subject: "", html: "" };

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  if (dry && process.env.NODE_ENV !== "production") {
    return new NextResponse(html, { headers: { "content-type": "text/html" } });
  }

  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = primary ? await sendEmail(subject, html) : { skipped: true as const };
  return NextResponse.json({ ok: true, ...result });
}
