import type { RiskLevel } from "@/lib/api";

const STYLES: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const key = level.toLowerCase();
  const style = STYLES[key] ?? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style}`}>
      {level}
    </span>
  );
}
