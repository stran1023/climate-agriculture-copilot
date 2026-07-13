"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  approveWorkOrder,
  getPlotRisk,
  rejectWorkOrder,
  type PlotRisk,
} from "@/lib/api";
import { Card } from "@/components/Card";

const STATUS_STYLES: Record<string, string> = {
  pending_approval: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

export default function PlotRiskPage() {
  const params = useParams<{ id: string }>();
  const plotId = params.id;

  const [risk, setRisk] = useState<PlotRisk | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    getPlotRisk(plotId)
      .then(setRisk)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/param-change is intentional
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotId]);

  const handleApprove = async () => {
    if (!risk?.work_order) return;
    setActionPending(true);
    try {
      await approveWorkOrder(risk.work_order.work_order_id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionPending(false);
    }
  };

  const handleReject = async () => {
    if (!risk?.work_order) return;
    setActionPending(true);
    try {
      await rejectWorkOrder(risk.work_order.work_order_id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="text-sm text-zinc-600 hover:underline dark:text-zinc-400">
        &larr; Back to plots
      </Link>

      {loading && <p className="text-zinc-500">Loading risk assessment…</p>}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {risk && (
        <>
          <Card>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              <span aria-hidden>🌾</span>
              Cortex Agent risk assessment — Plot {risk.plot_id}
            </div>
            <p className="whitespace-pre-line text-zinc-800 dark:text-zinc-200">
              {risk.narrative}
            </p>
          </Card>

          <Card>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              <span aria-hidden>🛠️</span>
              Recommended work order
            </div>
            {risk.work_order ? (
              <div className="flex flex-col gap-3">
                <p className="text-zinc-800 dark:text-zinc-200">{risk.work_order.action}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                      STATUS_STYLES[risk.work_order.status] ?? ""
                    }`}
                  >
                    {risk.work_order.status.replace("_", " ")}
                  </span>
                  <span>Created {new Date(risk.work_order.created_at).toLocaleString()}</span>
                  {risk.work_order.approved_by && (
                    <span>
                      · {risk.work_order.status === "rejected" ? "Rejected" : "Approved"} by{" "}
                      {risk.work_order.approved_by}
                      {risk.work_order.approved_at &&
                        ` at ${new Date(risk.work_order.approved_at).toLocaleString()}`}
                    </span>
                  )}
                </div>

                {risk.work_order.status === "pending_approval" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleApprove}
                      disabled={actionPending}
                      className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={actionPending}
                      className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-500">No work order has been generated for this plot.</p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
