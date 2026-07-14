"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary } from "@/lib/api";
import { useApiData } from "@/lib/useApiData";
import { healthScoreTrend } from "@/lib/dataCache";
import { Card } from "@/components/Card";
import { RiskBadge } from "@/components/RiskBadge";
import { RecommendationCard } from "@/components/RecommendationCard";
import { HealthGauge } from "@/components/HealthGauge";

function healthColor(score: number) {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 45) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function DashboardPanel({
  onSelectAsset,
  onHighlightAsset,
}: {
  onSelectAsset: (assetId: string) => void;
  onHighlightAsset?: (assetId: string | null) => void;
}) {
  const { data: summary, error } = useApiData("dashboard-summary", getDashboardSummary);
  const highlight = onHighlightAsset ?? (() => {});
  const [trend, setTrend] = useState<"up" | "down" | "flat" | null>(null);

  useEffect(() => {
    const score = summary?.farm_health_score;
    if (score === undefined) return;
    // Deferred via microtask (matches useApiData's fix for the same
    // lint rule) so this isn't a synchronous setState-in-effect call.
    Promise.resolve().then(() => setTrend(healthScoreTrend(score)));
  }, [summary?.farm_health_score]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">Farm dashboard</h1>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {!summary && !error && <p className="text-zinc-500">Loading dashboard…</p>}

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="mb-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Farm health score</p>
              <HealthGauge score={summary.farm_health_score} trend={trend} />
            </Card>
            <Card>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Active alerts</p>
              <p className="text-4xl font-bold text-zinc-950 dark:text-zinc-50">
                {summary.active_alerts.length}
              </p>
            </Card>
            <Card>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Tasks due today</p>
              <p className="text-4xl font-bold text-zinc-950 dark:text-zinc-50">
                {summary.tasks_due_today.length}
              </p>
            </Card>
          </div>

          {summary.weather && (
            <Card>
              <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Weather</p>
              <div className="flex items-end gap-4">
                <div className="flex items-baseline gap-1.5">
                  <span aria-hidden className="text-2xl">
                    🌡️
                  </span>
                  <span className="text-4xl font-bold text-zinc-950 dark:text-zinc-50">
                    {summary.weather.temp_c.toFixed(1)}°C
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>💧 {summary.weather.humidity_pct.toFixed(0)}% humidity</span>
                  <span>🌧️ {summary.weather.rainfall_mm.toFixed(1)} mm rain</span>
                  <span>💨 {summary.weather.wind_speed_kmh.toFixed(0)} km/h wind</span>
                </div>
              </div>
            </Card>
          )}

          {summary.active_alerts.length > 0 && (
            <Card>
              <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Active alerts</p>
              <div className="flex flex-col">
                {summary.active_alerts.map((alert) => (
                  <div
                    key={`${alert.asset_id}-${alert.risk_type}`}
                    onMouseEnter={() => highlight(alert.asset_id)}
                    onMouseLeave={() => highlight(null)}
                    className="flex items-start justify-between gap-3 border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectAsset(alert.asset_id)}
                        className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                      >
                        {alert.asset_id}
                      </button>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{alert.notes}</p>
                    </div>
                    <RiskBadge level={alert.risk_level} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Daily recommendations
            </p>
            {summary.top_recommendations.length === 0 ? (
              <p className="text-sm text-zinc-500">No pending recommendations.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {summary.top_recommendations.map((rec) => (
                  <div
                    key={rec.recommendation_id}
                    onMouseEnter={() => highlight(rec.asset_id)}
                    onMouseLeave={() => highlight(null)}
                  >
                    <RecommendationCard recommendation={rec} showAssetLink={false}>
                      <button
                        type="button"
                        onClick={() => onSelectAsset(rec.asset_id)}
                        className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
                      >
                        View asset &rarr;
                      </button>
                    </RecommendationCard>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Asset status overview
            </p>
            <div className="grid grid-cols-2 gap-3">
              {summary.assets.map((asset) => (
                <button
                  key={asset.asset_id}
                  type="button"
                  onClick={() => onSelectAsset(asset.asset_id)}
                  className="rounded-lg border border-zinc-200 p-3 text-center hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{asset.name}</p>
                  <p className={`text-2xl font-bold ${healthColor(asset.health_score)}`}>
                    {asset.health_score}
                  </p>
                  <p className="text-xs capitalize text-zinc-500 dark:text-zinc-400">
                    {asset.status.replace("_", " ")}
                  </p>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
