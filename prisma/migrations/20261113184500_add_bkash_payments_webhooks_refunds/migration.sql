-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'INITIATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELED', 'EXPIRED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "WebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');

-- AlterEnum
ALTER TYPE "SubscriptionEventType" ADD VALUE 'RENEWED';
ALTER TYPE "SubscriptionEventType" ADD VALUE 'PLAN_CHANGED';
ALTER TYPE "SubscriptionEventType" ADD VALUE 'EXPIRED';
ALTER TYPE "SubscriptionEventType" ADD VALUE 'PAYMENT_FAILED';

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'INCOMPLETE';

-- AlterTable
ALTER TABLE "subscription_plans" ALTER COLUMN "currency" SET DEFAULT 'BDT';

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "plan_id" TEXT NOT NULL,
    "billing_cycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "provider" TEXT NOT NULL DEFAULT 'BKASH',
    "provider_payment_id" TEXT,
    "provider_transaction_id" TEXT,
    "internal_transaction_id" TEXT NOT NULL,
    "invoice_number" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "idempotency_key" TEXT NOT NULL,
    "payment_method" TEXT DEFAULT 'BKASH_CHECKOUT',
    "payer_reference" TEXT,
    "customer_msisdn" TEXT,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "canceled_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'BKASH',
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processing_status" "WebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
    "payload_hash" TEXT NOT NULL,
    "raw_payload" JSONB,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "failure_reason" TEXT,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_refunds" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "requested_by_user_id" TEXT NOT NULL,
    "reviewed_by_user_id" TEXT,
    "provider_refund_id" TEXT,
    "original_trx_id" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "admin_notes" TEXT,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_payment_id_key" ON "payments"("provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_transaction_id_key" ON "payments"("provider_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_internal_transaction_id_key" ON "payments"("internal_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_invoice_number_key" ON "payments"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");

-- CreateIndex
CREATE INDEX "payments_user_id_status_idx" ON "payments"("user_id", "status");

-- CreateIndex
CREATE INDEX "payments_subscription_id_idx" ON "payments"("subscription_id");

-- CreateIndex
CREATE INDEX "payments_plan_id_idx" ON "payments"("plan_id");

-- CreateIndex
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

-- CreateIndex
CREATE INDEX "payments_provider_provider_payment_id_idx" ON "payments"("provider", "provider_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_event_id_key" ON "payment_webhook_events"("provider_event_id");

-- CreateIndex
CREATE INDEX "payment_webhook_events_provider_event_type_idx" ON "payment_webhook_events"("provider", "event_type");

-- CreateIndex
CREATE INDEX "payment_webhook_events_processing_status_idx" ON "payment_webhook_events"("processing_status");

-- CreateIndex
CREATE INDEX "payment_webhook_events_payload_hash_idx" ON "payment_webhook_events"("payload_hash");

-- CreateIndex
CREATE UNIQUE INDEX "payment_refunds_provider_refund_id_key" ON "payment_refunds"("provider_refund_id");

-- CreateIndex
CREATE INDEX "payment_refunds_payment_id_idx" ON "payment_refunds"("payment_id");

-- CreateIndex
CREATE INDEX "payment_refunds_status_idx" ON "payment_refunds"("status");

-- CreateIndex
CREATE INDEX "payment_refunds_requested_by_user_id_idx" ON "payment_refunds"("requested_by_user_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

