"use client";

import * as React from "react";
import Link from "next/link";
import { BlogPost } from "@/lib/demo-data";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";

interface BlogFilterClientProps {
  posts: BlogPost[];
}

export function BlogFilterClient({ posts }: BlogFilterClientProps) {
  const [activeCategory, setActiveCategory] = React.useState<string>("All");

  const categories = [
    "All",
    ...Array.from(new Set(posts.map((p) => p.category))),
  ];

  const filteredPosts = posts.filter(
    (post) => activeCategory === "All" || post.category === activeCategory
  );

  return (
    <div className="w-full">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E2D5] pb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`cursor-pointer rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeCategory === cat
                ? "bg-[#14243A] text-[#FAF8F3] shadow-xs"
                : "border border-[#E8E2D5] bg-white text-[#777777] hover:border-[#B89A63] hover:text-[#14243A]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2">
        {filteredPosts.map((post) => (
          <article
            key={post.slug}
            className="group flex flex-col justify-between rounded-3xl border border-[#E8E2D5] bg-white p-8 shadow-[0_4px_20px_rgba(20,36,58,0.03)] transition-all duration-300 hover:border-[#B89A63]/50 hover:shadow-[0_12px_32px_rgba(20,36,58,0.08)]"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#E8E2D5]/70 pb-4">
                <Badge variant="gold">{post.category}</Badge>
                <div className="flex items-center gap-1.5 text-[11px] text-[#777777]">
                  <Clock className="h-3 w-3" />
                  <span>{post.readingTime}</span>
                </div>
              </div>

              <Link href={`/blog/${post.slug}`}>
                <h3 className="mt-5 font-serif text-2xl leading-snug font-bold text-[#14243A] transition-colors group-hover:text-[#B89A63]">
                  {post.title}
                </h3>
              </Link>

              <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[#777777]">
                {post.excerpt}
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-[#E8E2D5]/70 pt-4">
              <div>
                <p className="text-xs font-bold text-[#14243A]">
                  {post.author.name}
                </p>
                <p className="text-[10px] text-[#777777]">
                  {post.author.role} • {post.publishedAt}
                </p>
              </div>

              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#B89A63] transition-transform group-hover:translate-x-1"
              >
                Read Article
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
