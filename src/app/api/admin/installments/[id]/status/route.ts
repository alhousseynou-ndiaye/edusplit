import { NextResponse } from "next/server";
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
        paymentPlan: true,
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