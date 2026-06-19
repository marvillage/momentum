# Deploying Momentum to Vercel (100% free)

Everything below uses free tiers only.

## 1. Switch the database to Postgres (Neon)

SQLite works locally but Vercel needs a hosted DB. Neon's free tier is perfect.

1. Create a free account at https://neon.tech → new project → copy the **pooled** connection string
   (it contains `-pooler`). It looks like:
   `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
2. In `prisma/schema.prisma`, change the datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Push the schema and seed it against Neon:
   ```bash
   # temporarily set DATABASE_URL to the Neon URL in your shell, then:
   npx prisma db push
   npm run seed
   ```

## 2. Push the code to GitHub

```bash
cd C:\momentum
git add -A
git commit -m "Momentum v1"
# create a repo on github.com, then:
git remote add origin https://github.com/<you>/momentum.git
git push -u origin main
```

## 3. Import into Vercel

1. https://vercel.com → **Add New → Project** → import the repo.
2. Add **Environment Variables** (Project Settings → Environment Variables):
   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | your Neon pooled URL |
   | `APP_TZ` | `Asia/Kolkata` |
   | `CRON_SECRET` | any long random string |
   | `GMAIL_USER` | your gmail address |
   | `GMAIL_APP_PASSWORD` | see step 4 |
   | `NOTIFY_EMAIL` | where reminders go (optional, defaults to GMAIL_USER) |
3. Deploy. Your app is live at `https://<project>.vercel.app`.

## 4. Free email reminders (Gmail)

1. Enable 2-Step Verification on your Google account.
2. Go to https://myaccount.google.com/apppasswords → create an app password → copy the 16 characters.
3. Put your gmail in `GMAIL_USER` and the app password in `GMAIL_APP_PASSWORD` (Vercel + your local `.env`).
4. Test locally: open http://localhost:3000/api/cron/plan?dry=1 to preview the email. To actually send,
   call it without `?dry=1` once creds are set.

## 5. Cron (already configured)

`vercel.json` schedules two free daily jobs (times are **UTC**):
- `0 2 * * *`  → 07:30 IST — morning agenda
- `30 15 * * *` → 21:00 IST — evening check-in

Vercel automatically sends `Authorization: Bearer $CRON_SECRET`, which the routes verify.
Change the times by editing `vercel.json` (convert your local time to UTC).

## 6. Install on your phone

Open the Vercel URL in your phone browser → **Add to Home Screen**. It opens full-screen like an app.

---

### Add Telegram later (also free)
1. In Telegram, message **@BotFather** → `/newbot` → copy the bot token.
2. Message your new bot once, then visit
   `https://api.telegram.org/bot<TOKEN>/getUpdates` to find your numeric `chat.id`.
3. Tell me the token + chat id and I'll wire interactive ✅/⏭ buttons into the reminders.
