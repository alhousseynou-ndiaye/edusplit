import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED"]),
  adminNotes: z.string().trim().max(2000).optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

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

    const existing = await prisma.application.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found",
        },
        { status: 404 }
      );
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: parsed.data.status,
        adminNotes:
          parsed.data.adminNotes !== undefined
            ? parsed.data.adminNotes || null
            : existing.adminNotes,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Update application status error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}