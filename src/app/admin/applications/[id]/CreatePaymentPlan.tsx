"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePaymentPlan({
  applicationId,
  status,
  hasPaymentPlan,
  financedAmount,
}: {
  applicationId: string;
  status: string;
  hasPaymentPlan: boolean;
  financedAmount: number;
}) {
  const router = useRouter();
  const [numberOfInstallments, setNumberOfInstallments] = useState("3");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const monthlyEstimate = useMemo(() => {
    const count = Number(numberOfInstallments);
    if (!count || !financedAmount) return 0;
    return Math.ceil(financedAmount / count);
  }, [numberOfInstallments, financedAmount]);

  async function handleCreatePlan() {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `/api/admin/applications/${applicationId}/payment-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numberOfInstallments: Number(numberOfInstallments),
            startDate: new Date(startDate).toISOString(),
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Failed to create payment plan.");
        setLoading(false);
        return;
      }

      setSuccess("Payment plan created successfully.");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const disabled = status !== "APPROVED" || hasPaymentPlan;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Create payment plan
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Create the repayment schedule once the application has been approved.
      </p>

      <div className="mt-5 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Application status</span>
            <span className="font-medium text-slate-900">{status}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-slate-500">Financed amount</span>
            <span className="font-medium text-slate-900">
              {new Intl.NumberFormat("fr-FR").format(financedAmount)} XOF
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-slate-500">Estimated installment</span>
            <span className="font-medium text-slate-900">
              {new Intl.NumberFormat("fr-FR").format(monthlyEstimate)} XOF
            </span>
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">
            Number of installments
          </span>
          <select
            value={numberOfInstallments}
            onChange={(e) => setNumberOfInstallments(e.target.value)}
            disabled={disabled || loading}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
          >
            <option value="2">2 installments</option>
            <option value="3">3 installments</option>
            <option value="4">4 installments</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">
            First due date
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={disabled || loading}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
          />
        </label>
      </div>

      {status !== "APPROVED" && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          The application must be approved before creating a payment plan.
        </div>
      )}

      {hasPaymentPlan && (
        <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          A payment plan already exists for this application.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={handleCreatePlan}
          disabled={disabled || loading}
          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create payment plan"}
        </button>
      </div>
    </div>
  );
}
