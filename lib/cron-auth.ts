/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 *  In dev (no secret) we allow it so you can test by visiting the URL. */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  return auth === `Bearer ${secret}` || key === secret;
}
