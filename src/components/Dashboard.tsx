import React, { useMemo } from "react";
import {
  Plus,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  Compass,
  TrendingUp,
} from "lucide-react";
import { ReflectionEntry, AuthUserState } from "../types";
import { ReflectionCard } from "./ReflectionCard";
import { getCategoryTheme } from "../lib/categories";

interface DashboardProps {
  user: AuthUserState;
  entries: ReflectionEntry[];
  onNewReflection: () => void;
  onViewAllReflections: () => void;
  onExploreJournal: () => void;
  onSelectReflection: (entry: ReflectionEntry) => void;
  onShareReflection: (entry: ReflectionEntry, e: React.MouseEvent) => void;
  onDeleteReflection: (entry: ReflectionEntry, e: React.MouseEvent) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  entries,
  onNewReflection,
  onViewAllReflections,
  onExploreJournal,
  onSelectReflection,
  onShareReflection,
  onDeleteReflection,
}) => {
  // 1. Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const userName = user.displayName?.split(" ")[0] || (user.isAnonymous ? "Friend" : "there");

  // 2. Compute compact, REAL statistics based purely on real entries (Zero fake data)
  const stats = useMemo(() => {
    const total = entries.length;

    // Reflections this week (past 7 days)
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeekCount = entries.filter(
      (e) => (e.createdAt || e.updatedAt || 0) >= oneWeekAgo
    ).length;

    // Categories used
    const categorySet = new Set<string>();
    entries.forEach((e) => {
      if (e.category) categorySet.add(e.category);
    });

    return {
      total,
      thisWeekCount,
      categoriesCount: categorySet.size,
      categoryNames: Array.from(categorySet).slice(0, 3),
    };
  }, [entries]);

  // 3. Most recent reflections (up to 4-6)
  const recentEntries = useMemo(() => {
    return entries.slice(0, 6);
  }, [entries]);

  return (
    <div
      id="dashboard-view"
      className="flex-1 overflow-y-auto bg-[#FAF9FC] p-4 sm:p-6 md:p-8 font-sans"
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
              {greeting}, {userName}
            </h1>
            <p className="text-sm text-slate-600 font-sans leading-relaxed">
              Welcome back to your quiet space for mindful thought, memory, and personal reflection.
            </p>
          </div>

          {/* Primary Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="dashboard-new-reflection-btn"
              onClick={onNewReflection}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs shadow-sky-600/20 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>New Reflection</span>
            </button>
          </div>
        </div>

        {/* Real Data Summary Stats - Uncongested 2-column mobile + 3-column desktop layout */}
        <div
          id="dashboard-stats-grid"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
        >
          {/* Total Reflections */}
          <button
            id="dashboard-stat-total-reflections"
            type="button"
            onClick={onViewAllReflections}
            className="p-3.5 sm:p-4 md:p-5 rounded-2xl bg-white hover:bg-purple-50/30 border border-[#e9e6f0] hover:border-purple-300/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-xs transition flex items-center gap-3 sm:gap-4 text-left cursor-pointer group active:scale-[0.99]"
            title="View all reflections in My Journal"
          >
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

          {/* Categories Used */}
          <div
            onClick={onViewAllReflections}
            className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 md:p-5 rounded-2xl bg-white hover:bg-amber-50/30 border border-[#e9e6f0] hover:border-amber-300/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-xs transition flex items-center justify-between gap-3 text-left cursor-pointer group active:scale-[0.99]"
            title="View categories in My Journal"
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
          </div>
        </div>

        {/* AI Spotlight Section: Explore My Journal */}
        <div
          id="dashboard-ai-spotlight"
          className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-indigo-50/70 via-sky-50/50 to-purple-50/60 border border-indigo-100/80 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Explore My Journal</span>
            </div>
            <h2 className="text-lg font-bold font-heading text-slate-900">
              Discover patterns across your reflections
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              Ask Gemini to analyze themes, emotional progress, and recurring insights
              across your entire journal history.
            </p>
          </div>

          <button
            id="dashboard-explore-ai-btn"
            onClick={onExploreJournal}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 text-xs sm:text-sm font-medium rounded-xl shadow-2xs hover:shadow-xs transition flex items-center gap-2 shrink-0 active:scale-[0.98]"
          >
            <span>Explore Journal</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </button>
        </div>

        {/* Recent Reflections Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-heading text-slate-900">
                Recent Reflections
              </h2>
              <p className="text-xs text-slate-500">
                Your latest journal thoughts and memories
              </p>
            </div>

            {entries.length > 0 && (
              <button
                id="dashboard-view-all-btn"
                onClick={onViewAllReflections}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
              >
                <span>View All Reflections ({entries.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Empty State for new users with ZERO reflections */}
          {entries.length === 0 ? (
            <div
              id="dashboard-empty-state"
              className="p-10 sm:p-12 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100/80 text-sky-600 flex items-center justify-center mx-auto shadow-2xs">
                <BookOpen className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold font-heading text-slate-900">
                  Your journal starts here.
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed font-sans">
                  Capture your first reflection and give Gemini something to explore with you.
                </p>
              </div>
              <button
                id="empty-state-new-btn"
                onClick={onNewReflection}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition active:scale-[0.98] inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Reflection</span>
              </button>
            </div>
          ) : (
            /* Cards Grid with responsive 1-col on mobile, 2-col on md, 3-col on xl */
            <div
              id="dashboard-recent-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {recentEntries.map((entry) => (
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
    </div>
  );
};
