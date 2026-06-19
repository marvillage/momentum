import nodemailer from "nodemailer";

export function emailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendEmail(subject: string, html: string) {
  if (!emailConfigured()) return { skipped: true as const, reason: "no GMAIL_USER/GMAIL_APP_PASSWORD" };
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  const to = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER!;
  await transport.sendMail({ from: `Momentum <${process.env.GMAIL_USER}>`, to, subject, html });
  return { sent: true as const, to };
}
