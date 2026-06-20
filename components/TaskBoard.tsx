import { TaskRow } from "./TaskRow";
import type { getDashboard } from "@/lib/planner";

type Dash = Awaited<ReturnType<typeof getDashboard>>;
type Task = Dash["todays"][number];

function serialize(t: Task) {
  return {
    id: t.id,
    status: t.status,
    count: t.count,
    date: t.date,
    carriedFrom: t.carriedFrom,
    note: t.note,
    activity: {
      name: t.activity.name,
      area: t.activity.area,
      icon: t.activity.icon,
      type: t.activity.type,
      targetCount: t.activity.targetCount,
      minCount: t.activity.minCount,
      durationMin: t.activity.durationMin,
    },
    item: t.item ? { title: t.item.title, url: t.item.url } : null,
    batch: t.batch ?? [],
  };
}

export function TaskBoard({
  todays,
  backlog,
  emptyHint = "Nothing scheduled yet. Add activities in Manage.",
}: {
  todays: Task[];
  backlog: Task[];
  emptyHint?: string;
}) {
  return (
    <div className="space-y-8">
      {backlog.length > 0 && (
        <section>
          <h2 className="text-hot text-sm font-black uppercase tracking-widest mb-3">Backlog · {backlog.length}</h2>
          <div className="rounded-2xl border border-line overflow-hidden divide-y divide-line bg-surface">
            {backlog.map((t) => (
              <TaskRow key={t.id} task={serialize(t)} overdue />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="rounded-2xl border border-line overflow-hidden divide-y divide-line bg-surface">
          {todays.length === 0 && <div className="p-6 text-muted text-sm">{emptyHint}</div>}
          {todays.map((t) => (
            <TaskRow key={t.id} task={serialize(t)} />
          ))}
        </div>
      </section>
    </div>
  );
}
