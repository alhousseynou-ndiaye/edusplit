-- CreateEnum
CREATE TYPE "ApplicantStatus" AS ENUM ('STUDENT', 'APPRENTICE', 'INTERN', 'EMPLOYEE', 'FREELANCER', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'WAITING_GUARANTOR', 'WAITING_DOCUMENTS', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "GuarantorStatus" AS ENUM ('PENDING', 'CONTACTED', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('LAPTOP', 'SMARTPHONE', 'TABLET', 'ROUTER');

-- CreateEnum
CREATE TYPE "PaymentPlanStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'LATE', 'DEFAULTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InstallmentStatus" AS ENUM ('PENDING', 'PAID', 'LATE', 'DEFAULTED');

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Senegal',
    "applicantStatus" "ApplicantStatus" NOT NULL,
    "schoolName" TEXT,
    "programName" TEXT,
    "studyLevel" TEXT,
    "employerName" TEXT,
    "estimatedMonthlyIncome" INTEGER,
    "incomeSource" TEXT,
    "hasFamilySupport" BOOLEAN NOT NULL DEFAULT false,
    "familySupportAmount" INTEGER,
    "availableDownPayment" INTEGER NOT NULL,
    "requestedAmount" INTEGER NOT NULL,
    "approvedAmount" INTEGER,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "riskScore" INTEGER,
    "adminNotes" TEXT,
    "identityDocumentUrl" TEXT,
    "statusProofUrl" TEXT,
    "incomeProofUrl" TEXT,
    "productId" TEXT NOT NULL,
    "guarantorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guarantor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationshipToApplicant" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "profession" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "supportType" TEXT,
    "status" "GuarantorStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guarantor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "downPaymentAmount" INTEGER NOT NULL,
    "financedAmount" INTEGER NOT NULL,
    "numberOfInstallments" INTEGER NOT NULL,
    "status" "PaymentPlanStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "paymentPlanId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "status" "InstallmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_guarantorId_key" ON "Application"("guarantorId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_phone_idx" ON "Application"("phone");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE INDEX "Product_type_isActive_idx" ON "Product"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentPlan_applicationId_key" ON "PaymentPlan"("applicationId");

-- CreateIndex
CREATE INDEX "PaymentPlan_status_idx" ON "PaymentPlan"("status");

-- CreateIndex
CREATE INDEX "Installment_dueDate_status_idx" ON "Installment"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_paymentPlanId_installmentNumber_key" ON "Installment"("paymentPlanId", "installmentNumber");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_guarantorId_fkey" FOREIGN KEY ("guarantorId") REFERENCES "Guarantor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
