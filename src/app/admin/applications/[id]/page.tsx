import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

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
  };

  return map[status] || status;
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
          installments: true,
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

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
              Review the full application, financial summary, and support
              information before making a decision.
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
          <StatCard label="Product price" value={formatCurrency(application.product.priceCents)} />
          <StatCard label="Down payment" value={formatCurrency(application.availableDownPayment)} />
          <StatCard label="Requested amount" value={formatCurrency(application.requestedAmount)} />
          <StatCard label="Created at" value={formatDate(application.createdAt)} />
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
                  ["Estimated monthly income", formatCurrency(application.estimatedMonthlyIncome)],
                  ["Income source", application.incomeSource || "-"],
                  ["Family support", application.hasFamilySupport ? "Yes" : "No"],
                  ["Family support amount", formatCurrency(application.familySupportAmount)],
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
                    ["Relationship", application.guarantor.relationshipToApplicant],
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
          </div>

          <div className="space-y-6">
            <SectionCard
              title="Application summary"
              description="Quick decision context for the current file."
            >
              <div className="space-y-4">
                <SummaryRow label="Application ID" value={application.id} />
                <SummaryRow label="Status" value={humanizeStatus(application.status)} />
                <SummaryRow label="Created at" value={formatDate(application.createdAt)} />
                <SummaryRow label="Updated at" value={formatDate(application.updatedAt)} />
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

            <SectionCard
              title="Admin notes"
              description="Internal notes and future decision area."
            >
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {application.adminNotes || "No admin notes yet."}
              </div>
            </SectionCard>

            <SectionCard
              title="Payment plan"
              description="Payment plan data will appear here once the file is approved and structured."
            >
              {application.paymentPlan ? (
                <div className="space-y-4">
                  <SummaryRow
                    label="Plan status"
                    value={application.paymentPlan.status}
                  />
                  <SummaryRow
                    label="Total amount"
                    value={formatCurrency(application.paymentPlan.totalAmount)}
                  />
                  <SummaryRow
                    label="Down payment"
                    value={formatCurrency(application.paymentPlan.downPaymentAmount)}
                  />
                  <SummaryRow
                    label="Financed amount"
                    value={formatCurrency(application.paymentPlan.financedAmount)}
                  />
                  <SummaryRow
                    label="Installments"
                    value={String(application.paymentPlan.numberOfInstallments)}
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
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {application.paymentPlan.installments.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">{item.installmentNumber}</td>
                              <td className="px-4 py-3">{formatDate(item.dueDate)}</td>
                              <td className="px-4 py-3">{formatCurrency(item.amount)}</td>
                              <td className="px-4 py-3">{item.status}</td>
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