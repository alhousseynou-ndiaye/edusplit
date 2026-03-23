import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminActions from "./AdminActions";
import CreatePaymentPlan from "./CreatePaymentPlan";
import InstallmentActions from "./InstallmentActions";
import CollectionActions from "./CollectionActions";
import {
  getLateCount,
  getNextDueInstallment,
  getPaidRatio,
  getRemainingBalance,
  getRepaymentHealthClasses,
  getRepaymentHealthStatus,
  humanizeRepaymentHealthStatus,
} from "@/lib/repayment";

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("fr-FR").format(value) + " XOF";
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function humanizeApplicantStatus(status: string) {
  const map: Record<string, string> = {
    STUDENT: "Student",
    APPRENTICE: "Apprentice",
    INTERN: "Intern",
    EMPLOYEE: "Employee",
    FREELANCER: "Freelancer",
    OTHER: "Other",
  };

  return map[status] || status;
}

function humanizeProductType(type: string) {
  const map: Record<string, string> = {
    LAPTOP: "Laptop",
    SMARTPHONE: "Smartphone",
    TABLET: "Tablet",
    ROUTER: "Router",
  };

  return map[type] || type;
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
    PENDING: "Pending",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    LATE: "Late",
    DEFAULTED: "Defaulted",
    PAID: "Paid",
  };

  return map[status] || status;
}

function humanizeCollectionStage(stage: string) {
  const map: Record<string, string> = {
    NONE: "None",
    SOFT_COLLECTION: "Soft collection",
    ESCALATED: "Escalated",
    RESOLVED: "Resolved",
  };

  return map[stage] || stage;
}

