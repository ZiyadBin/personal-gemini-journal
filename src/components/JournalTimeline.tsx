import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Calendar,
  Plus,
  Sparkles,
  BookOpen,
  SlidersHorizontal,
} from "lucide-react";
import { ReflectionEntry } from "../types";
import { CATEGORIES, getCategoryTheme } from "../lib/categories";
import { ReflectionCard } from "./ReflectionCard";

interface JournalTimelineProps {
  entries: ReflectionEntry[];
  onSelect: (entry: ReflectionEntry) => void;
  onNew: () => void;
  onShare: (entry: ReflectionEntry, e: React.MouseEvent) => void;
  onDelete: (entry: ReflectionEntry, e: React.MouseEvent) => void;
}

export const JournalTimeline: React.FC<JournalTimelineProps> = ({
  entries,
  onSelect,
  onNew,
  onShare,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 1. Filter entries based on search term and category
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchCategory =
        selectedCategory === "all" ||
        (entry.category || "").toLowerCase() === selectedCategory.toLowerCase();

      if (!matchCategory) return false;

      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      const titleMatch = (entry.title || "").toLowerCase().includes(q);
      const textMatch = (entry.journalText || "").toLowerCase().includes(q);
      const themeMatch = (entry.insights?.keyThemes || []).some((t) =>
        t.toLowerCase().includes(q)
      );

      return titleMatch || textMatch || themeMatch;
    });
  }, [entries, searchTerm, selectedCategory]);

  // 2. Group entries chronologically by Month/Year and subgroups (Today, Yesterday, or specific day)
  const groupedTimeline = useMemo(() => {
    const groups: Array<{
      monthYear: string;
      days: Array<{
        dayLabel: string;
        items: ReflectionEntry[];
      }>;
    }> = [];

    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const monthMap = new Map<string, Map<string, ReflectionEntry[]>>();

    for (const entry of filteredEntries) {
      const date = new Date(entry.createdAt || entry.updatedAt || Date.now());
      const monthYearKey = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      })
        .format(date)
        .toUpperCase();

      let dayLabel = "";
      if (date.toDateString() === todayStr) {
        dayLabel = "Today";
      } else if (date.toDateString() === yesterdayStr) {
        dayLabel = "Yesterday";
      } else {
        dayLabel = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(date);
      }

      if (!monthMap.has(monthYearKey)) {
        monthMap.set(monthYearKey, new Map());
      }

      const daysMap = monthMap.get(monthYearKey)!;
      if (!daysMap.has(dayLabel)) {
        daysMap.set(dayLabel, []);
      }
      daysMap.get(dayLabel)!.push(entry);
    }

    monthMap.forEach((daysMap, monthYear) => {
      const dayGroups: Array<{ dayLabel: string; items: ReflectionEntry[] }> = [];
      daysMap.forEach((items, dayLabel) => {
        dayGroups.push({ dayLabel, items });
      });
      groups.push({ monthYear, days: dayGroups });
    });

    return groups;
  }, [filteredEntries]);

  // Calculate category counts for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    for (const cat of CATEGORIES) {
      counts[cat] = 0;
    }
    for (const entry of entries) {
      const cat = entry.category || "Personal Growth";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [entries]);

  return (
    <div
      id="journal-timeline-view"
      className="flex-1 overflow-y-auto bg-[#FAF9FC] p-4 sm:p-6 md:p-8 font-sans"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Timeline Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
              Journal Timeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-sans mt-0.5">
              A chronological journey through your thoughts, memories, and insights.
            </p>
          </div>

          <button
            id="timeline-new-btn"
            onClick={onNew}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>
        </div>

        {/* Search & Category Filter Ribbon */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="timeline-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, reflection text, or themes..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              All ({categoryCounts.all || 0})
            </button>

            {CATEGORIES.map((cat) => {
              const theme = getCategoryTheme(cat);
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? `bg-slate-900 text-white shadow-2xs`
                      : `bg-white border ${theme.badgeBorder} ${theme.badgeText} hover:bg-slate-50`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
                  <span>{cat}</span>
                  <span className="text-[10px] opacity-70">
                    ({categoryCounts[cat] || 0})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Empty state: No reflections match filter */}
        {groupedTimeline.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold font-heading text-slate-900">
              {entries.length === 0
                ? "Your memory timeline is empty"
                : "No matching reflections found"}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {entries.length === 0
                ? "Start writing personal reflections to build your timeline and watch your thoughts evolve."
                : "Try clearing your search query or selecting a different category filter."}
            </p>
            {entries.length === 0 ? (
              <button
                onClick={onNew}
                className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-800 transition shadow-xs"
              >
                Write First Reflection
              </button>
            ) : (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          /* Chronological Timeline Groups */
          <div className="space-y-10">
            {groupedTimeline.map((group) => (
              <section key={group.monthYear} className="space-y-6">
                {/* Month/Year Heading (e.g. SEPTEMBER 2026) */}
                <div className="sticky top-0 z-10 py-1 bg-[#FAF9FC]/95 backdrop-blur-2xs flex items-center gap-3">
                  <span className="text-xs font-bold tracking-wider text-slate-500 uppercase font-heading bg-slate-200/80 px-2.5 py-1 rounded-md">
                    {group.monthYear}
                  </span>
                  <div className="flex-1 h-px bg-slate-200/70" />
                </div>

                {/* Day subgroups */}
                <div className="space-y-6 pl-1 sm:pl-3 border-l-2 border-slate-200/80 ml-2">
                  {group.days.map((day) => (
                    <div key={day.dayLabel} className="space-y-3 relative">
                      {/* Timeline dot & day label */}
                      <div className="flex items-center gap-2 -ml-[19px] sm:-ml-[21px]">
                        <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 shadow-2xs" />
                        <span className="text-xs font-semibold font-heading text-slate-700">
                          {day.dayLabel}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({day.items.length})
                        </span>
                      </div>

                      {/* Cards Grid for that day */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3 sm:pl-4">
                        {day.items.map((entry) => (
                          <ReflectionCard
                            key={entry.id}
                            entry={entry}
                            onSelect={onSelect}
                            onShare={onShare}
                            onDelete={onDelete}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
