import * as React from "react";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { BlogFilterClient } from "./blog-filter-client";
import { BLOG_POSTS } from "@/lib/demo-data";
import { Sparkles } from "lucide-react";

export const metadata = {
  title: "Editorial Journal & Matchmaking Insights | MatrimonyOS",
  description:
    "Reflective essays, privacy philosophy, and cultural perspectives on contemporary marriage and family dynamics from the MatrimonyOS team.",
};

export default function BlogListingPage() {
  return (
    <div className="flex flex-col py-12 sm:py-16">
      <Container size="lg">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "Editorial Journal" }]} className="mb-8" />

        {/* Hero Header */}
        <div className="mb-16 max-w-3xl space-y-4">
          <Badge variant="gold">
            <Sparkles className="h-3 w-3" />
            The MatrimonyOS Journal
          </Badge>
          <h1 className="font-serif text-4xl leading-[1.12] font-bold tracking-tight text-[#14243A] sm:text-5xl lg:text-6xl">
            Thoughts on Privacy, Culture &{" "}
            <span className="text-[#B89A63] italic">Enduring Matrimony.</span>
          </h1>
          <p className="text-base leading-relaxed text-[#777777] sm:text-lg">
            Carefully researched perspectives on modern biodata security,
            cross-border diaspora relationships, and the timeless art of
            dignified matchmaking.
          </p>
        </div>

        {/* Interactive Filter and Post Grid */}
        <BlogFilterClient posts={BLOG_POSTS} />
      </Container>
    </div>
  );
}
