import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ReflectionEntry, AuthUserState } from "../types";
import { ReflectionCard } from "./ReflectionCard";
import {
  getAllCategories,
  CATEGORIES_UPDATED_EVENT,
} from "../lib/categories";
import { CategoryManagerModal } from "./CategoryManagerModal";

interface MyJournalProps {
  user: AuthUserState;
  entries: ReflectionEntry[];
  onNewReflection: () => void;
  onAskReflectAI: () => void;
  onSelectReflection: (entry: ReflectionEntry) => void;
  onShareReflection: (entry: ReflectionEntry, e: React.MouseEvent) => void;
  onDeleteReflection: (entry: ReflectionEntry, e: React.MouseEvent) => void;
  onSaveReflection?: (entry: ReflectionEntry) => Promise<void>;
}

export const MyJournal: React.FC<MyJournalProps> = ({
  user,
  entries,
  onNewReflection,
  onAskReflectAI,
  onSelectReflection,
  onShareReflection,
  onDeleteReflection,
  onSaveReflection,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>(getAllCategories());

  // Category horizontal scroll state
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and overflow
  const checkCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  // Listen for category updates
  useEffect(() => {
    const handleUpdate = () => {
      setCategoriesList(getAllCategories());
    };
    window.addEventListener(CATEGORIES_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(CATEGORIES_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  // Update category scroll buttons on resize or list changes
  useEffect(() => {
    checkCategoryScroll();
    const el = categoryScrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkCategoryScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [categoriesList]);

  const handleScrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const amount = direction === "left" ? -240 : 240;
      categoryScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(checkCategoryScroll, 300);
    }
  };

  // Smooth scroll down to My Reflections section
  const handleScrollToReflections = () => {
    const section = document.getElementById("my-reflections-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // 1. Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = user?.displayName?.split(" ")[0] || "there";

  // 2. Statistics derived directly from real Firestore data
  const stats = useMemo(() => {
    const total = entries.length;
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    let thisWeekCount = 0;
    const categorySet = new Set<string>();

    entries.forEach((e) => {
      const timestamp = e.createdAt || e.updatedAt || 0;
      if (timestamp >= oneWeekAgo) {
        thisWeekCount++;
      }
      if (e.category) categorySet.add(e.category);
    });

    return {
      total,
      thisWeekCount,
      categoriesCount: categorySet.size,
    };
  }, [entries]);

  // 3. Category count mapping
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: entries.length };
    entries.forEach((e) => {
      const cat = e.category || "Personal Growth";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [entries]);

  // 4. Filtered reflections based on search query & category selection
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (entry.category || "").toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCategory) return false;

      if (!searchTerm.trim()) return true;

      const q = searchTerm.toLowerCase();
      const matchTitle = entry.title?.toLowerCase().includes(q) || false;
      const matchText = entry.journalText?.toLowerCase().includes(q) || false;
      const matchSummary = entry.insights?.summary?.toLowerCase().includes(q) || false;
      const matchTags = entry.insights?.keyThemes?.some((t) => t.toLowerCase().includes(q)) || false;

      return matchTitle || matchText || matchSummary || matchTags;
    });
  }, [entries, selectedCategory, searchTerm]);

  // Handle category rename and propagation to existing reflections
  const handleCategoryRenamed = async (oldName: string, newName: string) => {
    if (onSaveReflection) {
      const affected = entries.filter((e) => e.category?.toLowerCase() === oldName.toLowerCase());
      for (const item of affected) {
        try {
          await onSaveReflection({ ...item, category: newName });
        } catch (err) {
          console.warn("Failed to propagate category rename to reflection:", err);
        }
      }
    }
    if (selectedCategory.toLowerCase() === oldName.toLowerCase()) {
      setSelectedCategory(newName);
    }
  };

  // Handle category delete and fallback assignment
  const handleCategoryDeleted = async (deletedName: string) => {
    if (onSaveReflection) {
      const affected = entries.filter((e) => e.category?.toLowerCase() === deletedName.toLowerCase());
      for (const item of affected) {
        try {
          await onSaveReflection({ ...item, category: "Personal Growth" });
        } catch (err) {
          console.warn("Failed to update reflection on category delete:", err);
        }
      }
    }
    if (selectedCategory.toLowerCase() === deletedName.toLowerCase()) {
      setSelectedCategory("all");
    }
  };

  return (
    <div
      id="my-journal-view"
      className="flex-1 overflow-y-auto bg-[#FAF9FC] p-4 sm:p-6 md:p-8 font-sans scroll-smooth"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
              {greeting}, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
              Welcome to <span className="font-semibold text-slate-800">ReflectAI</span> — your private space for mindful reflection, thoughts, and memory.
            </p>
          </div>

          <button
            id="my-journal-new-btn"
            type="button"
            onClick={onNewReflection}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs shadow-sky-600/20 transition active:scale-[0.98] self-start sm:self-auto shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>
        </div>

        {/* Real Data Summary Stats */}
        <div
          id="journal-stats-grid"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          {/* Total Reflections - Clickable navigation to My Reflections section */}
          <button
            id="journal-stat-total-reflections"
            type="button"
            onClick={handleScrollToReflections}
            className="p-3.5 sm:p-4 md:p-5 rounded-2xl bg-white hover:bg-purple-50/30 border border-[#e9e6f0] hover:border-purple-300/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-xs transition flex items-center justify-between gap-3 text-left cursor-pointer group active:scale-[0.99]"
            title="Click to jump to My Reflections"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-purple-50 border border-purple-100/80 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
                  Total Reflections
                </p>
                <p className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-0.5">
                  {stats.total}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 group-hover:bg-purple-100/90 border border-purple-200/80 text-purple-800 text-xs font-medium transition shrink-0">
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5 text-purple-700 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* This Week */}
          <div className="p-3.5 sm:p-4 md:p-5 rounded-2xl bg-white border border-[#e9e6f0] shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-sky-50 border border-sky-100/80 text-sky-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
                This Week
              </p>
              <p className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-0.5">
                {stats.thisWeekCount}
              </p>
            </div>
          </div>

          {/* Categories Used - Interactive Manager Card */}
          <button
            id="stat-categories-manage-card"
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 md:p-5 rounded-2xl bg-white hover:bg-amber-50/30 border border-[#e9e6f0] hover:border-amber-300/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-xs transition flex items-center justify-between gap-3 text-left cursor-pointer group active:scale-[0.99]"
            title="Click to view, edit, and manage categories"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-50 border border-amber-100/80 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 font-heading uppercase tracking-wider">
                  Categories
                </p>
                <p className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-0.5">
                  {stats.categoriesCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 group-hover:bg-amber-100/90 border border-amber-200/80 text-amber-800 text-xs font-medium transition shrink-0">
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* Ask ReflectAI Spotlight Banner */}
        <div
          id="journal-ai-overview-banner"
          className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-sky-50/60 to-purple-50/70 border border-indigo-100/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Ask ReflectAI &middot; AI Overview</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900">
              Explore patterns &amp; themes across your journal
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              Ask ReflectAI to synthesize your reflections, uncover recurring insights, or answer questions about your personal journey.
            </p>
          </div>

          <button
            id="journal-banner-ask-reflectai-btn"
            type="button"
            onClick={onAskReflectAI}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 text-xs sm:text-sm font-medium rounded-xl shadow-2xs hover:shadow-xs transition flex items-center gap-2 shrink-0 active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Ask ReflectAI</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Reflections Section with Search & Category Filter */}
        <div id="my-reflections-section" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">
                My Reflections {entries.length > 0 && `(${entries.length})`}
              </h2>
              <p className="text-xs text-slate-500">
                Browse, search, and revisit your thoughts and memories
              </p>
            </div>

            {/* Search Bar */}
            {entries.length > 0 && (
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="journal-search-input"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search thoughts, themes, titles..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200/90 rounded-xl placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Category Filter Chips with Horizontal Scroll Controls */}
          <div className="relative flex items-center group/catscroll w-full">
            {/* Scroll Left Button */}
            {canScrollLeft && (
              <button
                id="category-scroll-left-btn"
                type="button"
                onClick={() => handleScrollCategories("left")}
                className="absolute left-0 z-10 p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-full shadow-md border border-slate-200 transition cursor-pointer -translate-x-1"
                title="Scroll categories left"
                aria-label="Scroll categories left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Category Chips Container */}
            <div
              id="journal-category-chips"
              ref={categoryScrollRef}
              onScroll={checkCategoryScroll}
              onWheel={(e) => {
                if (categoryScrollRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                  categoryScrollRef.current.scrollLeft += e.deltaY;
                  checkCategoryScroll();
                }
              }}
              className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1.5 scroll-smooth w-full px-1"
            >
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  selectedCategory === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <span>All</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === "all"
                      ? "bg-slate-700 text-slate-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {categoryCounts["all"] || 0}
                </span>
              </button>

              {categoriesList.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const isSelected =
                  selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                    }`}
                  >
                    <span>{cat}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected
                            ? "bg-slate-700 text-slate-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Button */}
            {canScrollRight && (
              <button
                id="category-scroll-right-btn"
                type="button"
                onClick={() => handleScrollCategories("right")}
                className="absolute right-0 z-10 p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-full shadow-md border border-slate-200 transition cursor-pointer translate-x-1"
                title="Scroll categories right"
                aria-label="Scroll categories right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Entries Grid / Empty States */}
          {entries.length === 0 ? (
            /* First-time user empty state */
            <div
              id="journal-first-time-empty"
              className="p-10 sm:p-14 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-4 shadow-2xs"
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100/80 text-sky-600 flex items-center justify-center mx-auto shadow-2xs">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold font-heading text-slate-900">
                  Your journal starts here.
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-sans">
                  Capture your first reflection, attach visual memories, and invite Gemini to reflect with you.
                </p>
              </div>
              <button
                id="empty-journal-new-btn"
                type="button"
                onClick={onNewReflection}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              >
                Create Your First Reflection
              </button>
            </div>
          ) : filteredEntries.length === 0 ? (
            /* Search / Filter empty state */
            <div
              id="journal-search-empty"
              className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-3"
            >
              <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-semibold font-heading text-slate-900">
                No matching reflections
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No reflections match &ldquo;{searchTerm || selectedCategory}&rdquo;. Try another search term or clear filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 underline cursor-pointer"
              >
                Clear search &amp; filters
              </button>
            </div>
          ) : (
            /* Cards Grid */
            <div
              id="my-journal-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredEntries.map((entry) => (
                <ReflectionCard
                  key={entry.id}
                  entry={entry}
                  onSelect={onSelectReflection}
                  onShare={onShareReflection}
                  onDelete={onDeleteReflection}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        entries={entries}
        onSelectCategory={(cat) => setSelectedCategory(cat)}
        onCategoryRenamed={handleCategoryRenamed}
        onCategoryDeleted={handleCategoryDeleted}
      />
    </div>
  );
};
