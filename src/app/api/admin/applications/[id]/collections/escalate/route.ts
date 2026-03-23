import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const escalateCollectionSchema = z.object({
  note: z.string().trim().max(2000).optional().nullable(),
  nextActionDate: z.string().nullable().optional(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = escalateCollectionSchema.safeParse(body);

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

    const { note, nextActionDate } = parsed.data;

    let normalizedNextActionDate: Date | null = null;

    if (nextActionDate) {
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
          stage: "ESCALATED",
          priority: "CRITICAL",
          nextActionType: "ESCALATE",
          nextActionDate: normalizedNextActionDate,
          resolutionStatus: "OPEN",
          internalNote: note || application.collectionCase!.internalNote,
        },
      });

      await tx.collectionEvent.create({
        data: {
          collectionCaseId: application.collectionCase!.id,
          applicationId: application.id,
          eventType: "ESCALATED",
          channel: "SYSTEM",
          note: note || "Collection case escalated.",
        },
      });

      if (normalizedNextActionDate) {
        await tx.collectionEvent.create({
          data: {
            collectionCaseId: application.collectionCase!.id,
            applicationId: application.id,
            eventType: "FOLLOW_UP_SCHEDULED",
            channel: "SYSTEM",
            note: `Escalation follow-up scheduled for ${normalizedNextActionDate.toISOString()}.`,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Escalate collection case error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}