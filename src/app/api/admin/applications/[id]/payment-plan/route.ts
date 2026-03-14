import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPaymentPlanSchema = z.object({
  numberOfInstallments: z.coerce.number().int().min(2).max(4),
  startDate: z.string().datetime(),
});

function addMonths(date: Date, months: number) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function splitAmount(total: number, count: number) {
  const base = Math.floor(total / count);
  const remainder = total % count;

  return Array.from({ length: count }, (_, index) =>
    index === count - 1 ? base + remainder : base
  );
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = createPaymentPlanSchema.safeParse(body);

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

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        paymentPlan: true,
        product: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 }
      );
    }

    if (application.status !== "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          error: "Only approved applications can receive a payment plan",
        },
        { status: 400 }
      );
    }

    if (application.paymentPlan) {
      return NextResponse.json(
        {
          success: false,
          error: "A payment plan already exists for this application",
        },
        { status: 400 }
      );
    }

    const financedAmount = application.requestedAmount;
    const totalAmount = application.product.priceCents;
    const downPaymentAmount = application.availableDownPayment;
    const numberOfInstallments = parsed.data.numberOfInstallments;
    const startDate = new Date(parsed.data.startDate);

    const installmentAmounts = splitAmount(financedAmount, numberOfInstallments);
    const endDate = addMonths(startDate, numberOfInstallments - 1);

    const createdPlan = await prisma.$transaction(async (tx) => {
      const paymentPlan = await tx.paymentPlan.create({
        data: {
          applicationId: application.id,
          totalAmount,
          downPaymentAmount,
          financedAmount,
          numberOfInstallments,
          status: "ACTIVE",
          startDate,
          endDate,
        },
      });

      await tx.installment.createMany({
        data: installmentAmounts.map((amount, index) => ({
          paymentPlanId: paymentPlan.id,
          installmentNumber: index + 1,
          dueDate: addMonths(startDate, index),
          amount,
          status: "PENDING",
        })),
      });

      return paymentPlan;
    });

    return NextResponse.json({
      success: true,
      data: createdPlan,
    });
  } catch (error) {
    console.error("Create payment plan error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
