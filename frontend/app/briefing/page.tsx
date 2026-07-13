"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBriefingToday, type BriefingToday, type WorkOrder } from "@/lib/api";
import { Card } from "@/components/Card";

function WorkOrderRow({ workOrder, tone }: { workOrder: WorkOrder; tone: "approved" | "rejected" }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 py-2 last:border-0 dark:border-zinc-800">
      <div>
        <Link href={`/plots/${workOrder.farm_id}`} className="font-medium text-zinc-900 hover:underline dark:text-zinc-100">
          Plot {workOrder.farm_id}
        </Link>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{workOrder.action}</p>
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
        {workOrder.approved_by && (
          <p className="text-zinc-500 dark:text-zinc-400">by {workOrder.approved_by}</p>
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
              Approved ({briefing.approved_work_orders.length})
            </p>
            {briefing.approved_work_orders.length === 0 ? (
              <p className="text-sm text-zinc-500">None yet today.</p>
            ) : (
              briefing.approved_work_orders.map((wo) => (
                <WorkOrderRow key={wo.work_order_id} workOrder={wo} tone="approved" />
              ))
            )}
          </Card>

          <Card>
            <p className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Rejected ({briefing.rejected_work_orders.length})
            </p>
            {briefing.rejected_work_orders.length === 0 ? (
              <p className="text-sm text-zinc-500">None yet today.</p>
            ) : (
              briefing.rejected_work_orders.map((wo) => (
                <WorkOrderRow key={wo.work_order_id} workOrder={wo} tone="rejected" />
              ))
            )}
          </Card>
        </>
      )}
    </div>
  );
}
