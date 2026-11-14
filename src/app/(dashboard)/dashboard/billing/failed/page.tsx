import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { AppRole, hasAnyRole } from "@/lib/permissions";
import { paymentService } from "@/server/payments/payment.service";
import { PaymentStatus } from "@/generated/prisma";
import { FailedClient } from "./failed-client";

export const instant = false;

export const metadata = {
  title: "Payment Incomplete | MatrimonyOS",
  description: "Your bKash payment was not completed or requires verification.",
};

interface FailedPageProps {
  searchParams: Promise<{
    paymentId?: string;
    status?: string;
    reason?: string;
  }>;
}

export default async function BillingFailedPage({ searchParams }: FailedPageProps) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/billing");
  }

  const params = await searchParams;
  const isAdmin = hasAnyRole(user.roles, [AppRole.ADMIN, AppRole.SUPER_ADMIN]);

  let payment = null;
  if (params.paymentId) {
    try {
      payment = await paymentService.getPaymentForViewer({
        paymentId: params.paymentId,
        viewerUserId: user.id,
        isAdmin,
      });
    } catch {
      payment = null;
    }
  }

  if (payment && payment.status === PaymentStatus.SUCCEEDED) {
    redirect(`/dashboard/billing/success?paymentId=${encodeURIComponent(payment.id)}`);
  }

  return (
    <FailedClient
      paymentId={payment?.id}
      status={payment?.status || params.status || "FAILED"}
      reason={payment?.failureReason || params.reason}
      planId={payment?.planId}
      billingCycle={payment?.billingCycle}
      merchantInvoiceNumber={payment?.internalTransactionId}
      providerPaymentId={payment?.providerPaymentId}
    />
  );
}
