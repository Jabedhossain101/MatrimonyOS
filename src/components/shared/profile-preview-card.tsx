import * as React from "react";
import { DemoProfile } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  MapPin,
  GraduationCap,
  Sparkles,
} from "lucide-react";

interface ProfilePreviewCardProps {
  profile: DemoProfile;
}

export function ProfilePreviewCard({ profile }: ProfilePreviewCardProps) {
  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-[#E8E2D5] bg-white p-6 shadow-[0_2px_12px_rgba(20,36,58,0.03)] transition-all duration-300 hover:border-[#B89A63]/50 hover:shadow-[0_12px_32px_rgba(20,36,58,0.08)] sm:p-7">
      {/* Demonstration Profile Banner */}
      <div className="mb-4 flex items-center justify-between border-b border-[#E8E2D5]/70 pb-3">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-[#B89A63] uppercase">
          <Sparkles className="h-3.5 w-3.5" />
          Illustrative Demo
        </span>
        <Badge variant={profile.privacyTier === "Protected" ? "gold" : "ivory"}>
          <Lock className="h-3 w-3" />
          {profile.privacyTier}
        </Badge>
      </div>

      {/* Main Identity */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#14243A]">
              {profile.codename}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-[#777777]">
              {profile.profession} • Age {profile.age}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E8E2D5] bg-[#FAF8F3] font-serif text-sm font-bold text-[#B89A63]">
            {profile.codename.charAt(0)}
          </div>
        </div>

        {/* Location & Origin */}
        <div className="mt-4 space-y-1.5 text-xs text-[#333333]">
          <div className="flex items-center gap-2 text-[#777777]">
            <MapPin className="h-3.5 w-3.5 text-[#B89A63]" />
            <span>
              Based in{" "}
              <strong className="font-medium text-[#14243A]">
                {profile.location}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#777777]">
            <GraduationCap className="h-3.5 w-3.5 text-[#B89A63]" />
            <span className="truncate">{profile.education}</span>
          </div>
          <div className="flex items-center gap-2 text-[#777777]">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Roots in {profile.origin}</span>
          </div>
        </div>

        {/* Bio Snippet */}
        <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-[#777777] italic">
          &ldquo;{profile.bioSnippet}&rdquo;
        </p>

        {/* Value Tags */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {profile.values.map((val) => (
            <span
              key={val}
              className="rounded-md border border-[#E8E2D5] bg-[#FAF8F3] px-2.5 py-1 text-[11px] font-medium text-[#14243A]"
            >
              {val}
            </span>
          ))}
        </div>
      </div>

      {/* Card Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-[#E8E2D5]/70 pt-4 text-[11px] text-[#777777]">
        <span>Photographs blurred for privacy</span>
        <span className="font-medium text-[#B89A63] group-hover:underline">
          Preview Details →
        </span>
      </div>
    </div>
  );
}
