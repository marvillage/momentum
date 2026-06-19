import { ensureToday, getDashboard } from "@/lib/planner";
import { TaskRow } from "@/components/TaskRow";
import { todayStr, niceDate } from "@/lib/date";

export const dynamic = "force-dynamic";

function serialize(t: Awaited<ReturnType<typeof getDashboard>>["todays"][number]) {
  return {
    id: t.id,
    status: t.status,
    count: t.count,
    date: t.date,
    carriedFrom: t.carriedFrom,
    activity: {
      name: t.activity.name,
      area: t.activity.area,
      targetCount: t.activity.targetCount,
      minCount: t.activity.minCount,
    },
    item: t.item ? { title: t.item.title, url: t.item.url } : null,
  };
}

export default async function Home() {
  await ensureToday();
  const { todays, backlog } = await getDashboard();
  const doneCount = todays.filter((t) => t.status === "DONE").length;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">Your day</p>
        <h1 className="text-5xl font-black uppercase tracking-tight">Today</h1>
        <p className="text-muted mt-2 text-sm font-bold uppercase tracking-wide">
          {niceDate(todayStr())} · {doneCount} of {todays.length} done
        </p>
      </section>

      {backlog.length > 0 && (
        <section>
          <h2 className="text-hot text-sm font-black uppercase tracking-widest mb-3">
            Backlog · {backlog.length}
          </h2>
          <div className="rounded-2xl border border-line overflow-hidden divide-y divide-line bg-surface">
            {backlog.map((t) => (
              <TaskRow key={t.id} task={serialize(t)} overdue />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="rounded-2xl border border-line overflow-hidden divide-y divide-line bg-surface">
          {todays.length === 0 && (
            <div className="p-6 text-muted text-sm">Nothing scheduled yet. Add activities in Manage.</div>
          )}
          {todays.map((t) => (
            <TaskRow key={t.id} task={serialize(t)} />
          ))}
        </div>
      </section>
    </div>
  );
}
