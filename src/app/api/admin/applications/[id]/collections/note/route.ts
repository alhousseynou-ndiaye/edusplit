import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const collectionNoteSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, "Note is required.")
    .max(2000, "Note is too long."),
  nextActionType: z.enum([
    "CALL",
    "WHATSAPP",
    "SMS",
    "EMAIL",
    "FOLLOW_UP",
    "ESCALATE",
    "NONE",
  ]),
  nextActionDate: z.string().nullable().optional(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = collectionNoteSchema.safeParse(body);

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

    const { note, nextActionType, nextActionDate } = parsed.data;

    let normalizedNextActionDate: Date | null = null;

    if (nextActionType !== "NONE" && nextActionDate) {
      normalizedNextActionDate = new Date(nextActionDate);

      if (Number.isNaN(normalizedNextActionDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid next action date.",
          },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.collectionCase.update({
        where: {
          id: application.collectionCase!.id,
        },
        data: {
          internalNote: note,
          nextActionType,
          nextActionDate:
            nextActionType === "NONE" ? null : normalizedNextActionDate,
        },
      });

      await tx.collectionEvent.create({
        data: {
          collectionCaseId: application.collectionCase!.id,
          applicationId: application.id,
          eventType: "NOTE_ADDED",
          channel: "SYSTEM",
          note,
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
    console.error("Add collection note error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}