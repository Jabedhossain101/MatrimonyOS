"use client";

import * as React from "react";
import {
  Receipt,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PaidReceiptDto {
  id: string;
  invoiceNumber: string;
  merchantInvoiceNumber: string;
  providerPaymentId: string | null;
  providerTrxId: string | null;
  customerMsisdn: string | null;
  amount: string;
  currency: string;
  status: string;
  billingCycle: string;
  planName: string;
  planTier: string;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  customerName: string;
  customerEmail: string;
}

interface InvoicesClientProps {
  receipts: PaidReceiptDto[];
}

export function InvoicesClient({ receipts }: InvoicesClientProps) {
  const [selectedReceipt, setSelectedReceipt] = React.useState<PaidReceiptDto | null>(
    receipts[0] ?? null
  );

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (receipts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <Receipt className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-serif text-lg font-bold text-slate-900">
          No Paid Receipts Yet
        </h2>
        <p className="mt-1 mx-auto max-w-md text-xs text-slate-500">
          Official payment receipts are generated exclusively after a bKash transaction is
          verified as Completed. Pending or failed payment attempts never generate paid
          receipts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left list */}
      <div className="lg:col-span-5 space-y-3 print:hidden">
        <h2 className="font-serif text-base font-bold text-slate-900">
          Verified Payment Receipts ({receipts.length})
        </h2>
        <div className="space-y-2.5">
          {receipts.map((rec) => {
            const isSelected = selectedReceipt?.id === rec.id;
            return (
              <button
                key={rec.id}
                type="button"
                onClick={() => setSelectedReceipt(rec)}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? "border-[#be123c] bg-rose-50/40 shadow-sm ring-1 ring-[#be123c]"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {rec.invoiceNumber}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />
                    PAID
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {rec.planName} ({rec.billingCycle})
                    </p>
                    <p className="text-xs text-slate-500">
                      Paid on {new Date(rec.paidAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-serif text-base font-bold text-slate-900">
                    ৳{Number(rec.amount).toLocaleString("en-BD")}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {rec.currency}
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Printable Receipt View */}
      <div className="lg:col-span-7">
        {selectedReceipt && (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm print:border-none print:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2 text-[#be123c]">
                  <Building2 className="h-5 w-5" />
                  <span className="font-serif text-lg font-bold tracking-tight">
                    MatrimonyOS
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Official Electronic Payment Receipt (Non-Tax Commercial Receipt)
                </p>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  VERIFIED PAID VIA bKash
                </span>
                <p className="mt-2 font-mono text-sm font-bold text-slate-900">
                  {selectedReceipt.invoiceNumber}
                </p>
                <p className="text-xs text-slate-500">
                  Issued: {new Date(selectedReceipt.paidAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 text-xs">
              <div className="space-y-1">
                <p className="font-semibold uppercase tracking-wider text-slate-400">
                  Billed To Member
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedReceipt.customerName}
                </p>
                <p className="text-slate-600">{selectedReceipt.customerEmail}</p>
                {selectedReceipt.customerMsisdn && (
                  <p className="text-slate-500">
                    bKash Wallet: {selectedReceipt.customerMsisdn}
                  </p>
                )}
              </div>

              <div className="space-y-1 sm:text-right">
                <p className="font-semibold uppercase tracking-wider text-slate-400">
                  Payment Provider Details
                </p>
                <p className="text-slate-700">
                  Provider: <span className="font-semibold">bKash Tokenized Checkout</span>
                </p>
                <p className="font-mono text-emerald-700 font-semibold">
                  TrxID: {selectedReceipt.providerTrxId || "Verified"}
                </p>
                <p className="font-mono text-slate-500">
                  PaymentID: {selectedReceipt.providerPaymentId || "—"}
                </p>
                <p className="font-mono text-slate-500">
                  Merchant Ref: {selectedReceipt.merchantInvoiceNumber}
                </p>
              </div>
            </div>

            {/* Line Item Table */}
            <div className="mt-8 rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Billing Cycle</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        MatrimonyOS {selectedReceipt.planName} Membership
                      </p>
                      {selectedReceipt.periodStart && selectedReceipt.periodEnd && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          Service Period:{" "}
                          {new Date(selectedReceipt.periodStart).toLocaleDateString()} —{" "}
                          {new Date(selectedReceipt.periodEnd).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-slate-600">
                      {selectedReceipt.billingCycle}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">
                      ৳{Number(selectedReceipt.amount).toLocaleString("en-BD")}{" "}
                      {selectedReceipt.currency}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50/80 border-t border-slate-200">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      Total Paid ({selectedReceipt.currency})
                    </td>
                    <td className="px-4 py-3.5 text-right font-serif text-lg font-bold text-slate-900">
                      ৳{Number(selectedReceipt.amount).toLocaleString("en-BD")}{" "}
                      {selectedReceipt.currency}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
              <p className="max-w-md text-[11px] leading-relaxed text-slate-400">
                Note: This document is an electronic payment confirmation receipt verifying
                settled payment via bKash. It is not a VAT/Tax invoice.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="print:hidden"
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Print / Save PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

