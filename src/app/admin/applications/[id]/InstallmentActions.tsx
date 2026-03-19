"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AllowedInstallmentStatus = "PENDING" | "PAID" | "LATE";

export default function InstallmentActions({
  installmentId,
  currentStatus,
}: {
  installmentId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<AllowedInstallmentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateInstallmentStatus(status: AllowedInstallmentStatus) {
    setLoading(status);
    setError(null);

    try {
      const res = await fetch(`/api/admin/installments/${installmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Failed to update installment.");
        setLoading(null);
        return;
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateInstallmentStatus("PAID")}
          disabled={loading !== null || currentStatus === "PAID"}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "PAID" ? "Saving..." : "Mark paid"}
        </button>

        <button
          type="button"
          onClick={() => updateInstallmentStatus("LATE")}
          disabled={loading !== null || currentStatus === "LATE"}
          className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "LATE" ? "Saving..." : "Mark late"}
        </button>

        <button
          type="button"
          onClick={() => updateInstallmentStatus("PENDING")}
          disabled={loading !== null || currentStatus === "PENDING"}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === "PENDING" ? "Saving..." : "Reset pending"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}