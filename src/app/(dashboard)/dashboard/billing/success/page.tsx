import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  ShieldCheck,
  Receipt,
  Sparkles,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { getCurrentUser } from "@/server/policies/auth.policy";
import { AppRole, hasAnyRole } from "@/lib/permissions";
import { paymentService } from "@/server/payments/payment.service";
import { PaymentStatus } from "@/generated/prisma";
import { Button } from "@/components/ui/button";

export const instant = false;

export const metadata = {
  title: "Payment Verified | MatrimonyOS",
  description: "Your bKash payment has been verified and your membership is active.",
};

interface SuccessPageProps {
  searchParams: Promise<{
    paymentId?: string;
    duplicate?: string;
  }>;
}

export default async function BillingSuccessPage({ searchParams }: SuccessPageProps) {
  await connection();
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/dashboard/billing");
  }

  const params = await searchParams;

  if (!params.paymentId) {
    redirect("/dashboard/billing");
  }

  const isAdmin = hasAnyRole(user.roles, [AppRole.ADMIN, AppRole.SUPER_ADMIN]);

  let payment;
  try {
    payment = await paymentService.getPaymentForViewer({
      paymentId: params.paymentId,
      viewerUserId: user.id,
      isAdmin,
    });
  } catch {
    redirect("/dashboard/billing");
  }

  if (payment.status !== PaymentStatus.SUCCEEDED) {
    redirect(
      `/dashboard/billing/failed?paymentId=${encodeURIComponent(payment.id)}&status=${encodeURIComponent(payment.status)}&reason=Payment+has+not+been+verified+as+completed`
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified via bKash Official API
          </span>
          <h2 className="mt-3 font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
            Membership Activated Successfully
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            Thank you! Your bKash transaction has been cryptographically and server-side
            verified, and your <span className="font-semibold text-slate-900">{payment.plan.name}</span>{" "}
            entitlements are now active.
          </p>
        </div>

        {/* Receipt Summary Box */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-slate-500">Receipt / Invoice Number</span>
            <span className="font-mono font-semibold text-slate-900">
              {payment.invoiceNumber || payment.internalTransactionId}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-slate-500">bKash TrxID</span>
            <span className="font-mono font-semibold text-emerald-700">
              {payment.providerTransactionId || "Verified"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-slate-500">bKash Payment ID</span>
            <span className="font-mono text-xs text-slate-700">
              {payment.providerPaymentId || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-slate-500">Plan & Cycle</span>
            <span className="font-semibold text-slate-900">
              {payment.plan.name} ({payment.billingCycle})
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <span className="text-slate-500">Amount Paid</span>
            <span className="font-serif text-lg font-bold text-slate-900">
              ৳{Number(payment.amount.toString()).toLocaleString("en-BD")}{" "}
              <span className="text-xs font-normal text-slate-500">{payment.currency}</span>
            </span>
          </div>
          {payment.subscription && (
            <div className="flex items-center justify-between pt-1">
              <span className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="h-4 w-4 text-slate-400" />
                Active Period
              </span>
              <span className="font-medium text-slate-800">
                {new Date(payment.subscription.currentPeriodStart).toLocaleDateString()} —{" "}
                {new Date(payment.subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/dashboard/billing/invoices">
            <Button variant="outline" className="w-full sm:w-auto">
              <Receipt className="mr-1.5 h-4 w-4" />
              View Official Receipt
            </Button>
          </Link>
          <Link href="/dashboard/billing">
            <Button variant="outline" className="w-full sm:w-auto">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Manage Subscription
            </Button>
          </Link>
          <Link href="/dashboard/discover">
            <Button variant="primary" className="w-full sm:w-auto">
              Discover Matches
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
