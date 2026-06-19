"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type Task = {
  id: string;
  status: string;
  count: number;
  date: string;
  carriedFrom: string | null;
  activity: {
    name: string;
    area: string;
    targetCount: number;
    minCount: number | null;
  };
  item: { title: string; url: string | null } | null;
};

export function TaskRow({ task, overdue = false }: { task: Task; overdue?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const done = task.status === "DONE";
  const target = task.activity.targetCount ?? 1;
  const counted = target > 1;
  const title = task.item?.title || task.activity.name;
  const url = task.item?.url;

  const act = (action: string) =>
    start(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    });

  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${pending ? "opacity-50" : ""}`}>
      <button
        aria-label={done ? "Mark not done" : "Mark done"}
        onClick={() => act(done ? "reset" : "done")}
        className={`size-7 rounded-lg border-2 grid place-items-center shrink-0 text-sm font-black transition-colors ${
          done ? "bg-lime border-lime text-ground" : "border-line text-transparent hover:border-muted"
        }`}
      >
        ✓
      </button>

      <div className="min-w-0 flex-1">
        <div className={`font-bold text-[15px] truncate ${done ? "line-through text-muted" : ""}`}>{title}</div>
        <div className="text-muted text-[11px] font-semibold mt-0.5 uppercase tracking-wide">
          {task.activity.name !== title ? `${task.activity.name} · ` : ""}
          {task.activity.area}
          {counted && ` · ${task.count}/${target}${task.activity.minCount ? ` (min ${task.activity.minCount})` : ""}`}
          {overdue && ` · overdue ${task.date}`}
        </div>
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-[11px] font-black uppercase bg-lime/15 text-lime border border-lime/30 rounded-md px-2.5 py-1.5"
        >
          Open ▶
        </a>
      )}
      {counted && !done && (
        <button
          onClick={() => act("increment")}
          className="shrink-0 text-[11px] font-black bg-surface2 border border-line rounded-md px-2.5 py-1.5 hover:border-lime transition-colors"
        >
          +1
        </button>
      )}
    </div>
  );
}
