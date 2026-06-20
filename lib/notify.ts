import { getDashboard } from "./planner";
import { niceDate, todayStr } from "./date";

type Task = Awaited<ReturnType<typeof getDashboard>>["todays"][number];

const C = { ground: "#0b0b0c", surface: "#141416", ink: "#f4f4f2", muted: "#8b8b84", lime: "#c6f833", hot: "#ff4d2e" };

function row(t: Task): string {
  const title = t.item?.title || t.activity.name;
  const tgt = t.activity.targetCount > 1 ? ` (${t.count}/${t.activity.targetCount})` : "";
  const link = t.item?.url
    ? ` &middot; <a href="${t.item.url}" style="color:${C.lime};text-decoration:none">open ▶</a>`
    : "";
  return `<tr><td style="padding:8px 0;border-bottom:1px solid #2a2a2e;color:${C.ink};font-size:15px">
      <b>${title}</b>${tgt}
      <span style="color:${C.muted};font-size:12px;text-transform:uppercase"> &middot; ${t.activity.area}</span>${link}
    </td></tr>`;
}

function shell(heading: string, sub: string, bodyRows: string, footer: string): string {
  return `<div style="background:${C.ground};padding:24px;font-family:Helvetica,Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:${C.surface};border:1px solid #2a2a2e;border-radius:16px;padding:24px">
      <div style="color:${C.lime};font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase">MO/MENTUM</div>
      <h1 style="color:${C.ink};font-size:26px;margin:8px 0 2px;text-transform:uppercase">${heading}</h1>
      <p style="color:${C.muted};font-size:13px;margin:0 0 16px">${sub}</p>
      <table style="width:100%;border-collapse:collapse">${bodyRows}</table>
      <p style="color:${C.muted};font-size:12px;margin-top:18px">${footer}</p>
    </div>
  </div>`;
}

export async function morning(userId: string) {
  const { todays } = await getDashboard(userId);
  const pending = todays.filter((t) => t.status !== "DONE");
  const body = pending.length ? pending.map(row).join("") : `<tr><td style="color:${C.muted}">Nothing scheduled. Rest up.</td></tr>`;
  return {
    subject: `☀️ Today's plan — ${pending.length} to go`,
    html: shell("Today", `${niceDate(todayStr())} · ${pending.length} tasks to do`, body, "Open the app to check things off. Let's move."),
  };
}

export async function evening(userId: string) {
  const { todays, backlog } = await getDashboard(userId);
  const pending = todays.filter((t) => t.status !== "DONE");
  const done = todays.length - pending.length;
  const body = pending.length
    ? pending.map(row).join("")
    : `<tr><td style="color:${C.lime};font-size:16px"><b>Everything done. Clean sweep. 🔥</b></td></tr>`;
  const blog = backlog.length ? `${backlog.length} item(s) already in backlog. ` : "";
  return {
    subject: pending.length ? `🌙 ${pending.length} left today` : `🌙 All done today 🔥`,
    html: shell("Did you finish?", `${done}/${todays.length} done today. ${blog}`, body, "Anything not done rolls into tomorrow's backlog."),
  };
}
