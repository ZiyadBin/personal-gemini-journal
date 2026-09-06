import React, { useState } from "react";
import {
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Clock,
  Compass,
} from "lucide-react";
import { ReflectionEntry } from "../types";
import ReactMarkdown from "react-markdown";

interface ExploreJournalViewProps {
  entries: ReflectionEntry[];
  onOpenEntry?: (entry: ReflectionEntry) => void;
  onNewReflection?: () => void;
}

const EXPLORE_SUGGESTIONS = [
  "Give me an overview of my recent thoughts and reflections",
  "What recurring themes keep appearing in my journal?",
  "What seems to give me the most energy or joy?",
  "Summarize the key reflections and progress from my entries",
  "What patterns or growth areas do you notice in my thoughts?",
  "What changed between my earlier reflections and now?",
];

interface ExplorationHistoryItem {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  modelUsed?: string;
  entriesAnalyzed: number;
}

export const ExploreJournalView: React.FC<ExploreJournalViewProps> = ({
  entries,
  onOpenEntry,
  onNewReflection,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ExplorationHistoryItem[]>([]);

  // Function to submit query to All-Record AI
  const handleExplore = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || query).trim();
    if (!promptToUse) return;

    if (entries.length === 0) {
      setError("You don't have any reflections yet. Create your first entry to begin exploring patterns!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build safe authorized context strictly from user's entries
      const sanitizedEntries = entries.slice(0, 20).map((entry) => ({
        title: entry.title || "Untitled Reflection",
        date: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date(entry.createdAt || entry.updatedAt)),
        category: entry.category,
        text: entry.journalText || "",
        themes: entry.insights?.keyThemes || [],
      }));

      const res = await fetch("/api/explore-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          entries: sanitizedEntries,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to explore journal patterns.");
      }

      const data = await res.json();

      const newItem: ExplorationHistoryItem = {
        id: `expl-${Date.now()}`,
        question: promptToUse,
        answer: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed,
        entriesAnalyzed: data.entryCountAnalyzed || sanitizedEntries.length,
      };

      setHistory((prev) => [newItem, ...prev]);
      setQuery("");
    } catch (err: any) {
      console.error("Explore journal error:", err);
      setError(err?.message || "Could not analyze journal history. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="explore-journal-view"
      className="flex-1 overflow-y-auto bg-[#FAF9FC] p-4 sm:p-6 md:p-8 font-sans"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Top Header Card */}
        <div className="text-center space-y-3 pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>AI Overview &middot; Cross-Entry Intelligence</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 tracking-tight">
            Ask ReflectAI
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Get an AI overview of your journal, uncover recurring themes, emotional patterns,
            and explore your personal reflection history.
          </p>

          {/* Privacy badge */}
          <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              Private &amp; User-Scoped &middot; Only analyzes your {entries.length} reflection{entries.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Search & Prompt Box */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#e9e6f0] shadow-sm space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExplore();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="explore-journal-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                placeholder="Ask about patterns in your journal (e.g. 'What themes keep coming up?')"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition disabled:opacity-50"
              />
            </div>

            <button
              id="submit-explore-btn"
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium rounded-2xl shadow-xs transition active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span className="hidden sm:inline">Exploring...</span>
                </>
              ) : (
                <>
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Prompt Suggestions */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-heading">
              Thought Starters:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXPLORE_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(suggestion);
                    handleExplore(suggestion);
                  }}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 transition text-left"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error notification if any */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center justify-between">
            <span>{error}</span>
            {entries.length === 0 && onNewReflection && (
              <button
                onClick={onNewReflection}
                className="underline font-semibold ml-2 text-rose-900"
              >
                Create Reflection
              </button>
            )}
          </div>
        )}

        {/* Empty state for zero reflections */}
        {entries.length === 0 && (
          <div className="p-8 rounded-3xl bg-white border border-dashed border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold font-heading text-slate-900">
              No reflections written yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Write a few journal entries, and ReflectAI will help you explore
              emerging themes and emotional shifts over time.
            </p>
            {onNewReflection && (
              <button
                onClick={onNewReflection}
                className="mt-2 px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-xl hover:bg-slate-800 transition"
              >
                Write Your First Reflection
              </button>
            )}
          </div>
        )}

        {/* Exploration Results / Sessions */}
        {history.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 font-heading">
              Exploration Insights ({history.length})
            </h2>

            {history.map((item) => (
              <div
                key={item.id}
                className="p-6 sm:p-7 rounded-3xl bg-white border border-[#e9e6f0] shadow-xs space-y-4"
              >
                {/* Question Row */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold font-heading text-slate-900">
                      &ldquo;{item.question}&rdquo;
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{item.timestamp}</span>
                    <span className="hidden sm:inline">&middot; Analyzed {item.entriesAnalyzed} entries</span>
                  </div>
                </div>

                {/* Answer Content rendered with Markdown */}
                <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed font-sans">
                  <ReactMarkdown>{item.answer}</ReactMarkdown>
                </div>

                {/* Model badge and respectful disclaimer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Gemini Cross-Reflection Synthesis</span>
                  <span className="italic">
                    Observations based strictly on your personal entries
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
