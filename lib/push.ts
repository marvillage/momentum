import webpush from "web-push";
import { prisma } from "./db";

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@momentum.app", pub, priv);
  configured = true;
  return true;
}

export function pushEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

/** Send a notification to every device a user has subscribed. Prunes dead subs. */
export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  if (!configure()) return { sent: 0, skipped: true as const };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const data = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, data);
        sent++;
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
      }
    })
  );
  return { sent };
}
