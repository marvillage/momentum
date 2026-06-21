import { requireUser } from "@/lib/auth";
import { getSprintData } from "@/lib/jira";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = { indeterminate: "In progress", new: "To do", done: "Done", cancelled: "Cancelled" };
const CAT_ORDER = ["indeterminate", "new", "done", "cancelled"];

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "—";
}

export default async function AecadPage() {
  const user = await requireUser();
  const data = await getSprintData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">📋 Work · ML</p>
        <h1 className="text-5xl font-black uppercase tracking-tight">AECAD</h1>
        <p className="text-muted mt-2 text-sm font-bold uppercase tracking-wide">Your Jira sprint</p>
      </div>

      {data.status === "unconfigured" ? (
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-lime">Not connected yet</h2>
          <p className="text-muted text-sm">No snapshot or live Jira connection. Set JIRA_EMAIL + JIRA_API_TOKEN, or connect via OAuth.</p>
        </div>
      ) : data.status === "error" ? (
        <div className="rounded-2xl border border-hot/40 bg-hot/5 p-5">
          <p className="text-hot font-bold text-sm">Couldn&apos;t load Jira: {data.error}</p>
        </div>
      ) : data.status === "no_sprint" ? (
        <div className="rounded-2xl border border-line bg-surface p-5 text-muted text-sm">No active sprint right now.</div>
      ) : (
        (() => {
          const { view } = data;
          const t = view.totals;
          const pct = t.count ? Math.round((100 * t.doneCount) / t.count) : 0;
          return (
            <>
              {data.source === "snapshot" && (
                <div className="rounded-xl border border-line bg-surface2 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-muted">
                  📸 Snapshot · synced {data.syncedAt ? new Date(data.syncedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "—"} · days-left is live
                </div>
              )}

              {/* sprint summary */}
              <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-black text-lg truncate">{view.sprint.name}</div>
                    <div className="text-muted text-xs mt-0.5">
                      {fmt(view.sprint.startDate)} → {fmt(view.sprint.endDate)}
                      {view.sprint.lengthDays ? ` · ${view.sprint.lengthDays}-day sprint` : ""}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-black text-lime leading-none">{view.sprint.daysLeft ?? "—"}</div>
                    <div className="text-muted text-[10px] font-bold uppercase tracking-widest mt-1">days left</div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted mb-1.5">
                    <span>{t.pointsTracked ? "Story points" : "Tickets done"}</span>
                    <span>{t.pointsTracked ? `${t.doneSP} / ${t.totalSP}` : `${t.doneCount} / ${t.count}`}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface2 overflow-hidden">
                    <div className="h-full rounded-full bg-lime" style={{ width: `${t.pointsTracked && t.totalSP ? Math.round((100 * t.doneSP) / t.totalSP) : pct}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="text-center"><div className="text-xl font-black text-lime">{t.inProgressCount}</div><div className="text-muted text-[10px] uppercase font-bold tracking-widest">in progress</div></div>
                  <div className="text-center"><div className="text-xl font-black">{t.todoCount}</div><div className="text-muted text-[10px] uppercase font-bold tracking-widest">to do</div></div>
                  <div className="text-center"><div className="text-xl font-black">{t.doneCount}</div><div className="text-muted text-[10px] uppercase font-bold tracking-widest">done</div></div>
                </div>
                {!t.pointsTracked && <p className="text-muted text-[11px]">Story points aren&apos;t estimated on these tickets — tracking by ticket count.</p>}
              </div>

              {/* issues grouped by status */}
              {CAT_ORDER.map((cat) => {
                const rows = view.issues.filter((i) => i.category === cat);
                if (rows.length === 0) return null;
                return (
                  <section key={cat}>
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-2">{CAT_LABEL[cat] || cat} · {rows.length}</h2>
                    <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
                      {rows.map((i) => (
                        <a key={i.key} href={i.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-surface2 transition-colors">
                          <span className="text-[11px] font-black text-lime shrink-0 w-16">{i.key}</span>
                          <div className="flex-1 min-w-0">
                            <div className="truncate text-sm font-medium">{i.summary}</div>
                            <div className="text-muted text-[10px] uppercase font-bold tracking-wide">{i.type}</div>
                          </div>
                          {i.points != null && <span className="shrink-0 text-[11px] font-black uppercase bg-surface2 border border-line rounded-md px-2 py-1">{i.points} pt</span>}
                          <span className="text-muted text-[10px] uppercase font-bold shrink-0">{i.status}</span>
                        </a>
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          );
        })()
      )}
    </div>
  );
}
