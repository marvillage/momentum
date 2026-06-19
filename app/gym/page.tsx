import { prisma } from "@/lib/db";
import { GymClient } from "@/components/GymClient";
import { todayStr, dowOf } from "@/lib/date";
import { DOW } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function GymPage() {
  const today = dowOf(todayStr());
  const [exercises, weights] = await Promise.all([
    prisma.gymExercise.findMany({ orderBy: [{ dow: "asc" }, { order: "asc" }] }),
    prisma.bodyWeight.findMany({ orderBy: { date: "asc" }, take: 60 }),
  ]);
  const todayLabel = DOW.find((d) => d.n === today)?.label ?? "";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">Train</p>
        <h1 className="text-5xl font-black uppercase tracking-tight">Gym</h1>
        <p className="text-muted mt-2 text-sm font-bold uppercase tracking-wide">Today is {todayLabel}</p>
      </div>
      <GymClient
        today={today}
        exercises={exercises.map((e) => ({ ...e }))}
        weights={weights.map((w) => ({ date: w.date, kg: w.kg }))}
      />
    </div>
  );
}
