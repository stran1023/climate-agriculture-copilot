"use client";

// NOTE: this is a minimal compat patch (field renames only) to keep the
// build green after feat-013 rebuilt /briefing/today against
// RECOMMENDATIONS. The real Screen 5 rebuild (feat-019) will give this a
// proper design pass -- this file is intentionally left otherwise
// unchanged from the prior WORK_ORDERS-based version.

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBriefingToday, type BriefingToday, type Recommendation } from "@/lib/api";
import { Card } from "@/components/Card";

function RecommendationRow({
  recommendation,
  tone,
}: {
  recommendation: Recommendation;
  tone: "approved" | "rejected";
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800">
      <div>
        <Link
          href={`/assets/${recommendation.asset_id}`}
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
        >
          Asset {recommendation.asset_id}
        </Link>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{recommendation.recommendation}</p>
      </div>
      <div className="text-right text-sm">
        <span
          className={
            tone === "approved"
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-red-700 dark:text-red-300"
          }
        >
          {tone === "approved" ? "Approved" : "Rejected"}
        </span>
        {recommendation.approved_by && (
          <p className="text-zinc-500 dark:text-zinc-400">by {recommendation.approved_by}</p>
        )}
      </div>
    </div>
  );
}

export default function BriefingPage() {
  const [briefing, setBriefing] = useState<BriefingToday | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBriefingToday()
      .then(setBriefing)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        Daily briefing
      </h1>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {!briefing && !error && <p className="text-zinc-500">Loading briefing…</p>}

      {briefing && (
        <>
          <Card>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              <span aria-hidden>📋</span>
              {new Date(briefing.date).toLocaleDateString()}
            </div>
            <p className="whitespace-pre-line text-zinc-800 dark:text-zinc-200">
              {briefing.summary}
            </p>
          </Card>

          <Card>
            <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Approved ({briefing.approved_recommendations.length})
            </p>
            {briefing.approved_recommendations.length === 0 ? (
              <p className="text-sm text-zinc-500">None yet today.</p>
            ) : (
              briefing.approved_recommendations.map((rec) => (
                <RecommendationRow key={rec.recommendation_id} recommendation={rec} tone="approved" />
              ))
            )}
          </Card>

          <Card>
            <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Rejected ({briefing.rejected_recommendations.length})
            </p>
            {briefing.rejected_recommendations.length === 0 ? (
              <p className="text-sm text-zinc-500">None yet today.</p>
            ) : (
              briefing.rejected_recommendations.map((rec) => (
                <RecommendationRow key={rec.recommendation_id} recommendation={rec} tone="rejected" />
              ))
            )}
          </Card>
        </>
      )}
    </div>
  );
}
