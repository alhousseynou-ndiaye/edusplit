"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AllowedStatus = "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export default function AdminActions({
  applicationId,
  currentStatus,
  initialNotes,
}: {
  applicationId: string;
  currentStatus: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes || "");
  const [loading, setLoading] = useState<AllowedStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function updateStatus(status: AllowedStatus) {
    setLoading(status);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/admin/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNotes: notes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error || "Failed to update application status.");
        setLoading(null);
        return;
      }

      setSuccess(`Application moved to ${status.replaceAll("_", " ")}.`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Unexpected error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        Admin actions
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Update the application status and store internal notes.
      </p>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <span className="text-slate-500">Current status: </span>
        <span className="font-medium text-slate-900">{currentStatus}</span>
      </div>

      <div className="mt-5">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">
            Admin notes
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Add internal comments about the application..."
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
          />
        </label>
      </div>

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

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => updateStatus("UNDER_REVIEW")}
          disabled={loading !== null}
          className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-60"
        >
          {loading === "UNDER_REVIEW" ? "Updating..." : "Move to review"}
        </button>

        <button
          type="button"
          onClick={() => updateStatus("APPROVED")}
          disabled={loading !== null}
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
        >
          {loading === "APPROVED" ? "Updating..." : "Approve"}
        </button>

        <button
          type="button"
          onClick={() => updateStatus("REJECTED")}
          disabled={loading !== null}
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
        >
          {loading === "REJECTED" ? "Updating..." : "Reject"}
        </button>
      </div>
    </div>
  );
}