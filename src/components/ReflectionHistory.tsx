import React, { useState, useMemo } from "react";
import { Search, Plus, Trash2, Calendar, MessageSquare, BookOpen, X } from "lucide-react";
import { ReflectionEntry } from "../types";

interface ReflectionHistoryProps {
  entries: ReflectionEntry[];
  selectedId: string | null;
  onSelect: (entry: ReflectionEntry) => void;
  onNew: () => void;
  onDelete: (entry: ReflectionEntry, e: React.MouseEvent) => void;
  onCloseMobile?: () => void;
}

const CATEGORIES = [
  "All",
  "Personal Growth",
  "Work & Focus",
  "Creative Ideas",
  "Gratitude",
  "Mindfulness",
];

export const ReflectionHistory: React.FC<ReflectionHistoryProps> = ({
  entries,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  onCloseMobile,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.journalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.insights?.summary &&
          entry.insights.summary.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        activeCategory === "All" || entry.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [entries, searchTerm, activeCategory]);

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <aside
      id="reflection-history-panel"
      className="w-full h-full border-r border-[#e9e6f0] bg-white flex flex-col shrink-0 overflow-hidden"
    >
      {/* Top Header & Search */}
      <div className="p-3 border-b border-[#e9e6f0] space-y-2.5 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            <h2 className="text-xs font-semibold text-slate-900 font-heading tracking-tight">
              Past Reflections
            </h2>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-medium">
              {entries.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="history-new-btn"
              onClick={onNew}
              title="Start New Entry"
              className="p-1 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1 text-slate-500 hover:text-slate-800 rounded-lg"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-sky-50 border border-sky-200 text-sky-700 font-semibold shadow-2xs"
                  : "bg-slate-50 border border-slate-200/80 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div
        id="history-items-list"
        className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-[#FAF9FC]"
      >
        {filteredEntries.length === 0 ? (
          <div className="py-10 px-3 text-center">
            <p className="text-xs text-slate-400 mb-2">
              {searchTerm || activeCategory !== "All"
                ? "No matching reflections."
                : "No saved reflections yet."}
            </p>
            <button
              id="history-empty-new-btn"
              onClick={onNew}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
            >
              Write your first reflection
            </button>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isSelected = entry.id === selectedId;
            return (
              <div
                key={entry.id}
                id={`history-item-${entry.id}`}
                onClick={() => onSelect(entry)}
                className={`group p-2.5 rounded-xl border transition cursor-pointer text-left relative ${
                  isSelected
                    ? "bg-sky-50/70 border-sky-200 shadow-xs border-l-[3px] border-l-sky-500"
                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/70 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <h3
                    className={`text-xs font-semibold line-clamp-1 ${
                      isSelected
                        ? "text-sky-950 font-heading"
                        : "text-slate-800 group-hover:text-slate-900 font-heading"
                    }`}
                  >
                    {entry.title || "Untitled Reflection"}
                  </h3>
                  <button
                    id={`delete-entry-${entry.id}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(entry, e);
                    }}
                    title="Delete reflection"
                    aria-label={`Delete reflection: ${entry.title || "Untitled"}`}
                    className="opacity-70 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-lg transition hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                  {entry.insights?.summary || entry.journalText || "Empty reflection..."}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-slate-400" />
                    {formatDate(entry.updatedAt || entry.createdAt)}
                  </span>

                  <div className="flex items-center gap-1">
                    {entry.messages && entry.messages.length > 0 && (
                      <span className="flex items-center gap-0.5 font-medium text-sky-700 bg-sky-50 border border-sky-200/80 px-1 py-0.2 rounded text-[9px]">
                        <MessageSquare className="w-2 h-2" />
                        {entry.messages.length}
                      </span>
                    )}
                    <span className="text-slate-500 bg-slate-100 border border-slate-200/70 px-1 py-0.2 rounded text-[9px] font-normal truncate max-w-[80px]">
                      {entry.category || "Personal"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
