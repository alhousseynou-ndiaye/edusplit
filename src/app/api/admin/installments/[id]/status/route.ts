import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateInstallmentStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "LATE"]),
});

function computePaymentPlanStatus(
  statuses: Array<"PENDING" | "PAID" | "LATE" | "DEFAULTED">
) {
  if (statuses.length > 0 && statuses.every((status) => status === "PAID")) {
    return "COMPLETED" as const;
  }

  if (statuses.some((status) => status === "LATE" || status === "DEFAULTED")) {
    return "LATE" as const;
  }

  return "ACTIVE" as const;
}

async function syncCollectionCaseForPaymentPlan(
  tx: Prisma.TransactionClient,
  params: {
    applicationId: string;
    paymentPlanId: string;
    previousPaymentPlanStatus:
      | "PENDING"
      | "ACTIVE"
      | "COMPLETED"
      | "LATE"
      | "DEFAULTED"
      | "CANCELED";
    paymentPlanStatus: "ACTIVE" | "COMPLETED" | "LATE";
    previousInstallmentStatus: "PENDING" | "PAID" | "LATE" | "DEFAULTED";
    nextInstallmentStatus: "PENDING" | "PAID" | "LATE";
  }
) {
  const {
    applicationId,
    paymentPlanId,
    previousPaymentPlanStatus,
    paymentPlanStatus,
    previousInstallmentStatus,
    nextInstallmentStatus,
  } = params;

  const existingCase = await tx.collectionCase.findUnique({
    where: { applicationId },
  });

  // 1) Dès qu'on a du retard, on ouvre ou réactive le case de recouvrement
  if (paymentPlanStatus === "LATE") {
    if (!existingCase) {
      const createdCase = await tx.collectionCase.create({
        data: {
          applicationId,
          paymentPlanId,
          stage: "SOFT_COLLECTION",
          contactStatus: "NOT_CONTACTED",
          nextActionDate: new Date(),
          nextActionType: "CALL",
          priority: "HIGH",
          resolutionStatus: "OPEN",
        },
      });

      await tx.collectionEvent.create({
        data: {
          collectionCaseId: createdCase.id,
          applicationId,
          eventType: "CASE_CREATED",
          channel: "SYSTEM",
          note: "Collection case created automatically after an installment was marked late.",
        },
      });

      return;
    }

    const shouldReopen =
      existingCase.stage === "NONE" || existingCase.stage === "RESOLVED";

    await tx.collectionCase.update({
      where: { id: existingCase.id },
      data: {
        paymentPlanId,
        stage: shouldReopen ? "SOFT_COLLECTION" : existingCase.stage,
        resolutionStatus:
          existingCase.resolutionStatus === "CLOSED"
            ? "OPEN"
            : existingCase.resolutionStatus,
        priority:
          existingCase.priority === "LOW" || existingCase.priority === "MEDIUM"
            ? "HIGH"
            : existingCase.priority,
        nextActionDate: existingCase.nextActionDate ?? new Date(),
        nextActionType:
          existingCase.nextActionType === "NONE"
            ? "CALL"
            : existingCase.nextActionType,
      },
    });

    if (
      previousInstallmentStatus !== "LATE" &&
      nextInstallmentStatus === "LATE"
    ) {
      await tx.collectionEvent.create({
        data: {
          collectionCaseId: existingCase.id,
          applicationId,
          eventType: "STATUS_CHANGED",
          channel: "SYSTEM",
          note: "Collection case updated because an installment moved to LATE.",
        },
      });
    }

    return;
  }

  // 2) Si tout est régularisé / payé, on ferme le case uniquement sur une vraie transition
  if (paymentPlanStatus === "COMPLETED" || paymentPlanStatus === "ACTIVE") {
    if (!existingCase) {
      return;
    }

    const isAlreadyResolved =
      existingCase.stage === "RESOLVED" &&
      existingCase.contactStatus === "RESOLVED" &&
      existingCase.resolutionStatus === "CLOSED" &&
      existingCase.nextActionType === "NONE" &&
      existingCase.nextActionDate === null;

    if (isAlreadyResolved) {
      return;
    }

    const movedOutOfLate =
      previousPaymentPlanStatus === "LATE" &&
      (paymentPlanStatus === "ACTIVE" || paymentPlanStatus === "COMPLETED");

    const newlyCompleted =
      previousPaymentPlanStatus !== "COMPLETED" &&
      paymentPlanStatus === "COMPLETED";

    const shouldAutoResolve = movedOutOfLate || newlyCompleted;

    if (!shouldAutoResolve) {
      return;
    }

    await tx.collectionCase.update({
      where: { id: existingCase.id },
      data: {
        stage: "RESOLVED",
        contactStatus: "RESOLVED",
        resolutionStatus: "CLOSED",
        nextActionDate: null,
        nextActionType: "NONE",
        priority: "LOW",
      },
    });

    await tx.collectionEvent.create({
      data: {
        collectionCaseId: existingCase.id,
        applicationId,
        eventType: "PAYMENT_CONFIRMED",
        channel: "SYSTEM",
        note:
          paymentPlanStatus === "COMPLETED"
            ? "Collection case resolved automatically because the payment plan is fully paid."
            : "Collection case resolved automatically because the payment plan is no longer late.",
      },
    });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateInstallmentStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const installment = await prisma.installment.findUnique({
      where: { id },
      include: {
        paymentPlan: {
          select: {
            id: true,
            applicationId: true,
            status: true,
          },
        },
      },
    });

    if (!installment) {
      return NextResponse.json(
        {
          success: false,
          error: "Installment not found",
        },
        { status: 404 }
      );
    }

    const nextStatus = parsed.data.status;

    await prisma.$transaction(async (tx) => {
      await tx.installment.update({
        where: { id },
        data: {
          status: nextStatus,
          paidAt: nextStatus === "PAID" ? new Date() : null,
        },
      });

      const updatedInstallments = await tx.installment.findMany({
        where: {
          paymentPlanId: installment.paymentPlanId,
        },
        select: {
          status: true,
        },
      });

      const paymentPlanStatus = computePaymentPlanStatus(
        updatedInstallments.map((item) => item.status)
      );

      await tx.paymentPlan.update({
        where: {
          id: installment.paymentPlanId,
        },
        data: {
          status: paymentPlanStatus,
        },
      });

      await syncCollectionCaseForPaymentPlan(tx, {
        applicationId: installment.paymentPlan.applicationId,
        paymentPlanId: installment.paymentPlanId,
        previousPaymentPlanStatus: installment.paymentPlan.status,
        paymentPlanStatus,
        previousInstallmentStatus: installment.status,
        nextInstallmentStatus: nextStatus,
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Update installment status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}