import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactCollectionSchema = z.object({
  contactStatus: z.enum(["CONTACT_ATTEMPTED", "REACHED", "NO_RESPONSE"]),
  channel: z.enum(["PHONE", "WHATSAPP", "SMS", "EMAIL", "IN_PERSON", "SYSTEM"]),
  outcome: z.enum([
    "NO_ANSWER",
    "CALLBACK_REQUESTED",
    "PAID",
    "PARTIAL_PAYMENT",
    "PROMISED",
    "REFUSED",
    "INVALID_NUMBER",
    "DISPUTED",
    "INFO_UPDATED",
    "OTHER",
  ]),
  note: z.string().trim().max(2000).optional().nullable(),
  nextActionType: z.enum([
    "CALL",
    "WHATSAPP",
    "SMS",
    "EMAIL",
    "FOLLOW_UP",
    "ESCALATE",
    "NONE",
  ]),
  nextActionDate: z
    .union([z.string().datetime({ offset: true }), z.string().datetime(), z.null()])
    .optional(),
});

function getEventType(
  contactStatus: "CONTACT_ATTEMPTED" | "REACHED" | "NO_RESPONSE"
) {
  if (contactStatus === "REACHED") {
    return "CONTACT_MADE" as const;
  }

  return "CONTACT_ATTEMPTED" as const;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = contactCollectionSchema.safeParse(body);

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
        paymentPlan: true,
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

    const isResolvedCase =
      application.collectionCase.stage === "RESOLVED" ||
      application.collectionCase.resolutionStatus === "CLOSED";

    if (isResolvedCase) {
      return NextResponse.json(
        {
          success: false,
          error: "This collection case is resolved and can no longer be updated.",
        },
        { status: 400 }
      );
    }

    const {
      contactStatus,
      channel,
      outcome,
      note,
      nextActionType,
      nextActionDate,
    } = parsed.data;

    const normalizedNextActionDate =
      nextActionDate && nextActionType !== "NONE"
        ? new Date(nextActionDate)
        : null;

    await prisma.$transaction(async (tx) => {
      await tx.collectionCase.update({
        where: {
          id: application.collectionCase!.id,
        },
        data: {
          contactStatus,
          lastContactedAt: new Date(),
          nextActionType,
          nextActionDate:
            nextActionType === "NONE" ? null : normalizedNextActionDate,
          priority:
            contactStatus === "REACHED"
              ? "MEDIUM"
              : application.collectionCase!.priority,
        },
      });

      await tx.collectionEvent.create({
        data: {
          collectionCaseId: application.collectionCase!.id,
          applicationId: application.id,
          eventType: getEventType(contactStatus),
          channel,
          outcome,
          note: note || null,
        },
      });

      if (nextActionType !== "NONE" && normalizedNextActionDate) {
        await tx.collectionEvent.create({
          data: {
            collectionCaseId: application.collectionCase!.id,
            applicationId: application.id,
            eventType: "FOLLOW_UP_SCHEDULED",
            channel: "SYSTEM",
            note: `Next action scheduled: ${nextActionType} on ${normalizedNextActionDate.toISOString()}.`,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Create collection contact event error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}