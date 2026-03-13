import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createApplicationSchema } from "@/lib/validators/application";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const requestedAmount = data.productPrice - data.availableDownPayment;

    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.productName,
          type: data.productType,
          brand: data.productBrand || null,
          model: data.productModel || null,
          priceCents: data.productPrice,
          currency: "XOF",
        },
      });

      let guarantorId: string | null = null;

      if (data.hasGuarantor) {
        const guarantor = await tx.guarantor.create({
          data: {
            fullName: data.guarantorFullName || "",
            relationshipToApplicant: data.guarantorRelationship || "",
            phone: data.guarantorPhone || "",
            email: data.guarantorEmail || null,
            profession: data.guarantorProfession || null,
            addressLine: data.guarantorAddressLine || null,
            city: data.guarantorCity || null,
            supportType: data.guarantorSupportType || null,
            status: "PENDING",
          },
        });

        guarantorId = guarantor.id;
      }

      const application = await tx.application.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender || null,
          phone: data.phone,
          email: data.email || null,
          addressLine: data.addressLine,
          city: data.city,
          country: data.country,

          applicantStatus: data.applicantStatus,
          schoolName: data.schoolName || null,
          programName: data.programName || null,
          studyLevel: data.studyLevel || null,
          employerName: data.employerName || null,

          estimatedMonthlyIncome: data.estimatedMonthlyIncome ?? null,
          incomeSource: data.incomeSource || null,
          hasFamilySupport: data.hasFamilySupport,
          familySupportAmount: data.familySupportAmount ?? null,

          availableDownPayment: data.availableDownPayment,
          requestedAmount,
          status: data.hasGuarantor ? "WAITING_GUARANTOR" : "SUBMITTED",

          productId: product.id,
          guarantorId,
        },
        include: {
          product: true,
          guarantor: true,
        },
      });

      return application;
    });

    return NextResponse.json(
      {
        success: true,
        applicationId: created.id,
        status: created.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create application error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}