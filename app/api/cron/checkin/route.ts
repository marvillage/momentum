import { NextResponse } from "next/server";
import { evening } from "@/lib/notify";
import { sendEmail } from "@/lib/email";
import { cronAuthorized } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { subject, html } = await evening();

  const dry = new URL(req.url).searchParams.get("dry") === "1";
  if (dry && process.env.NODE_ENV !== "production") {
    return new NextResponse(html, { headers: { "content-type": "text/html" } });
  }

  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const result = await sendEmail(subject, html);
  return NextResponse.json({ ok: true, ...result });
}
