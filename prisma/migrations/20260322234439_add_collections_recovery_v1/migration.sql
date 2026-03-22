-- CreateEnum
CREATE TYPE "CollectionStage" AS ENUM ('NONE', 'SOFT_COLLECTION', 'ESCALATED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('NOT_CONTACTED', 'CONTACT_ATTEMPTED', 'REACHED', 'NO_RESPONSE', 'PROMISE_TO_PAY', 'DISPUTE', 'REFUSED', 'RESOLVED');

-- CreateEnum
CREATE TYPE "NextActionType" AS ENUM ('CALL', 'WHATSAPP', 'SMS', 'EMAIL', 'FOLLOW_UP', 'ESCALATE', 'NONE');

-- CreateEnum
CREATE TYPE "CollectionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CollectionResolutionStatus" AS ENUM ('OPEN', 'MONITORING', 'CURED', 'CLOSED');

-- CreateEnum
CREATE TYPE "CollectionEventType" AS ENUM ('CASE_CREATED', 'CONTACT_ATTEMPTED', 'CONTACT_MADE', 'PROMISE_TO_PAY', 'PROMISE_BROKEN', 'FOLLOW_UP_SCHEDULED', 'STATUS_CHANGED', 'ESCALATED', 'NOTE_ADDED', 'PAYMENT_CONFIRMED');

-- CreateEnum
CREATE TYPE "CollectionChannel" AS ENUM ('PHONE', 'WHATSAPP', 'SMS', 'EMAIL', 'IN_PERSON', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CollectionOutcome" AS ENUM ('NO_ANSWER', 'CALLBACK_REQUESTED', 'PAID', 'PARTIAL_PAYMENT', 'PROMISED', 'REFUSED', 'INVALID_NUMBER', 'DISPUTED', 'INFO_UPDATED', 'OTHER');

-- CreateTable
CREATE TABLE "CollectionCase" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "paymentPlanId" TEXT,
    "stage" "CollectionStage" NOT NULL DEFAULT 'NONE',
    "contactStatus" "ContactStatus" NOT NULL DEFAULT 'NOT_CONTACTED',
    "nextActionDate" TIMESTAMP(3),
    "nextActionType" "NextActionType" NOT NULL DEFAULT 'NONE',
    "assignedTo" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "lastPromiseDate" TIMESTAMP(3),
    "lastPromiseAmount" INTEGER,
    "brokenPromiseCount" INTEGER NOT NULL DEFAULT 0,
    "priority" "CollectionPriority" NOT NULL DEFAULT 'MEDIUM',
    "resolutionStatus" "CollectionResolutionStatus" NOT NULL DEFAULT 'OPEN',
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionEvent" (
    "id" TEXT NOT NULL,
    "collectionCaseId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "installmentId" TEXT,
    "eventType" "CollectionEventType" NOT NULL,
    "channel" "CollectionChannel",
    "outcome" "CollectionOutcome",
    "note" TEXT,
    "promisedAmount" INTEGER,
    "promisedDate" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionCase_applicationId_key" ON "CollectionCase"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionCase_paymentPlanId_key" ON "CollectionCase"("paymentPlanId");

-- CreateIndex
CREATE INDEX "CollectionCase_stage_idx" ON "CollectionCase"("stage");

-- CreateIndex
CREATE INDEX "CollectionCase_contactStatus_idx" ON "CollectionCase"("contactStatus");

-- CreateIndex
CREATE INDEX "CollectionCase_priority_idx" ON "CollectionCase"("priority");

-- CreateIndex
CREATE INDEX "CollectionCase_nextActionDate_idx" ON "CollectionCase"("nextActionDate");

-- CreateIndex
CREATE INDEX "CollectionEvent_collectionCaseId_createdAt_idx" ON "CollectionEvent"("collectionCaseId", "createdAt");

-- CreateIndex
CREATE INDEX "CollectionEvent_applicationId_createdAt_idx" ON "CollectionEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "CollectionEvent_installmentId_idx" ON "CollectionEvent"("installmentId");

-- AddForeignKey
ALTER TABLE "CollectionCase" ADD CONSTRAINT "CollectionCase_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionCase" ADD CONSTRAINT "CollectionCase_paymentPlanId_fkey" FOREIGN KEY ("paymentPlanId") REFERENCES "PaymentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionEvent" ADD CONSTRAINT "CollectionEvent_collectionCaseId_fkey" FOREIGN KEY ("collectionCaseId") REFERENCES "CollectionCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionEvent" ADD CONSTRAINT "CollectionEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionEvent" ADD CONSTRAINT "CollectionEvent_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
