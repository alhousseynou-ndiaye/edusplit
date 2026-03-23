import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const promiseToPaySchema = z.object({
  promisedDate: z.string().min(1, "Promised date is required."),
  promisedAmount: z
    .number()
    .int("Promised amount must be an integer.")
    .positive("Promised amount must be greater than 0.")
    .nullable()
    .optional(),
  channel: z.enum(["PHONE", "WHATSAPP", "SMS", "EMAIL", "IN_PERSON", "SYSTEM"]),
  note: z.string().trim().max(2000).optional().nullable(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = promiseToPaySchema.safeParse(body);

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
        collectionCase: true,
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

    if (!application.collectionCase) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No collection case exists for this application yet. A case is created automatically when an installment becomes late.",
        },
        { status: 400 }
      );
    }

    const { promisedDate, promisedAmount, channel, note } = parsed.data;

    const normalizedPromisedDate = new Date(promisedDate);

    if (Number.isNaN(normalizedPromisedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid promised date.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.collectionCase.update({
        where: {
          id: application.collectionCase!.id,
        },
        data: {
          contactStatus: "PROMISE_TO_PAY",
          lastContactedAt: new Date(),
          lastPromiseDate: normalizedPromisedDate,
          lastPromiseAmount: promisedAmount ?? null,
          nextActionType: "FOLLOW_UP",
          nextActionDate: normalizedPromisedDate,
          priority: "MEDIUM",
          resolutionStatus: "MONITORING",
        },
      });

      await tx.collectionEvent.create({
        data: {
          collectionCaseId: application.collectionCase!.id,
          applicationId: application.id,
          eventType: "PROMISE_TO_PAY",
          channel,
          outcome: "PROMISED",
          note: note || null,
          promisedAmount: promisedAmount ?? null,
          promisedDate: normalizedPromisedDate,
        },
      });

      await tx.collectionEvent.create({
        data: {
          collectionCaseId: application.collectionCase!.id,
          applicationId: application.id,
          eventType: "FOLLOW_UP_SCHEDULED",
          channel: "SYSTEM",
          note: `Promise follow-up scheduled for ${normalizedPromisedDate.toISOString()}.`,
          promisedAmount: promisedAmount ?? null,
          promisedDate: normalizedPromisedDate,
        },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Create promise to pay error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}