function humanizeContactStatus(status: string) {
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

function humanizeNextActionType(type: string) {
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

function humanizeCollectionPriority(priority: string) {
  const map: Record<string, string> = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical",
  };

  return map[priority] || priority;
}

function humanizeCollectionEventType(type: string) {
  const map: Record<string, string> = {
    CASE_CREATED: "Case created",
    CONTACT_ATTEMPTED: "Contact attempted",
    CONTACT_MADE: "Contact made",
    PROMISE_TO_PAY: "Promise to pay",
    PROMISE_BROKEN: "Promise broken",
    FOLLOW_UP_SCHEDULED: "Follow-up scheduled",
    STATUS_CHANGED: "Status changed",
    ESCALATED: "Escalated",
    NOTE_ADDED: "Note added",
    PAYMENT_CONFIRMED: "Payment confirmed",
  };

  return map[type] || type;
}

function humanizeCollectionChannel(channel: string | null | undefined) {
  if (!channel) return "-";

  const map: Record<string, string> = {
    PHONE: "Phone",
    WHATSAPP: "WhatsApp",
    SMS: "SMS",
    EMAIL: "Email",
    IN_PERSON: "In person",
    SYSTEM: "System",
  };

  return map[channel] || channel;
}

function humanizeCollectionOutcome(outcome: string | null | undefined) {
  if (!outcome) return "-";

  const map: Record<string, string> = {
    NO_ANSWER: "No answer",
    CALLBACK_REQUESTED: "Callback requested",
    PAID: "Paid",
    PARTIAL_PAYMENT: "Partial payment",
    PROMISED: "Promised",
    REFUSED: "Refused",
    INVALID_NUMBER: "Invalid number",
    DISPUTED: "Disputed",
    INFO_UPDATED: "Info updated",
    OTHER: "Other",
  };

  return map[outcome] || outcome;
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
    case "ACTIVE":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "LATE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "PAID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":
      return "bg-slate-50 text-slate-700 border-slate-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function getCollectionStageClasses(stage: string) {
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

function getCollectionPriorityClasses(priority: string) {
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

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      product: true,
      guarantor: true,
      paymentPlan: {
        include: {
          installments: {
            orderBy: {
              installmentNumber: "asc",
            },
          },
          collectionCase: {
            include: {
              events: {
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
          },
        },
      },
      collectionCase: {
        include: {
          events: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  const installments = application.paymentPlan?.installments ?? [];
  const paidInstallmentsCount =
    installments.filter((item) => item.status === "PAID").length;
  const lateInstallmentsCount = getLateCount(installments);
  const remainingBalance = getRemainingBalance(installments);
  const paidRatio = getPaidRatio(installments);
  const nextDue = getNextDueInstallment(installments);
  const repaymentHealth =
    installments.length > 0 ? getRepaymentHealthStatus(installments) : null;

  const collectionCase =
    application.collectionCase ?? application.paymentPlan?.collectionCase ?? null;

  const collectionEvents = collectionCase?.events ?? [];
  const lateInstallments = installments.filter(
    (item) => item.status === "LATE" || item.status === "DEFAULTED"
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/admin/applications"
              className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm"
            >
              ← Back to applications
            </Link>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
              Application file
            </h1>

            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Review the full application, financial summary, repayment signals,
              and recovery context before making a decision.
            </p>
          </div>

          <div>
            <span
              className={`inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getStatusClasses(
                application.status
              )}`}
            >
              {humanizeStatus(application.status)}
            </span>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <StatCard
            label="Product price"
            value={formatCurrency(application.product.priceCents)}
          />
          <StatCard
            label="Down payment"
            value={formatCurrency(application.availableDownPayment)}
          />
          <StatCard
            label="Requested amount"
            value={formatCurrency(application.requestedAmount)}
          />
          <StatCard
            label="Created at"
            value={formatDate(application.createdAt)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <SectionCard
              title="Applicant information"
              description="Identity and contact details of the applicant."
            >
              <InfoGrid
                items={[
                  ["Full name", `${application.firstName} ${application.lastName}`],
                  ["Date of birth", formatDate(application.dateOfBirth)],
                  ["Gender", application.gender || "-"],
                  ["Phone", application.phone],
                  ["Email", application.email || "-"],
                  ["Address", application.addressLine],
                  ["City", application.city],
                  ["Country", application.country],
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Academic / work profile"
              description="Education or employment information associated with the file."
            >
              <InfoGrid
                items={[
                  ["Profile", humanizeApplicantStatus(application.applicantStatus)],
                  ["School name", application.schoolName || "-"],
                  ["Program name", application.programName || "-"],
                  ["Study level", application.studyLevel || "-"],
                  ["Employer name", application.employerName || "-"],
                  [
                    "Estimated monthly income",
                    formatCurrency(application.estimatedMonthlyIncome),
                  ],
                  ["Income source", application.incomeSource || "-"],
                  ["Family support", application.hasFamilySupport ? "Yes" : "No"],
                  [
                    "Family support amount",
                    formatCurrency(application.familySupportAmount),
                  ],
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Requested product"
              description="Product and financing structure requested by the applicant."
            >
              <InfoGrid
                items={[
                  ["Product name", application.product.name],
                  ["Product type", humanizeProductType(application.product.type)],
                  ["Brand", application.product.brand || "-"],
                  ["Model", application.product.model || "-"],
                  ["Product price", formatCurrency(application.product.priceCents)],
                  ["Down payment", formatCurrency(application.availableDownPayment)],
                  ["Requested amount", formatCurrency(application.requestedAmount)],
                  ["Approved amount", formatCurrency(application.approvedAmount)],
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Support / guarantor"
              description="Support information attached to this file."
            >
              {application.guarantor ? (
                <InfoGrid
                  items={[
                    ["Full name", application.guarantor.fullName],
                    [
                      "Relationship",
                      application.guarantor.relationshipToApplicant,
                    ],
                    ["Phone", application.guarantor.phone],
                    ["Email", application.guarantor.email || "-"],
                    ["Profession", application.guarantor.profession || "-"],
                    ["Address", application.guarantor.addressLine || "-"],
                    ["City", application.guarantor.city || "-"],
                    ["Support type", application.guarantor.supportType || "-"],
                    ["Guarantor status", application.guarantor.status],
                  ]}
                />
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No guarantor attached to this application.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Collections & recovery"
              description="Operational recovery context, late exposure, and recovery timeline."
            >
              {collectionCase ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <MiniStatCard
                      label="Collection stage"
                      value={humanizeCollectionStage(collectionCase.stage)}
                      badgeClass={getCollectionStageClasses(collectionCase.stage)}
                    />
                    <MiniStatCard
                      label="Contact status"
                      value={humanizeContactStatus(collectionCase.contactStatus)}
                    />
                    <MiniStatCard
                      label="Priority"
                      value={humanizeCollectionPriority(collectionCase.priority)}
                      badgeClass={getCollectionPriorityClasses(collectionCase.priority)}
                    />
                    <MiniStatCard
                      label="Next action"
                      value={humanizeNextActionType(collectionCase.nextActionType)}
                    />
                    <MiniStatCard
                      label="Next action date"
                      value={formatDate(collectionCase.nextActionDate)}
                    />
                    <MiniStatCard
                      label="Last contacted"
                      value={formatDate(collectionCase.lastContactedAt)}
                    />
                    <MiniStatCard
                      label="Promise date"
                      value={formatDate(collectionCase.lastPromiseDate)}
                    />
                    <MiniStatCard
                      label="Promise amount"
                      value={formatCurrency(collectionCase.lastPromiseAmount)}
                    />
                    <MiniStatCard
                      label="Broken promises"
                      value={String(collectionCase.brokenPromiseCount)}
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Internal note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {collectionCase.internalNote || "No recovery note added yet."}
                    </p>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Late installments linked
                      </h3>
                      <span className="text-sm text-slate-500">
                        {lateInstallments.length} item(s)
                      </span>
                    </div>

                    {lateInstallments.length > 0 ? (
                      <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-medium">#</th>
                              <th className="px-4 py-3 font-medium">Due date</th>
                              <th className="px-4 py-3 font-medium">Amount</th>
                              <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {lateInstallments.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3">{item.installmentNumber}</td>
                                <td className="px-4 py-3">{formatDate(item.dueDate)}</td>
                                <td className="px-4 py-3">{formatCurrency(item.amount)}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                      item.status
                                    )}`}
                                  >
                                    {humanizeStatus(item.status)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        No late installments linked to this case right now.
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Recovery timeline
                      </h3>
                      <span className="text-sm text-slate-500">
                        {collectionEvents.length} event(s)
                      </span>
                    </div>

                    {collectionEvents.length > 0 ? (
                      <div className="space-y-3">
                        {collectionEvents.map((event) => (
                          <div
                            key={event.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                    {humanizeCollectionEventType(event.eventType)}
                                  </span>

                                  {event.channel && (
                                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                      {humanizeCollectionChannel(event.channel)}
                                    </span>
                                  )}

                                  {event.outcome && (
                                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                      {humanizeCollectionOutcome(event.outcome)}
                                    </span>
                                  )}
                                </div>

                                <p className="mt-3 text-sm leading-6 text-slate-600">
                                  {event.note || "No note provided for this event."}
                                </p>

                                {(event.promisedDate || event.promisedAmount) && (
                                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                      <p className="text-slate-500">Promised date</p>
                                      <p className="mt-1 font-medium text-slate-900">
                                        {formatDate(event.promisedDate)}
                                      </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                                      <p className="text-slate-500">Promised amount</p>
                                      <p className="mt-1 font-medium text-slate-900">
                                        {formatCurrency(event.promisedAmount)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="text-sm text-slate-500">
                                {formatDate(event.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        No recovery events recorded yet.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No collection case has been created for this application yet.
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard
              title="Application summary"
              description="Quick decision context for the current file."
            >
              <div className="space-y-4">
                <SummaryRow label="Application ID" value={application.id} />
                <SummaryRow
                  label="Status"
                  value={humanizeStatus(application.status)}
                />
                <SummaryRow
                  label="Created at"
                  value={formatDate(application.createdAt)}
                />
                <SummaryRow
                  label="Updated at"
                  value={formatDate(application.updatedAt)}
                />
                <SummaryRow
                  label="Has guarantor"
                  value={application.guarantor ? "Yes" : "No"}
                />
                <SummaryRow
                  label="Has family support"
                  value={application.hasFamilySupport ? "Yes" : "No"}
                />
              </div>
            </SectionCard>

            <AdminActions
              applicationId={application.id}
              currentStatus={humanizeStatus(application.status)}
              initialNotes={application.adminNotes}
            />

            <CreatePaymentPlan
              applicationId={application.id}
              status={application.status}
              hasPaymentPlan={Boolean(application.paymentPlan)}
              financedAmount={application.requestedAmount}
            />

            <CollectionActions
              applicationId={application.id}
              hasCollectionCase={Boolean(collectionCase)}
              collectionStage={collectionCase?.stage ?? null}
              resolutionStatus={collectionCase?.resolutionStatus ?? null}
            />

            <SectionCard
              title="Repayment health"
              description="Operational view of reimbursement progress."
            >
              {application.paymentPlan ? (
                <div className="space-y-4">
                  <SummaryRow
                    label="Payment plan status"
                    value={humanizeStatus(application.paymentPlan.status)}
                  />
                  <SummaryRow
                    label="Health status"
                    value={
                      repaymentHealth
                        ? humanizeRepaymentHealthStatus(repaymentHealth)
                        : "-"
                    }
                  />
                  <SummaryRow
                    label="Paid installments"
                    value={String(paidInstallmentsCount)}
                  />
                  <SummaryRow
                    label="Late installments"
                    value={String(lateInstallmentsCount)}
                  />
                  <SummaryRow label="Paid ratio" value={`${paidRatio}%`} />
                  <SummaryRow
                    label="Remaining balance"
                    value={formatCurrency(remainingBalance)}
                  />
                  <SummaryRow
                    label="Next due"
                    value={nextDue ? formatDate(nextDue.dueDate) : "-"}
                  />

                  {repaymentHealth && (
                    <div className="pt-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getRepaymentHealthClasses(
                          repaymentHealth
                        )}`}
                      >
                        {humanizeRepaymentHealthStatus(repaymentHealth)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No repayment data yet because the payment plan has not been
                  created.
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Payment plan"
              description="Manage installments and repayment execution."
            >
              {application.paymentPlan ? (
                <div className="space-y-4">
                  <SummaryRow
                    label="Plan status"
                    value={humanizeStatus(application.paymentPlan.status)}
                  />
                  <SummaryRow
                    label="Total amount"
                    value={formatCurrency(application.paymentPlan.totalAmount)}
                  />
                  <SummaryRow
                    label="Down payment"
                    value={formatCurrency(
                      application.paymentPlan.downPaymentAmount
                    )}
                  />
                  <SummaryRow
                    label="Financed amount"
                    value={formatCurrency(application.paymentPlan.financedAmount)}
                  />
                  <SummaryRow
                    label="Installments"
                    value={String(application.paymentPlan.numberOfInstallments)}
                  />
                  <SummaryRow
                    label="Start date"
                    value={formatDate(application.paymentPlan.startDate)}
                  />
                  <SummaryRow
                    label="End date"
                    value={formatDate(application.paymentPlan.endDate)}
                  />

                  {application.paymentPlan.installments.length > 0 && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-medium">#</th>
                            <th className="px-4 py-3 font-medium">Due date</th>
                            <th className="px-4 py-3 font-medium">Amount</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Paid at</th>
                            <th className="px-4 py-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {application.paymentPlan.installments.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                {item.installmentNumber}
                              </td>
                              <td className="px-4 py-3">
                                {formatDate(item.dueDate)}
                              </td>
                              <td className="px-4 py-3">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                    item.status
                                  )}`}
                                >
                                  {humanizeStatus(item.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {formatDate(item.paidAt)}
                              </td>
                              <td className="px-4 py-3">
                                <InstallmentActions
                                  installmentId={item.id}
                                  currentStatus={item.status}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No payment plan has been created yet.
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MiniStatCard({
  label,
  value,
  badgeClass,
}: {
  label: string;
  value: string;
  badgeClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      {badgeClass ? (
        <div className="mt-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
          >
            {value}
          </span>
        </div>
      ) : (
        <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
          {value}
        </p>
      )}
    </div>
  );
}

function InfoGrid({ items }: { items: [string, string][] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        >
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-900">{value}</span>
    </div>
  );
}