"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type BatchItem = { id: string; title: string; url: string | null };
type Task = {
  id: string;
  status: string;
  count: number;
  date: string;
  carriedFrom: string | null;
  note?: string | null;
  activity: {
    name: string;
    area: string;
    icon?: string | null;
    link?: string | null;
    type?: string;
    targetCount: number;
    minCount: number | null;
    durationMin?: number | null;
  };
  item: { title: string; url: string | null } | null;
  batch?: BatchItem[];
};

export function TaskRow({ task, overdue = false }: { task: Task; overdue?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(task.note ?? "");

  const done = task.status === "DONE";
  const target = task.activity.targetCount ?? 1;
  const counted = target > 1;
  const batch = task.batch ?? [];
  const isContent = task.activity.type === "PROBLEMS" || task.activity.type === "VIDEO";
  // With a content batch, the row header is the activity; otherwise the single item.
  const title = batch.length ? task.activity.name : task.item?.title || task.activity.name;
  // Open target: the day's item link, else the activity's quick-open link.
  const url = batch.length ? undefined : task.item?.url ?? task.activity.link ?? undefined;

  const act = (action: string, itemId?: string) =>
    start(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, itemId }),
      });
      router.refresh();
    });

  const saveNote = () =>
    start(async () => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "note", note }),
      });
      setNoteOpen(false);
      router.refresh();
    });

  return (
    <div className={`px-4 py-3.5 ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3">
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
          <div className={`font-bold text-[15px] truncate ${done ? "line-through text-muted" : ""}`}>
            {task.activity.icon ? <span className="mr-1.5">{task.activity.icon}</span> : null}
            {url ? (
              <a href={url} target="_blank" rel="noreferrer" className="hover:text-lime transition-colors">
                {title}
              </a>
            ) : (
              title
            )}
          </div>
          <div className="text-muted text-[11px] font-semibold mt-0.5 uppercase tracking-wide">
            {!batch.length && task.activity.name !== title ? `${task.activity.name} · ` : ""}
            {task.activity.area}
            {counted && ` · ${task.count}/${target}${task.activity.minCount ? ` (min ${task.activity.minCount})` : ""}`}
            {task.activity.durationMin ? ` · ${task.activity.durationMin} min` : ""}
            {overdue && ` · overdue ${task.date}`}
          </div>
        </div>

        {url && (
          <a href={url} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] font-black uppercase bg-lime/15 text-lime border border-lime/30 rounded-md px-2.5 py-1.5">
            Open ▶
          </a>
        )}
        {counted && !done && !batch.length && (
          <button onClick={() => act("increment")} className="shrink-0 text-[11px] font-black bg-surface2 border border-line rounded-md px-2.5 py-1.5 hover:border-lime transition-colors">
            +1
          </button>
        )}
        <button onClick={() => setNoteOpen((o) => !o)} className="shrink-0 text-sm text-muted hover:text-lime px-1" title="Note" aria-label="Note">
          📝
        </button>
      </div>

      {noteOpen && (
        <div className="mt-2 ml-10 flex gap-2">
          <input
            className="flex-1 bg-surface2 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-lime"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            onKeyDown={(e) => e.key === "Enter" && saveNote()}
            autoFocus
          />
          <button onClick={saveNote} className="bg-lime text-ground font-black uppercase text-[11px] px-3 rounded-md">Save</button>
        </div>
      )}
      {!noteOpen && task.note && <div className="mt-1.5 ml-10 text-muted text-xs italic">📝 {task.note}</div>}

      {/* content batch: today's specific items, each tappable + checkable */}
      {batch.length > 0 && !done && (
        <div className="mt-2.5 ml-10 space-y-1.5">
          {batch.map((it) => (
            <div key={it.id} className="flex items-center gap-2.5">
              <button
                aria-label="Mark item done"
                onClick={() => act("completeItem", it.id)}
                className="size-5 rounded border-2 border-line hover:border-lime grid place-items-center shrink-0 text-[10px] font-black text-transparent"
              >
                ✓
              </button>
              {it.url ? (
                <a href={it.url} target="_blank" rel="noreferrer" className="text-sm truncate hover:text-lime transition-colors flex-1">
                  {it.title}
                </a>
              ) : (
                <span className="text-sm truncate flex-1">{it.title}</span>
              )}
              {it.url && (
                <a href={it.url} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] font-black uppercase text-lime/80 hover:text-lime">
                  open ▶
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {isContent && batch.length === 0 && !done && (
        <div className="mt-1.5 ml-10 text-muted text-[11px]">Queue empty — add content in Manage.</div>
      )}
    </div>
  );
}
