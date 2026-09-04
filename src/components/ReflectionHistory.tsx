import React, { useState, useMemo } from "react";
import { Search, Plus, Trash2, Calendar, MessageSquare, BookOpen, X } from "lucide-react";
import { ReflectionEntry } from "../types";

interface ReflectionHistoryProps {
  entries: ReflectionEntry[];
  selectedId: string | null;
  onSelect: (entry: ReflectionEntry) => void;
  onNew: () => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
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
      className="w-full md:w-80 lg:w-88 border-r border-zinc-800 bg-zinc-950 flex flex-col h-[calc(100vh-64px)] shrink-0"
    >
      {/* Top Header & Search */}
      <div className="p-4 border-b border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
              Past Reflections
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">
              {entries.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="history-new-btn"
              onClick={onNew}
              title="Start New Entry"
              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-900 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
            </button>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search entries & insights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/80 border border-zinc-800 text-zinc-200 rounded-lg placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 focus:bg-zinc-900 transition-colors"
          />
        </div>

        {/* Category filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                  : "bg-zinc-900 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div id="history-items-list" className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {filteredEntries.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-xs text-zinc-500 mb-3">
              {searchTerm || activeCategory !== "All"
                ? "No reflections match your filter."
                : "No saved reflections yet."}
            </p>
            <button
              id="history-empty-new-btn"
              onClick={onNew}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline"
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
                className={`group p-3 rounded-xl border transition cursor-pointer text-left relative ${
                  isSelected
                    ? "sidebar-item-active bg-zinc-900/90 border-zinc-700/80 shadow-xs"
                    : "bg-zinc-950/60 border-zinc-900 hover:border-zinc-800 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-xs font-semibold line-clamp-1 ${
                      isSelected ? "text-amber-300" : "text-zinc-200 group-hover:text-zinc-100"
                    }`}
                  >
                    {entry.title || "Untitled Reflection"}
                  </h3>
                  <button
                    id={`delete-entry-${entry.id}`}
                    onClick={(e) => onDelete(entry.id, e)}
                    title="Delete reflection"
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-1 rounded transition hover:bg-zinc-800/60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                  {entry.insights?.summary || entry.journalText || "Empty reflection..."}
                </p>

                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-800/70 text-[10px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    {formatDate(entry.updatedAt || entry.createdAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    {entry.messages && entry.messages.length > 0 && (
                      <span className="flex items-center gap-1 font-medium text-amber-300 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 rounded">
                        <MessageSquare className="w-2.5 h-2.5" />
                        {entry.messages.length}
                      </span>
                    )}
                    <span className="text-zinc-400 bg-zinc-900 border border-zinc-800/70 px-1.5 py-0.5 rounded font-normal">
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
