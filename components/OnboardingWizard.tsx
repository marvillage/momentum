"use client";

import { useState, useTransition } from "react";
import { NewActivity } from "@/components/NewActivity";
import { completeOnboarding } from "@/app/actions/auth";

type GroupOpt = { id: string; name: string; icon: string | null };
type TrackOpt = { key: string; name: string; blurb: string; type: string; count: number };
type Act = { id: string; name: string; icon: string | null; type: string };

export function OnboardingWizard({ name, groups, tracks, initial }: { name: string; groups: GroupOpt[]; tracks: TrackOpt[]; initial: Act[] }) {
  const [count, setCount] = useState(initial.length);
  const [, start] = useTransition();

  const finish = () => start(async () => { await completeOnboarding(); });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">Welcome{name ? `, ${name}` : ""}</p>
        <h1 className="text-4xl font-black uppercase tracking-tight">Set up your day</h1>
        <p className="text-muted mt-2 text-sm">
          Add the things you want to track — coding (auto-loads problem sets), a video course, gym, or any habit.
          Set how often and how much. You can always add more later in Manage.
        </p>
      </div>

      <NewActivity groups={groups} tracks={tracks} redirectOnCreate={false} onCreated={() => setCount((c) => c + 1)} />

      <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        {count === 0 ? "No activities yet — add at least one above to get going." : `${count} activit${count === 1 ? "y" : "ies"} added. Add more, or finish whenever you're ready.`}
      </div>

      <button
        onClick={finish}
        disabled={count === 0}
        className="w-full bg-lime text-ground font-black uppercase text-sm px-4 py-3 rounded-lg disabled:opacity-40"
      >
        {count === 0 ? "Add an activity to continue" : "Enter Momentum →"}
      </button>
    </div>
  );
}
