import { requireUser } from "@/lib/auth";
import { getSprintData } from "@/lib/jira";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = { new: "To do", indeterminate: "In progress", done: "Done" };
const CAT_ORDER = ["indeterminate", "new", "done"];

export default async function AecadPage() {
  await requireUser();
  const data = await getSprintData();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">📋 Work · ML</p>
        <h1 className="text-5xl font-black uppercase tracking-tight">AECAD</h1>
        <p className="text-muted mt-2 text-sm font-bold uppercase tracking-wide">Your Jira sprint</p>
      </div>

      {data.status === "unconfigured" ? (
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-lime">Connect Jira</h2>
          <p className="text-muted text-sm">Add these environment variables, then reload:</p>
          <pre className="bg-surface2 border border-line rounded-lg p-3 text-xs overflow-x-auto">
{`JIRA_EMAIL=you@aecad.ai
JIRA_API_TOKEN=<from id.atlassian.com/manage-profile/security/api-tokens>
# optional (defaults shown):
JIRA_BASE_URL=https://aecad.atlassian.net
JIRA_BOARD_ID=2`}
          </pre>
        </div>
      ) : data.status === "error" ? (
        <div className="rounded-2xl border border-hot/40 bg-hot/5 p-5">
          <p className="text-hot font-bold text-sm">Couldn&apos;t load Jira: {data.error}</p>
          <p className="text-muted text-xs mt-1">Check the API token and that your account can see board {process.env.JIRA_BOARD_ID || "2"}.</p>
        </div>
      ) : data.status === "no_sprint" ? (
        <div className="rounded-2xl border border-line bg-surface p-5 text-muted text-sm">No active sprint on the board right now.</div>
      ) : (
        <>
          {/* sprint summary */}
          <div className="rounded-2xl border border-line bg-surface p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-black text-lg truncate">{data.sprint.name}</div>
                {data.sprint.goal && <div className="text-muted text-xs mt-0.5">{data.sprint.goal}</div>}
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-black text-lime leading-none">{data.sprint.daysLeft ?? "—"}</div>
                <div className="text-muted text-[10px] font-bold uppercase tracking-widest mt-1">days left</div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted mb-1.5">
                <span>Story points</span>
                <span>{data.totals.doneSP} / {data.totals.totalSP} done</span>
              </div>
              <div className="h-2.5 rounded-full bg-surface2 overflow-hidden">
                <div className="h-full rounded-full bg-lime" style={{ width: `${data.totals.totalSP ? Math.round((100 * data.totals.doneSP) / data.totals.totalSP) : 0}%` }} />
              </div>
              <div className="text-muted text-[11px] mt-1.5">
                {data.totals.doneCount}/{data.totals.count} issues · {data.totals.inProgressSP} pts in progress
              </div>
            </div>
          </div>

          {/* issues grouped by status */}
          {CAT_ORDER.map((cat) => {
            const rows = data.issues.filter((i) => i.category === cat);
            if (rows.length === 0) return null;
            return (
              <section key={cat}>
                <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-2">
                  {CAT_LABEL[cat] || cat} · {rows.length}
                </h2>
                <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
                  {rows.map((i) => (
                    <a key={i.key} href={i.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-surface2 transition-colors">
                      <span className="text-[11px] font-black text-lime shrink-0 w-16">{i.key}</span>
                      <span className="flex-1 min-w-0 truncate text-sm font-medium">{i.summary}</span>
                      {i.points != null && (
                        <span className="shrink-0 text-[11px] font-black uppercase bg-surface2 border border-line rounded-md px-2 py-1">{i.points} pt</span>
                      )}
                      <span className="text-muted text-[10px] uppercase font-bold shrink-0">{i.status}</span>
                    </a>
                  ))}
                </div>
              </section>
            );
          })}
          {data.issues.length === 0 && (
            <div className="rounded-2xl border border-line bg-surface p-5 text-muted text-sm">No issues assigned to you in this sprint.</div>
          )}
        </>
      )}
    </div>
  );
}
