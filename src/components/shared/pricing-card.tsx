import * as React from "react";
import { PricingPlan } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Info } from "lucide-react";

interface PricingCardProps {
  plan: PricingPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
  const isPopular = plan.popular;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-8 transition-all duration-300 ${
        isPopular
          ? "border-[#B89A63] bg-white shadow-[0_16px_40px_rgba(20,36,58,0.08)] ring-1 ring-[#B89A63]"
          : "border-[#E8E2D5] bg-[#FAF8F3] shadow-[0_2px_12px_rgba(20,36,58,0.02)] hover:border-[#B89A63]/50 hover:bg-white"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge
            variant="gold"
            className="border-[#B89A63] bg-[#B89A63] text-[#FAF8F3]"
          >
            Most Recommended Tier
          </Badge>
        </div>
      )}

      <div>
        {/* Tier Header */}
        <div className="border-b border-[#E8E2D5]/70 pb-6">
          <h3 className="font-serif text-2xl font-bold text-[#14243A]">
            {plan.name}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#777777]">
            {plan.tagline}
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-serif text-4xl font-extrabold text-[#14243A]">
              {plan.priceDisplay}
            </span>
            <span className="text-xs font-medium text-[#777777]">
              /{plan.billingPeriod}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#A3854F]">
            <Info className="h-3 w-3 shrink-0" />
            <span>Illustrative proposed pricing for launch</span>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-3.5 py-6">
          <p className="text-xs font-semibold tracking-wider text-[#14243A] uppercase">
            Included Capabilities
          </p>
          <ul className="space-y-3 text-xs text-[#333333]">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#B89A63]/15 text-[#B89A63]">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          {plan.limitations.length > 0 && (
            <div className="border-t border-[#E8E2D5]/50 pt-3">
              <p className="text-[11px] font-semibold tracking-wider text-[#777777] uppercase">
                Tier Limits
              </p>
              <ul className="mt-2 space-y-2 text-xs text-[#777777]">
                {plan.limitations.map((limit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-xs font-bold text-[#777777]">—</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="border-t border-[#E8E2D5]/70 pt-4">
        <Button
          variant={isPopular ? "gold" : "primary"}
          size="lg"
          href="/contact?plan="
          className="w-full"
        >
          {plan.ctaLabel}
        </Button>
      </div>
    </div>
  );
}
