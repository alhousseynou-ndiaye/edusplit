import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getLateCount,
  getNextDueInstallment,
  getPaidRatio,
  getRemainingBalance,
  getRepaymentHealthClasses,
  getRepaymentHealthStatus,
  humanizeRepaymentHealthStatus,
} from "@/lib/repayment";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value) + " XOF";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatShortDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(value);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "WAITING_GUARANTOR":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "UNDER_REVIEW":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";
    case "WAITING_DOCUMENTS":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "CANCELED":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function humanizeStatus(status: string) {
  const map: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    UNDER_REVIEW: "Under review",
    WAITING_GUARANTOR: "Waiting guarantor",
    WAITING_DOCUMENTS: "Waiting documents",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    CANCELED: "Canceled",
  };

  return map[status] || status;
}

function humanizeCollectionStage(stage: string | null | undefined) {
  if (!stage) return "-";

  const map: Record<string, string> = {
    NONE: "None",
    SOFT_COLLECTION: "Soft collection",
    ESCALATED: "Escalated",
    RESOLVED: "Resolved",
  };

  return map[stage] || stage;
}

function humanizeContactStatus(status: string | null | undefined) {
  if (!status) return "-";

  const map: Record<string, string> = {
    NOT_CONTACTED: "Not contacted",
    CONTACT_ATTEMPTED: "Contact attempted",
    REACHED: "Reached",
    NO_RESPONSE: "No response",
    PROMISE_TO_PAY: "Promise to pay",
    DISPUTE: "Dispute",
    REFUSED: "Refused",
    RESOLVED: "Resolved",
  };

  return map[status] || status;
}

function humanizeCollectionPriority(priority: string | null | undefined) {
  if (!priority) return "-";

  const map: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  };

  return map[priority] || priority;
}

function humanizeNextActionType(type: string | null | undefined) {
  if (!type) return "-";

  const map: Record<string, string> = {
    CALL: "Call",
    WHATSAPP: "WhatsApp",
    SMS: "SMS",
    EMAIL: "Email",
    FOLLOW_UP: "Follow-up",
    ESCALATE: "Escalate",
    NONE: "None",
  };

  return map[type] || type;
}

