"use client";

import { useEffect, useState } from "react";
import { getAssets, type AssetOverview } from "@/lib/api";
import { DigitalTwinMap } from "@/components/DigitalTwinMap";

export default function DigitalTwinHome() {
  const [assets, setAssets] = useState<AssetOverview[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAssets()
      .then(setAssets)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Farm digital twin</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Hover an asset for its status, click to open its full dashboard.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {!assets && !error && <p className="text-zinc-500">Loading farm…</p>}
      {assets?.length === 0 && <p className="text-zinc-500">No farm assets found.</p>}

      {assets && assets.length > 0 && <DigitalTwinMap assets={assets} />}

      <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Healthy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Needs attention
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Critical
        </span>
      </div>
    </div>
  );
}
