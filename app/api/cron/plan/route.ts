import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureToday } from "@/lib/planner";
import { morning } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { cronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Build today's tasks for every user.
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) await ensureToday(u.id);

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
