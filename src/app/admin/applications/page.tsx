import Link from "next/link";
import { prisma } from "@/lib/prisma";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value) + " XOF";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
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

export default async function AdminApplicationsPage() {
  const applications = await prisma.application.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      product: true,
      guarantor: true,
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
            Review incoming applications, monitor statuses, and access each file
            in detail.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <StatCard label="Total applications" value={String(totalApplications)} />
          <StatCard label="Submitted" value={String(submittedCount)} />
          <StatCard label="Waiting guarantor" value={String(waitingGuarantorCount)} />
          <StatCard label="Approved" value={String(approvedCount)} />
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-slate-900">
              All applications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest applications appear first.
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
              <table className="min-w-full text-left">
                <thead className="bg-slate-50 text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Applicant</th>
                    <th className="px-6 py-4 font-medium">Profile</th>
                    <th className="px-6 py-4 font-medium">Product</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Down payment</th>
                    <th className="px-6 py-4 font-medium">Requested</th>
                    <th className="px-6 py-4 font-medium">Guarantor</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Created</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                  {applications.map((application) => (
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
                        {humanizeApplicantStatus(application.applicantStatus)}
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="font-medium text-slate-900">
                          {application.product.name}
                        </div>
                        <div className="mt-1 text-slate-500">
                          {humanizeProductType(application.product.type)}
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
                  ))}
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
