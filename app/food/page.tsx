import { getFoodDay, BUCKETS } from "@/lib/food";
import { FoodClient } from "@/components/FoodClient";
import { niceDate, todayStr } from "@/lib/date";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function FoodPage() {
  const user = await requireUser();
  const day = await getFoodDay(user.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lime text-xs font-black uppercase tracking-[0.2em] mb-2">🍽 Fuel</p>
        <h1 className="text-5xl font-black uppercase tracking-tight">Food</h1>
        <p className="text-muted mt-2 text-sm font-bold uppercase tracking-wide">{niceDate(todayStr())}</p>
      </div>

      <FoodClient
        logs={day.logs.map((l) => ({ id: l.id, bucket: l.bucket, name: l.name, kcal: l.kcal, protein: l.protein }))}
        kcal={day.kcal}
        protein={day.protein}
        kcalTarget={day.kcalTarget}
        proteinTarget={day.proteinTarget}
        buckets={BUCKETS.map((b) => ({ key: b.key, label: b.label }))}
        current={day.current}
        loggedBuckets={[...day.loggedBuckets]}
      />
    </div>
  );
}
