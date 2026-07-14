"use client";

import type { AssetOverview } from "@/lib/api";

const RING_BY_STATUS: Record<string, string> = {
  healthy: "ring-emerald-400",
  needs_attention: "ring-amber-400",
  critical: "ring-red-500 animate-pulse",
};

export function ChickenCoopMarker({ asset, isSelected }: { asset: AssetOverview; isSelected?: boolean }) {
  const ring = RING_BY_STATUS[asset.status] ?? RING_BY_STATUS.healthy;
  const isCritical = asset.status === "critical";

  return (
    <div
      className={`relative h-14 w-16 rounded-2xl bg-amber-50 shadow-lg ring-4 dark:bg-amber-950/60 ${ring} ${
        isSelected ? "outline outline-2 outline-offset-2 outline-blue-500" : ""
      }`}
    >
      {/* fenced yard floor */}
      <div className="absolute inset-x-1 bottom-1 h-6 rounded-md bg-amber-100/90 ring-1 ring-amber-800/40 dark:bg-amber-900/50 dark:ring-amber-600/30" />

      {/* coop building */}
      <div className="absolute left-1/2 top-1 -translate-x-1/2">
        <div className="mx-auto h-0 w-0 border-x-[13px] border-b-[9px] border-x-transparent border-b-red-700" />
        <div className="h-3.5 w-[26px] rounded-[1px] bg-white ring-1 ring-amber-800/50 dark:bg-zinc-200" />
      </div>

      {/* chickens */}
      {!isCritical && (
        <>
          <span
            className="absolute bottom-1.5 left-2.5 animate-[chicken-bob-a_1.8s_ease-in-out_infinite] text-xs"
            aria-hidden
          >
            🐔
          </span>
          <span
            className="absolute bottom-1.5 right-2 animate-[chicken-bob-b_2.1s_ease-in-out_infinite] text-xs"
            aria-hidden
          >
            🐔
          </span>
        </>
      )}

      {/* a couple of eggs -- decorative production indicator, not wired to
          an exact live egg_count (that reading isn't part of the map's
          AssetOverview data model, only shown once an asset is selected). */}
      {!isCritical && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px]" aria-hidden>
          🥚
        </span>
      )}
    </div>
  );
}
