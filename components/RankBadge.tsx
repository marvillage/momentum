import type { getGameState } from "@/lib/game";

type Game = Awaited<ReturnType<typeof getGameState>>;

export function RankBadge({ game, compact = false }: { game: Game; compact?: boolean }) {
  const { tier, pct, calibrating, nextTier, streak, level, xp, levelProgress, freezeLeft } = game;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-center gap-4">
        <div
          className="size-14 rounded-2xl grid place-items-center text-3xl shrink-0"
          style={{ backgroundColor: `${tier.color}22`, border: `1px solid ${tier.color}66` }}
        >
          {tier.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black uppercase tracking-tight" style={{ color: tier.color }}>
              {calibrating ? "Calibrating" : tier.label}
            </span>
            {!calibrating && <span className="text-muted text-sm font-bold">{pct}%</span>}
          </div>
          <div className="text-muted text-[11px] font-bold uppercase tracking-widest mt-0.5">
            {calibrating
              ? "Complete tasks to lock your rank"
              : nextTier
              ? `${nextTier.toGo}% to ${nextTier.tier.label}`
              : "Peak rank — keep it up 🔥"}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-black text-lime leading-none">{streak}🔥</div>
          <div className="text-muted text-[10px] font-bold uppercase tracking-widest mt-1">
            day streak{freezeLeft > 0 ? " · ❄️" : ""}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted mb-1.5">
            <span>Level {level}</span>
            <span>{xp.toLocaleString()} XP</span>
          </div>
          <div className="h-2 rounded-full bg-surface2 overflow-hidden">
            <div className="h-full rounded-full bg-lime" style={{ width: `${levelProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
