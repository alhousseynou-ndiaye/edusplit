type InstallmentLike = {
  amount: number;
  dueDate: Date;
  status: "PENDING" | "PAID" | "LATE" | "DEFAULTED";
};

export type RepaymentHealthStatus = "HEALTHY" | "AT_RISK" | "COMPLETED";

export function getRemainingBalance(installments: InstallmentLike[]) {
  return installments
    .filter((item) => item.status !== "PAID")
    .reduce((sum, item) => sum + item.amount, 0);
}

export function getPaidAmount(installments: InstallmentLike[]) {
  return installments
    .filter((item) => item.status === "PAID")
    .reduce((sum, item) => sum + item.amount, 0);
}

export function getPaidRatio(installments: InstallmentLike[]) {
  const total = installments.reduce((sum, item) => sum + item.amount, 0);
  if (total === 0) return 0;

  const paid = getPaidAmount(installments);
  return Math.round((paid / total) * 100);
}

export function getLateCount(installments: InstallmentLike[]) {
  return installments.filter(
    (item) => item.status === "LATE" || item.status === "DEFAULTED"
  ).length;
}

export function getNextDueInstallment(installments: InstallmentLike[]) {
  const candidates = installments
    .filter((item) => item.status !== "PAID")
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  return candidates[0] ?? null;
}

export function getRepaymentHealthStatus(
  installments: InstallmentLike[]
): RepaymentHealthStatus {
  if (installments.length > 0 && installments.every((item) => item.status === "PAID")) {
    return "COMPLETED";
  }

  if (
    installments.some(
      (item) => item.status === "LATE" || item.status === "DEFAULTED"
    )
  ) {
    return "AT_RISK";
  }

  return "HEALTHY";
}

export function humanizeRepaymentHealthStatus(status: RepaymentHealthStatus) {
  const map: Record<RepaymentHealthStatus, string> = {
    HEALTHY: "Healthy",
    AT_RISK: "At risk",
    COMPLETED: "Completed",
  };

  return map[status];
}

export function getRepaymentHealthClasses(status: RepaymentHealthStatus) {
  switch (status) {
    case "HEALTHY":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "AT_RISK":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}