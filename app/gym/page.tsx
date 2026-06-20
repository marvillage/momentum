import { prisma } from "@/lib/db";
import { GymClient } from "@/components/GymClient";
import { todayStr, dowOf } from "@/lib/date";
import { DOW } from "@/lib/constants";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GymPage() {
  const user = await requireUser();
  const today = dowOf(todayStr());
  const todayDate = todayStr();
  const [exercises, weights, ratings] = await Promise.all([
    prisma.gymExercise.findMany({ where: { userId: user.id }, orderBy: [{ dow: "asc" }, { order: "asc" }] }),
    prisma.bodyWeight.findMany({ where: { userId: user.id }, orderBy: { date: "asc" }, take: 60 }),
    prisma.workoutRating.findMany({ where: { userId: user.id }, orderBy: { date: "desc" }, take: 30 }),
  ]);
  const todayLabel = DOW.find((d) => d.n === today)?.label ?? "";
  const todayRating = ratings.find((r) => r.date === todayDate)?.intensity ?? null;

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
        todayRating={todayRating}
        ratings={ratings.map((r) => ({ date: r.date, intensity: r.intensity }))}
      />
    </div>
  );
}
