import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const applications = await prisma.application.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        product: true,
        guarantor: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("List admin applications error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch applications",
      },
      { status: 500 }
    );
  }
}
