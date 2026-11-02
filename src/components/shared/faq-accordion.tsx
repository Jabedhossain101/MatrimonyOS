"use client";

import * as React from "react";
import { FaqItem } from "@/lib/demo-data";
import { ChevronDown, Search } from "lucide-react";

interface FaqAccordionProps {
  items: FaqItem[];
  allowSearch?: boolean;
  categoryFilter?: string;
}

export function FaqAccordion({
  items,
  allowSearch = true,
  categoryFilter,
}: FaqAccordionProps) {
  const [openIds, setOpenIds] = React.useState<Record<string, boolean>>({
    [items[0]?.id || ""]: true,
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState(
    categoryFilter || "All"
  );

  const categories = [
    "All",
    ...Array.from(new Set(items.map((i) => i.category))),
  ];

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full">
      {/* Search and Filters */}
      {allowSearch && (
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-[#777777]" />
            <input
              type="text"
              placeholder="Search frequently asked questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E8E2D5] bg-white py-3 pr-4 pl-11 text-sm text-[#14243A] placeholder-[#777777] shadow-sm transition focus:border-[#B89A63] focus:ring-1 focus:ring-[#B89A63] focus:outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? "bg-[#14243A] text-[#FAF8F3]"
                    : "border border-[#E8E2D5] bg-white text-[#777777] hover:border-[#B89A63] hover:text-[#14243A]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Accordion List */}
      <div className="divide-y divide-[#E8E2D5] rounded-2xl border border-[#E8E2D5] bg-white">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#777777]">
            No answers match your search query. Please explore other categories
            or contact our team directly.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOpen = !!openIds[item.id];
            return (
              <div key={item.id} className="transition-colors">
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between p-5 text-left text-sm font-semibold text-[#14243A] transition hover:bg-[#FAF8F3]/60 sm:p-6 sm:text-base"
                >
                  <span className="pr-4 font-serif">{item.question}</span>
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#E8E2D5] text-[#B89A63] transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-[#FAF8F3]" : "bg-white"
                    }`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pt-1 pb-6 text-xs leading-relaxed text-[#777777] sm:px-6 sm:text-sm">
                    <p className="border-l-2 border-[#B89A63]/50 pl-4">
                      {item.answer}
                    </p>
                    <span className="mt-3 inline-block rounded bg-[#FAF8F3] px-2 py-0.5 text-[10px] font-medium text-[#B89A63]">
                      Category: {item.category}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
