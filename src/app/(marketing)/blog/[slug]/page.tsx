import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { BLOG_POSTS } from "@/lib/demo-data";
import { Clock, ArrowLeft, BookmarkCheck, User, Calendar } from "lucide-react";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Article Not Found | MatrimonyOS",
    };
  }

  return {
    title: `${post.title} | MatrimonyOS Journal`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(
    0,
    2
  );

  return (
    <article className="py-12 sm:py-20">
      <Container size="md">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Journal", href: "/blog" },
            { label: post.category, href: "/blog" },
            { label: post.title },
          ]}
          className="mb-8"
        />

        {/* Back Link */}
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#777777] transition hover:text-[#14243A]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Articles
        </Link>

        {/* Article Header */}
        <div className="space-y-4 border-b border-[#E8E2D5] pb-8">
          <Badge variant="gold">{post.category}</Badge>
          <h1 className="font-serif text-3xl leading-tight font-bold tracking-tight text-[#14243A] sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#777777]">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-[#B89A63]" />
              <strong>{post.author.name}</strong> ({post.author.role})
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {post.publishedAt}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>
        </div>

        {/* Key Takeaways Box */}
        <div className="my-10 rounded-2xl border border-[#B89A63]/30 bg-[#FAF8F3] p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-2 font-serif text-base font-bold text-[#14243A]">
            <BookmarkCheck className="h-5 w-5 text-[#B89A63]" />
            Key Executive Takeaways
          </div>
          <ul className="space-y-2 text-xs text-[#333333] sm:text-sm">
            {post.keyTakeaways.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="font-bold text-[#B89A63]">—</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Article Body */}
        <div className="space-y-6 font-sans text-sm leading-relaxed text-[#333333] sm:text-base">
          {post.content.map((paragraph, idx) => (
            <p
              key={idx}
              className="first-of-type:text-base first-of-type:font-medium first-of-type:text-[#14243A] sm:first-of-type:text-lg"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {/* Author Bio Box */}
        <div className="mt-16 flex flex-col items-center gap-6 rounded-2xl border border-[#E8E2D5] bg-white p-6 sm:flex-row sm:p-8">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#14243A] font-serif text-2xl font-bold text-[#B89A63]">
            {post.author.name.charAt(0)}
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-serif text-lg font-bold text-[#14243A]">
              Written by {post.author.name}
            </h3>
            <p className="text-xs font-medium text-[#B89A63]">
              {post.author.role}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#777777]">
              Contributing editorial thought leadership on privacy-first
              matchmaking, cross-border family alignment, and digital ethics at
              MatrimonyOS.
            </p>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mt-20 border-t border-[#E8E2D5] pt-12">
          <h3 className="mb-8 font-serif text-2xl font-bold text-[#14243A]">
            Related Perspectives
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}`}
                className="group rounded-2xl border border-[#E8E2D5] bg-white p-6 transition-all hover:border-[#B89A63]/50 hover:shadow-sm"
              >
                <span className="text-[11px] font-semibold text-[#B89A63]">
                  {related.category}
                </span>
                <h4 className="mt-2 font-serif text-base font-bold text-[#14243A] transition-colors group-hover:text-[#B89A63]">
                  {related.title}
                </h4>
                <p className="mt-2 line-clamp-2 text-xs text-[#777777]">
                  {related.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#B89A63]">
                  Read Article →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </article>
  );
}
