import Link from "next/link";
import type { Recommendation } from "@/lib/api";
import { RiskBadge } from "@/components/RiskBadge";

export function RecommendationCard({
  recommendation,
  showAssetLink = true,
  children,
}: {
  recommendation: Recommendation;
  showAssetLink?: boolean;
  children?: React.ReactNode;
}) {
  const r = recommendation;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-zinc-950 dark:text-zinc-50">{r.recommendation}</p>
        <RiskBadge level={r.priority} />
      </div>
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
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Confidence: {r.confidence_pct}%</span>
        {showAssetLink && (
          <Link href={`/assets/${r.asset_id}`} className="hover:underline">
            View asset &rarr;
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
