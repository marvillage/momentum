import { dowOf } from "@/lib/date";
import type { HeatCell } from "@/lib/stats";

export function Heatmap({ data }: { data: HeatCell[] }) {
  const padStart = data.length ? dowOf(data[0].date) - 1 : 0;
  const cells: (HeatCell | null)[] = [...Array(padStart).fill(null), ...data];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "repeat(7, 1fr)",
        gridAutoFlow: "column",
        gap: "3px",
      }}
    >
      {cells.map((c, i) =>
        c ? (
          <div
            key={c.date}
            title={`${c.date}: ${c.done}/${c.total} done`}
            className="size-3 rounded-sm"
            style={{ background: c.total ? `rgba(198,248,51,${0.18 + 0.82 * c.ratio})` : "#1b1b1e" }}
          />
        ) : (
          <div key={`pad-${i}`} className="size-3" />
        )
      )}
    </div>
  );
}
