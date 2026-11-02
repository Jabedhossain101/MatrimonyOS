import * as React from "react";
import { DemoStory } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Quote, Sparkles, CheckCircle2 } from "lucide-react";

interface TestimonialCardProps {
  story: DemoStory;
}

export function TestimonialCard({ story }: TestimonialCardProps) {
  return (
    <div className="relative flex flex-col justify-between rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-[0_2px_12px_rgba(20,36,58,0.03)] transition-all duration-300 hover:border-[#B89A63]/50 hover:shadow-[0_12px_32px_rgba(20,36,58,0.08)] sm:p-8">
      {/* Header Badge */}
      <div>
        <div className="flex items-center justify-between border-b border-[#E8E2D5]/70 pb-3">
          <Badge variant="gold">
            <Sparkles className="h-3 w-3" />
            Sample Case Study
          </Badge>
          <span className="text-[11px] font-medium text-[#777777]">
            {story.corridor}
          </span>
        </div>

        {/* Title & Quote */}
        <div className="mt-5">
          <h3 className="font-serif text-xl font-bold text-[#14243A]">
            {story.title}
          </h3>
          <p className="mt-1 text-xs font-semibold text-[#B89A63]">
            {story.coupleSubtitle}
          </p>

          <div className="relative mt-4 rounded-xl border border-[#E8E2D5] bg-[#FAF8F3] p-4">
            <Quote className="absolute top-2 right-2 h-4 w-4 text-[#B89A63]/30" />
            <p className="text-xs leading-relaxed text-[#14243A] italic">
              &ldquo;{story.quote}&rdquo;
            </p>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#777777]">
            {story.summary}
          </p>
        </div>

        {/* Journey Milestones */}
        <div className="mt-5 space-y-2 border-t border-[#E8E2D5]/50 pt-4">
          <p className="text-[11px] font-semibold tracking-wider text-[#14243A] uppercase">
            Demonstrated Journey Points:
          </p>
          <ul className="space-y-1.5 text-xs text-[#333333]">
            {story.journeyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-6 border-t border-[#E8E2D5]/60 pt-3 text-[10px] text-[#777777]">
        * Fictionalized scenario illustrating intended platform workflow.
      </div>
    </div>
  );
}