function getCollectionStageClasses(stage: string | null | undefined) {
  switch (stage) {
    case "SOFT_COLLECTION":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "ESCALATED":
      return "bg-red-50 text-red-700 border-red-200";
    case "RESOLVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "NONE":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getCollectionPriorityClasses(priority: string | null | undefined) {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-50 text-red-700 border-red-200";
    case "HIGH":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "MEDIUM":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "LOW":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function isActionDueTodayOrOverdue(value: Date | null | undefined) {
  if (!value) return false;

  const today = new Date();
  const actionDate = new Date(value);

  today.setHours(0, 0, 0, 0);
  actionDate.setHours(0, 0, 0, 0);

  return actionDate <= today;
}

export default async function AdminApplicationsPage() {
  const applications = await prisma.application.findMany({
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    include: {
      product: true,
      guarantor: true,
      collectionCase: true,
      paymentPlan: {
        include: {
          installments: true,
        },
      },
    },
  });

  const totalApplications = applications.length;
  const submittedCount = applications.filter(
    (app) => app.status === "SUBMITTED"
  ).length;
  const waitingGuarantorCount = applications.filter(
    (app) => app.status === "WAITING_GUARANTOR"
  ).length;
  const approvedCount = applications.filter(
    (app) => app.status === "APPROVED"
  ).length;

  const atRiskCount = applications.filter((app) => {
    const installments = app.paymentPlan?.installments ?? [];
    if (installments.length === 0) return false;
    return getRepaymentHealthStatus(installments) === "AT_RISK";
  }).length;

  const collectionsOpenCount = applications.filter(
    (app) =>
      app.collectionCase &&
      app.collectionCase.stage !== "RESOLVED" &&
      app.collectionCase.resolutionStatus !== "CLOSED"
  ).length;

  const followUpTodayCount = applications.filter((app) =>
    isActionDueTodayOrOverdue(app.collectionCase?.nextActionDate)
  ).length;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm">
            Admin
          </span>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
            Applications dashboard
          </h1>

          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Review incoming applications, monitor portfolio health, and surface
            collection actions that require operational follow-up.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-6">
          <StatCard label="Total applications" value={String(totalApplications)} />
          <StatCard label="Submitted" value={String(submittedCount)} />
          <StatCard label="Waiting guarantor" value={String(waitingGuarantorCount)} />
          <StatCard label="Approved" value={String(approvedCount)} />
          <StatCard label="At risk" value={String(atRiskCount)} />
          <StatCard label="Follow-up due" value={String(followUpTodayCount)} />
        </div>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Collections queue signals
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Quick visibility on active recovery workload across the portfolio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <QueueBadge label="Open cases" value={String(collectionsOpenCount)} />
              <QueueBadge label="Follow-up due" value={String(followUpTodayCount)} />
              <QueueBadge label="Accounts at risk" value={String(atRiskCount)} />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">
              All applications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest applications appear first, with repayment and recovery signals.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-base font-medium text-slate-900">
                No applications yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Once a user submits an application, it will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1800px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Applicant</th>
                    <th className="px-6 py-4 font-medium">Profile</th>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Down payment</th>
                    <th className="px-6 py-4 font-medium">Requested</th>
                    <th className="px-6 py-4 font-medium">Guarantor</th>
                    <th className="px-6 py-4 font-medium">Application status</th>
                    <th className="px-6 py-4 font-medium">Repayment health</th>
                    <th className="px-6 py-4 font-medium">Collection stage</th>
                    <th className="px-6 py-4 font-medium">Contact status</th>
                    <th className="px-6 py-4 font-medium">Priority</th>
                    <th className="px-6 py-4 font-medium">Next action</th>
                    <th className="px-6 py-4 font-medium">Next action date</th>
                    <th className="px-6 py-4 font-medium">Paid ratio</th>
                    <th className="px-6 py-4 font-medium">Remaining</th>
                    <th className="px-6 py-4 font-medium">Late count</th>
                    <th className="px-6 py-4 font-medium">Next due</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {applications.map((application) => {
                    const installments = application.paymentPlan?.installments ?? [];
                    const hasPlan = installments.length > 0;

                    const health = hasPlan
                      ? getRepaymentHealthStatus(installments)
                      : null;

                    const remaining = hasPlan
                      ? getRemainingBalance(installments)
                      : null;

                    const paidRatio = hasPlan ? getPaidRatio(installments) : null;
                    const lateCount = hasPlan ? getLateCount(installments) : null;
                    const nextDue = hasPlan
                      ? getNextDueInstallment(installments)
                      : null;

                    const collectionCase = application.collectionCase;
                    const actionDue = isActionDueTodayOrOverdue(
                      collectionCase?.nextActionDate
                    );

                    return (
                      <tr key={application.id} className="hover:bg-slate-50/80">
                        <td className="px-6 py-4 align-top">
                          <div className="font-medium text-slate-900">
                            {application.firstName} {application.lastName}
                          </div>
                          <div className="mt-1 text-slate-500">
                            {application.phone}
                          </div>
                          {application.email && (
                            <div className="text-slate-500">{application.email}</div>
                          )}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {application.applicantStatus}
                        </td>

                        <td className="px-6 py-4 align-top">
                          <div className="font-medium text-slate-900">
                            {application.product.name}
                          </div>
                          <div className="mt-1 text-slate-500">
                            {application.product.type}
                          </div>
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {formatCurrency(application.product.priceCents)}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {formatCurrency(application.availableDownPayment)}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {formatCurrency(application.requestedAmount)}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {application.guarantor
                            ? application.guarantor.fullName
                            : "No guarantor"}
                        </td>

                        <td className="px-6 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              application.status
                            )}`}
                          >
                            {humanizeStatus(application.status)}
                          </span>
                        </td>

                        <td className="px-6 py-4 align-top">
                          {health ? (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getRepaymentHealthClasses(
                                health
                              )}`}
                            >
                              {humanizeRepaymentHealthStatus(health)}
                            </span>
                          ) : (
                            <span className="text-slate-400">No plan</span>
                          )}
                        </td>

                        <td className="px-6 py-4 align-top">
                          {collectionCase ? (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getCollectionStageClasses(
                                collectionCase.stage
                              )}`}
                            >
                              {humanizeCollectionStage(collectionCase.stage)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {collectionCase
                            ? humanizeContactStatus(collectionCase.contactStatus)
                            : "-"}
                        </td>

                        <td className="px-6 py-4 align-top">
                          {collectionCase ? (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getCollectionPriorityClasses(
                                collectionCase.priority
                              )}`}
                            >
                              {humanizeCollectionPriority(collectionCase.priority)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {collectionCase
                            ? humanizeNextActionType(collectionCase.nextActionType)
                            : "-"}
                        </td>

                        <td className="px-6 py-4 align-top">
                          {collectionCase?.nextActionDate ? (
                            <span
                              className={
                                actionDue
                                  ? "font-medium text-red-700"
                                  : "text-slate-700"
                              }
                            >
                              {formatShortDate(collectionCase.nextActionDate)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {paidRatio !== null ? `${paidRatio}%` : "-"}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {remaining !== null ? formatCurrency(remaining) : "-"}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {lateCount !== null ? String(lateCount) : "-"}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-700">
                          {nextDue ? formatShortDate(nextDue.dueDate) : "-"}
                        </td>

                        <td className="px-6 py-4 align-top text-slate-500">
                          {formatDate(application.createdAt)}
                        </td>

                        <td className="px-6 py-4 align-top">
                          <Link
                            href={`/admin/applications/${application.id}`}
                            className="inline-flex rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            View file
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function QueueBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}