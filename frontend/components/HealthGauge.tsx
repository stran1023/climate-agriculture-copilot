"use client";

/** A 0-100 radial gauge for the farm health score (feat-037) -- a pure
 * visual read of the current value (no history needed), plus an
 * optional trend arrow computed elsewhere and passed in. */

const SIZE = 96;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function gaugeColor(score: number): string {
  if (score >= 75) return "#059669"; // emerald-600
  if (score >= 45) return "#d97706"; // amber-600
  return "#dc2626"; // red-600
}

export function HealthGauge({
  score,
  trend,
}: {
  score: number;
  trend?: "up" | "down" | "flat" | null;
}) {
  const pct = Math.max(0, Math.min(100, score));
  const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const color = gaugeColor(pct);

  return (
    <div className="relative flex h-24 w-24 items-center justify-center" role="img" aria-label={`Farm health score ${Math.round(pct)} out of 100`}>
      <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-zinc-200 dark:text-zinc-800"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {Math.round(pct)}
        </span>
        {trend && trend !== "flat" && (
          <span
            className={`text-xs font-semibold ${
              trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            }`}
            aria-hidden
          >
            {trend === "up" ? "▲" : "▼"}
          </span>
        )}
        {trend === "flat" && (
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500" aria-hidden>
            ■
          </span>
        )}
      </div>
    </div>
  );
}
