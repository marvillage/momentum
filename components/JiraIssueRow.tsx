"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Issue = {
  key: string;
  summary: string;
  type: string;
  status: string;
  points: number | null;
  epic: string | null;
  url: string;
  note?: string | null;
};

export function JiraIssueRow({ issue }: { issue: Issue }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(issue.note ?? "");

  const save = () =>
    start(async () => {
      await fetch("/api/jira/note", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ issueKey: issue.key, note }),
      });
      setEditing(false);
      router.refresh();
    });

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <a href={issue.url} target="_blank" rel="noreferrer" className="text-[11px] font-black text-lime shrink-0 w-16 hover:underline">
          {issue.key}
        </a>
        <div className="flex-1 min-w-0">
          <div className="truncate text-sm font-medium">{issue.summary}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-muted text-[10px] uppercase font-bold tracking-wide">{issue.type}</span>
            {issue.epic && <span className="text-[9px] font-black uppercase bg-surface2 border border-line rounded px-1.5 py-0.5 text-muted truncate max-w-[140px]">{issue.epic}</span>}
          </div>
        </div>
        {issue.points != null && <span className="shrink-0 text-[11px] font-black bg-surface2 border border-line rounded-md px-2 py-1">{issue.points}</span>}
        <span className="text-muted text-[10px] uppercase font-bold shrink-0">{issue.status}</span>
        <button onClick={() => setEditing((e) => !e)} className="shrink-0 text-sm text-muted hover:text-lime" title="Note">📝</button>
      </div>

      {editing ? (
        <div className="ml-[76px] flex gap-2">
          <input
            className="flex-1 bg-surface2 border border-line rounded-md px-2.5 py-1.5 text-sm outline-none focus:border-lime"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for this ticket…"
            onKeyDown={(e) => e.key === "Enter" && save()}
            autoFocus
          />
          <button onClick={save} className="bg-lime text-ground font-black uppercase text-[11px] px-3 rounded-md">Save</button>
        </div>
      ) : (
        issue.note && <div className="ml-[76px] text-muted text-xs italic">📝 {issue.note}</div>
      )}
    </div>
  );
}
