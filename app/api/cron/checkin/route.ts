import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evening } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { cronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
