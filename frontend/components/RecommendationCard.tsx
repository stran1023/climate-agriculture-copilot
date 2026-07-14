"use client";

import { useState } from "react";
import Link from "next/link";
import type { Recommendation } from "@/lib/api";
import { RiskBadge } from "@/components/RiskBadge";

/** Collapsed by default (feat-036): only the action text + priority
 * badge show at a glance. Reason/Evidence/Expected-impact/Confidence --
 * the dense, report-like part of the card -- sit behind a per-card
 * "View details" toggle. Approve/Reject and asset-link actions (passed
 * in as children / showAssetLink) stay visible regardless of collapse
 * state, since they're actions, not explanatory text. */
export function RecommendationCard({
  recommendation,
  showAssetLink = true,
  children,
}: {
  recommendation: Recommendation;
  showAssetLink?: boolean;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const r = recommendation;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-zinc-950 dark:text-zinc-50">{r.recommendation}</p>
        <RiskBadge level={r.priority} />
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="self-start text-xs font-medium text-zinc-500 hover:underline dark:text-zinc-400"
      >
        {expanded ? "Hide details" : "View details"}
      </button>

      {expanded && (
        <>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold">Reason: </span>
            {r.reason}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold">Evidence: </span>
            {r.evidence}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold">Expected impact: </span>
            {r.expected_impact}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Confidence: {r.confidence_pct}%</p>
        </>
      )}

      {showAssetLink && (
        <div className="flex items-center justify-end text-xs text-zinc-500 dark:text-zinc-400">
          <Link href={`/assets/${r.asset_id}`} className="hover:underline">
            View asset &rarr;
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
