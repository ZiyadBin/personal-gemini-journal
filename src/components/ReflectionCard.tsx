import React from "react";
import { Sparkles, Image as ImageIcon, MessageSquare, Share2, Trash2, ArrowUpRight } from "lucide-react";
import { ReflectionEntry } from "../types";
import { getCategoryTheme } from "../lib/categories";
import { CloudPhotoThumbnail } from "./CloudPhotoThumbnail";

interface ReflectionCardProps {
  entry: ReflectionEntry;
  onSelect: (entry: ReflectionEntry) => void;
  onShare?: (entry: ReflectionEntry, e: React.MouseEvent) => void;
  onDelete?: (entry: ReflectionEntry, e: React.MouseEvent) => void;
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  entry,
  onSelect,
  onShare,
  onDelete,
}) => {
  const theme = getCategoryTheme(entry.category);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(entry.createdAt || entry.updatedAt || Date.now()));

  const displayTitle = entry.title?.trim() || "Untitled Reflection";
  const displayPreview =
    entry.journalText?.trim() ||
    (entry.insights?.summary ? entry.insights.summary : "No written content yet. Click to write your thoughts.");

  const hasPhotos = Array.isArray(entry.photos) && entry.photos.length > 0;
  const hasInsights = Boolean(entry.insights && (entry.insights.summary || entry.insights.keyThemes?.length));
  const hasMessages = Boolean(entry.messages && entry.messages.length > 0);

  return (
    <div
      id={`reflection-card-${entry.id}`}
      onClick={() => onSelect(entry)}
      className={`group relative text-left p-5 rounded-2xl bg-white border ${theme.cardBorder} hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer flex flex-col justify-between`}
    >
      {/* Top row: Category Pill + Date + Quick Actions */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
              {theme.name}
            </span>

            {/* Optional Photo Indicator */}
            {hasPhotos && (
              <span
                title={`${entry.photos?.length} linked photo memory`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-sky-50 border border-sky-200/80 text-sky-700 font-medium"
              >
                <ImageIcon className="w-3 h-3 text-sky-500" />
                <span>{entry.photos?.length}</span>
              </span>
            )}

            {/* Optional AI Insights Indicator */}
            {hasInsights && (
              <span
                title="AI Insights generated"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-50 border border-purple-200/80 text-purple-700 font-medium"
              >
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>Insights</span>
              </span>
            )}

            {/* Optional Companion dialogue indicator */}
            {hasMessages && (
              <span
                title={`${entry.messages.length} companion reflections`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-slate-100 border border-slate-200 text-slate-600 font-medium"
              >
                <MessageSquare className="w-3 h-3 text-slate-500" />
                <span>{entry.messages.length}</span>
              </span>
            )}
          </div>

          <span className="text-xs text-slate-400 shrink-0 font-sans">
            {formattedDate}
          </span>
        </div>

        {/* Card Title */}
        <h3 className="text-base font-semibold font-heading text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-1 mb-2">
          {displayTitle}
        </h3>

        {/* Short Content Preview (2-3 lines clamped) */}
        <p className="text-sm text-slate-600 leading-relaxed font-sans line-clamp-2">
          {displayPreview}
        </p>

        {/* If entry has photos, show a subtle miniature photo strip preview */}
        {hasPhotos && (
          <div className="mt-3 flex items-center gap-2 overflow-hidden">
            {entry.photos?.slice(0, 3).map((photo) => (
              <div
                key={photo.id}
                className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200/80 overflow-hidden shrink-0 relative"
              >
                <CloudPhotoThumbnail
                  photo={photo}
                  isMini
                  userId={entry.userId}
                  reflectionId={entry.id}
                />
              </div>
            ))}
            {(entry.photos?.length || 0) > 3 && (
              <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-xs font-semibold text-slate-500 shrink-0">
                +{(entry.photos?.length || 0) - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Card Footer: Actions on hover / mobile touch */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="inline-flex items-center gap-1 text-slate-500 font-medium group-hover:text-blue-600 transition-colors">
          <span>Read &amp; Reflect</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </span>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {onShare && (
            <button
              type="button"
              onClick={(e) => onShare(entry, e)}
              title="Share Memory"
              aria-label="Share Memory"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => onDelete(entry, e)}
              title="Delete reflection"
              aria-label="Delete reflection"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
