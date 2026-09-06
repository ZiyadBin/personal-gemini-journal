import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Share2,
  Copy,
  Download,
  Check,
  ShieldCheck,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  FileText,
} from "lucide-react";
import { ReflectionEntry, PhotoMemory } from "../types";
import { getCategoryTheme } from "../lib/categories";
import { ReflectLogo } from "./ReflectLogo";
import { resolvePhotoUrl } from "../lib/photoStorage";

interface ShareMemoryModalProps {
  isOpen: boolean;
  entry: ReflectionEntry | null;
  onClose: () => void;
}

/**
 * Splits journal text into multiple visually consistent cards based on rendered text capacity.
 */
function splitJournalIntoCardChunks(fullText: string, targetCapacity: number = 320): string[] {
  const trimmed = fullText.trim();
  if (!trimmed) {
    return ["A mindful moment captured with ReflectAI."];
  }

  if (trimmed.length <= targetCapacity) {
    return [trimmed];
  }

  const paragraphs = trimmed.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const candidate = currentChunk ? `${currentChunk}\n\n${para}` : para;
    if (candidate.length <= targetCapacity) {
      currentChunk = candidate;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }

      if (para.length <= targetCapacity) {
        currentChunk = para;
      } else {
        const sentences = para.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [para];
        for (const sentence of sentences) {
          const sTrimmed = sentence.trim();
          if (!sTrimmed) continue;
          const sCandidate = currentChunk ? `${currentChunk} ${sTrimmed}` : sTrimmed;
          if (sCandidate.length <= targetCapacity) {
            currentChunk = sCandidate;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = "";
            }
            if (sTrimmed.length <= targetCapacity) {
              currentChunk = sTrimmed;
            } else {
              const words = sTrimmed.split(/\s+/);
              for (const word of words) {
                const wCandidate = currentChunk ? `${currentChunk} ${word}` : word;
                if (wCandidate.length <= targetCapacity) {
                  currentChunk = wCandidate;
                } else {
                  if (currentChunk) chunks.push(currentChunk);
                  currentChunk = word;
                }
              }
            }
          }
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [trimmed];
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

export const ShareMemoryModal: React.FC<ShareMemoryModalProps> = ({
  isOpen,
  entry,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingImg, setDownloadingImg] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [customExcerpt, setCustomExcerpt] = useState("");
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Photo-related state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [resolvedPhotoUrls, setResolvedPhotoUrls] = useState<Record<string, string>>({});
  const [cardMode, setCardMode] = useState<"photo" | "text">("photo");
  const shareCardRef = useRef<HTMLDivElement>(null);

  const photos = useMemo(() => entry?.photos || [], [entry?.photos]);
  const hasPhotos = photos.length > 0;

  // Resolve photo URLs when entry opens
  useEffect(() => {
    if (isOpen && entry && hasPhotos) {
      let isMounted = true;
      setCardMode("photo");
      setSelectedPhotoIndex(0);

      const resolveAll = async () => {
        const urlMap: Record<string, string> = {};
        for (const photo of photos) {
          try {
            const url = await resolvePhotoUrl(
              entry.userId,
              entry.id,
              photo.id,
              photo.downloadUrl || photo.previewUrl
            );
            if (url) {
              urlMap[photo.id] = url;
            }
          } catch (err) {
            console.warn("Failed to resolve photo for share modal:", err);
          }
        }
        if (isMounted) {
          setResolvedPhotoUrls(urlMap);
        }
      };

      resolveAll();
      return () => {
        isMounted = false;
      };
    } else {
      setCardMode("text");
    }
  }, [isOpen, entry, hasPhotos, photos]);

  // Initialize excerpt from full entry journal text or summary
  useEffect(() => {
    if (entry) {
      const initialText =
        entry.journalText?.trim() ||
        entry.insights?.summary ||
        "A mindful moment captured with ReflectAI.";
      setCustomExcerpt(initialText);
      setActiveCardIndex(0);
      setCopied(false);
      setShareSuccess(null);
    }
  }, [entry]);

  // Compute text chunks
  const cardChunks = useMemo(() => {
    return splitJournalIntoCardChunks(customExcerpt, 320);
  }, [customExcerpt]);

  // Ensure active card index stays within bounds
  useEffect(() => {
    if (activeCardIndex >= cardChunks.length) {
      setActiveCardIndex(Math.max(0, cardChunks.length - 1));
    }
  }, [cardChunks.length, activeCardIndex]);

  if (!isOpen || !entry) return null;

  const activePhoto: PhotoMemory | undefined = photos[selectedPhotoIndex];
  const activePhotoUrl = activePhoto ? resolvedPhotoUrls[activePhoto.id] || activePhoto.downloadUrl || activePhoto.previewUrl : null;

  const theme = getCategoryTheme(entry.category);
  const dateStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(entry.createdAt || entry.updatedAt || Date.now()));

  const shareTitle = entry.title?.trim() || "Journal Reflection";
  const slug = shareTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "reflection";

  // Build plain text caption for clipboard / social sharing
  const captionText = `"${shareTitle}"
${customExcerpt}

${theme.name} · ${dateStr}
ReflectAI — Reflect. Think. Grow.`;

  // Helper to wrap canvas text
  const wrapCanvasText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const paragraphs = text.split("\n");
    const allLines: string[] = [];

    for (let p = 0; p < paragraphs.length; p++) {
      const para = paragraphs[p];
      if (!para) {
        if (allLines.length > 0 && p < paragraphs.length - 1) {
          allLines.push("");
        }
        continue;
      }
      const words = para.split(" ");
      let currentLine = words[0] || "";

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
          currentLine += " " + word;
        } else {
          allLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        allLines.push(currentLine);
      }
    }
    return allLines;
  };

  /**
   * Render either a Photo Card (with image + caption) or a Text Card to an HTML5 Canvas
   */
  const renderCardToCanvas = async (
    chunkText: string,
    includePhoto: boolean,
    photoUrlToUse?: string | null
  ): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const width = 1200;
    // Taller canvas when photo is included (1350px) to accommodate photo + full caption
    const height = includePhoto && photoUrlToUse ? 1350 : 800;
    canvas.width = width;
    canvas.height = height;

    // Base background with subtle gradient
    ctx.fillStyle = "#FAF9FC";
    ctx.fillRect(0, 0, width, height);

    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "rgba(238, 242, 255, 0.85)");
    grad.addColorStop(0.5, "rgba(250, 245, 255, 0.65)");
    grad.addColorStop(1, "rgba(240, 253, 250, 0.55)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Inner card shape
    const cardPadding = 60;
    const cardW = width - cardPadding * 2;
    const cardH = height - cardPadding * 2;

    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;

    const r = 32;
    ctx.beginPath();
    ctx.moveTo(cardPadding + r, cardPadding);
    ctx.lineTo(cardPadding + cardW - r, cardPadding);
    ctx.quadraticCurveTo(cardPadding + cardW, cardPadding, cardPadding + cardW, cardPadding + r);
    ctx.lineTo(cardPadding + cardW, cardPadding + cardH - r);
    ctx.quadraticCurveTo(cardPadding + cardW, cardPadding + cardH, cardPadding + cardW - r, cardPadding + cardH);
    ctx.lineTo(cardPadding + r, cardPadding + cardH);
    ctx.quadraticCurveTo(cardPadding, cardPadding + cardH, cardPadding, cardPadding + cardH - r);
    ctx.lineTo(cardPadding, cardPadding + r);
    ctx.quadraticCurveTo(cardPadding, cardPadding, cardPadding + r, cardPadding);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Top Header: ReflectAI branding
    ctx.font = "bold 32px 'Space Grotesk', -apple-system, sans-serif";
    ctx.fillStyle = "#0F172A";
    ctx.fillText("ReflectAI", cardPadding + 50, cardPadding + 75);

    ctx.font = "18px -apple-system, sans-serif";
    ctx.fillStyle = "#64748B";
    ctx.fillText("Mindful Journal & Visual Memory", cardPadding + 50, cardPadding + 106);

    ctx.font = "18px -apple-system, sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.textAlign = "right";
    ctx.fillText(dateStr, cardPadding + cardW - 50, cardPadding + 85);
    ctx.textAlign = "left";

    let currentY = cardPadding + 140;

    // If Photo Mode: Draw the user photo with rounded corners
    if (includePhoto && photoUrlToUse) {
      try {
        const img = await loadImage(photoUrlToUse);
        const photoBoxW = cardW - 100;
        const photoBoxH = 560; // Clean 16:9 / balanced box
        const photoX = cardPadding + 50;
        const photoY = currentY;

        ctx.save();
        // Rounded clip for photo
        const pr = 20;
        ctx.beginPath();
        ctx.moveTo(photoX + pr, photoY);
        ctx.lineTo(photoX + photoBoxW - pr, photoY);
        ctx.quadraticCurveTo(photoX + photoBoxW, photoY, photoX + photoBoxW, photoY + pr);
        ctx.lineTo(photoX + photoBoxW, photoY + photoBoxH - pr);
        ctx.quadraticCurveTo(photoX + photoBoxW, photoY + photoBoxH, photoX + photoBoxW - pr, photoY + photoBoxH);
        ctx.lineTo(photoX + pr, photoY + photoBoxH);
        ctx.quadraticCurveTo(photoX, photoY + photoBoxH, photoX, photoY + photoBoxH - pr);
        ctx.lineTo(photoX, photoY + pr);
        ctx.quadraticCurveTo(photoX, photoY, photoX + pr, photoY);
        ctx.closePath();
        ctx.clip();

        // Calculate aspect ratio fill
        const imgAspect = img.width / img.height;
        const boxAspect = photoBoxW / photoBoxH;
        let sW, sH, sX, sY;

        if (imgAspect > boxAspect) {
          sH = img.height;
          sW = img.height * boxAspect;
          sX = (img.width - sW) / 2;
          sY = 0;
        } else {
          sW = img.width;
          sH = img.width / boxAspect;
          sX = 0;
          sY = (img.height - sH) / 2;
        }

        ctx.drawImage(img, sX, sY, sW, sH, photoX, photoY, photoBoxW, photoBoxH);
        ctx.restore();

        // Subtle photo outline
        ctx.strokeStyle = "rgba(0,0,0,0.06)";
        ctx.lineWidth = 2;
        ctx.strokeRect(photoX, photoY, photoBoxW, photoBoxH);

        currentY += photoBoxH + 45;
      } catch (err) {
        console.warn("Could not load image onto canvas:", err);
      }
    }

    // Title / Headline
    ctx.font = "bold 38px 'Space Grotesk', -apple-system, sans-serif";
    ctx.fillStyle = "#0F172A";
    const titleLines = wrapCanvasText(ctx, `"${shareTitle}"`, cardW - 100);
    for (const line of titleLines.slice(0, 2)) {
      ctx.fillText(line, cardPadding + 50, currentY);
      currentY += 46;
    }

    // Caption Body (Reflection Text)
    ctx.font = "italic 24px -apple-system, sans-serif";
    ctx.fillStyle = "#334155";
    currentY += 12;
    const bodyLines = wrapCanvasText(ctx, chunkText, cardW - 100);
    const maxBodyLines = includePhoto ? 5 : 8;
    for (const line of bodyLines.slice(0, maxBodyLines)) {
      if (line === "") {
        currentY += 16;
      } else {
        ctx.fillText(line, cardPadding + 50, currentY);
        currentY += 36;
      }
    }

    // Footer: Category badge + Tagline
    const footerY = cardPadding + cardH - 60;
    ctx.font = "bold 19px -apple-system, sans-serif";
    ctx.fillStyle = "#4F46E5";
    ctx.fillText(`${theme.name.toUpperCase()}  ·  ${dateStr}`, cardPadding + 50, footerY);

    ctx.font = "italic 18px -apple-system, sans-serif";
    ctx.fillStyle = "#94A3B8";
    ctx.textAlign = "right";
    ctx.fillText("Reflect. Think. Grow.", cardPadding + cardW - 50, footerY);
    ctx.textAlign = "left";

    return canvas;
  };

  // 1. Copy formatted text & caption to clipboard
  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setCopied(true);
      setShareSuccess("Copied photo caption & journal text!");
      setTimeout(() => {
        setCopied(false);
        setShareSuccess(null);
      }, 2500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // 2. Download text file
  const handleDownloadText = () => {
    const blob = new Blob([captionText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-reflection.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setShareSuccess("Downloaded reflection text.");
    setTimeout(() => setShareSuccess(null), 2500);
  };

  // 3. Native share sheet (with image attachment if supported)
  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  const handleNativeShare = async () => {
    if (!canNativeShare) {
      handleCopyCaption();
      return;
    }

    try {
      const isPhotoMode = Boolean(cardMode === "photo" && hasPhotos && activePhotoUrl);
      const textToRender = cardChunks[activeCardIndex] || customExcerpt;
      const canvas = await renderCardToCanvas(textToRender, isPhotoMode, activePhotoUrl);

      // Attempt file share if browser supports sharing files
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `${slug}-photo-card.png`, { type: "image/png" });
          const shareDataWithFile = {
            title: shareTitle,
            text: captionText,
            files: [file],
          };

          if (navigator.canShare && navigator.canShare(shareDataWithFile)) {
            try {
              await navigator.share(shareDataWithFile);
              setShareSuccess("Shared photo card successfully!");
              setTimeout(() => setShareSuccess(null), 2500);
              return;
            } catch (shareErr: any) {
              if (shareErr.name === "AbortError") return;
              console.warn("File share failed, falling back to text share:", shareErr);
            }
          }
        }

        // Fallback: standard share sheet without file
        try {
          await navigator.share({
            title: shareTitle,
            text: captionText,
          });
          setShareSuccess("Shared reflection caption successfully!");
          setTimeout(() => setShareSuccess(null), 2500);
        } catch (textShareErr: any) {
          if (textShareErr.name !== "AbortError") {
            handleCopyCaption();
          }
        }
      }, "image/png");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Share error:", err);
      }
    }
  };

  // 4. Download Current Card PNG (with photo + caption)
  const handleDownloadCurrentCard = async () => {
    try {
      setDownloadingImg(true);
      const isPhotoMode = Boolean(cardMode === "photo" && hasPhotos && activePhotoUrl);
      const textToRender = cardChunks[activeCardIndex] || customExcerpt;
      const canvas = await renderCardToCanvas(textToRender, isPhotoMode, activePhotoUrl);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          const photoSuffix = isPhotoMode ? "-photo-card" : "-card";
          link.download = `${slug}${photoSuffix}.png`;
          link.click();
          URL.revokeObjectURL(url);
          setShareSuccess(
            isPhotoMode
              ? "Downloaded photo card with caption!"
              : "Downloaded reflection card!"
          );
          setTimeout(() => setShareSuccess(null), 2500);
        }
        setDownloadingImg(false);
      }, "image/png");
    } catch (err) {
      console.error("Card download failed:", err);
      setDownloadingImg(false);
    }
  };

  // 5. Download All Text Cards sequentially
  const handleDownloadAllCards = async () => {
    if (cardChunks.length <= 1) {
      handleDownloadCurrentCard();
      return;
    }

    try {
      setDownloadingAll(true);
      setShareSuccess(`Preparing ${cardChunks.length} cards for download...`);

      for (let i = 0; i < cardChunks.length; i++) {
        const textToRender = cardChunks[i];
        const canvas = await renderCardToCanvas(textToRender, false, null);

        await new Promise<void>((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${slug}-card-${i + 1}-of-${cardChunks.length}.png`;
              link.click();
              setTimeout(() => {
                URL.revokeObjectURL(url);
                resolve();
              }, 300);
            } else {
              resolve();
            }
          }, "image/png");
        });
      }

      setShareSuccess(`Successfully downloaded all ${cardChunks.length} cards!`);
      setTimeout(() => setShareSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to download all cards:", err);
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div
      id="share-memory-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#e9e6f0] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-[#FAF9FC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold font-heading text-slate-900 leading-tight">
                Share Memory &amp; Photo
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-sans">
                Export your reflection as a visual card with photo &amp; caption
              </p>
            </div>
          </div>

          <button
            id="close-share-modal-btn"
            onClick={onClose}
            aria-label="Close share modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Card Mode Toggle if entry has photos */}
          {hasPhotos && (
            <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setCardMode("photo")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  cardMode === "photo"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span>Photo Card (with Caption)</span>
              </button>

              <button
                type="button"
                onClick={() => setCardMode("text")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  cardMode === "text"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Text Only Card</span>
              </button>
            </div>
          )}

          {/* Multiple Photos Selector if in Photo Mode */}
          {cardMode === "photo" && photos.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 font-heading uppercase tracking-wider">
                Select Photo to Feature ({photos.length} available)
              </span>
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {photos.map((photo, idx) => {
                  const url = resolvedPhotoUrls[photo.id] || photo.downloadUrl || photo.previewUrl;
                  const isSelected = idx === selectedPhotoIndex;
                  return (
                    <button
                      key={photo.id || idx}
                      type="button"
                      onClick={() => setSelectedPhotoIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 ring-2 ring-indigo-500/20"
                          : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {url ? (
                        <img
                          src={url}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/15 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Share Card Visual Preview */}
          <div
            ref={shareCardRef}
            className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 border border-slate-200 shadow-xs relative overflow-hidden transition-all"
          >
            {/* Header inside Card */}
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <ReflectLogo size={22} />
                <span className="text-xs sm:text-sm font-bold font-heading text-slate-900 tracking-tight">
                  ReflectAI
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-sans">
                  {dateStr}
                </span>
              </div>
            </div>

            {/* Featured Photo Preview if in Photo Mode */}
            {cardMode === "photo" && (
              <div className="mb-4 rounded-xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-100 aspect-video relative flex items-center justify-center">
                {activePhotoUrl ? (
                  <img
                    src={activePhotoUrl}
                    alt={activePhoto?.name || "Reflection memory"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-slate-300 animate-pulse" />
                    <span>Loading visual memory...</span>
                  </div>
                )}
              </div>
            )}

            {/* Title inside Card */}
            <h3 className="text-base sm:text-lg font-bold font-heading text-slate-900 mb-2.5 leading-snug">
              &ldquo;{shareTitle}&rdquo;
            </h3>

            {/* Caption Text inside Card */}
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans mb-4 italic border-l-2 border-indigo-300 pl-3 space-y-1.5 whitespace-pre-wrap">
              {cardMode === "photo"
                ? customExcerpt
                : cardChunks[activeCardIndex] || customExcerpt}
            </div>

            {/* Footer inside Card */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
                {theme.name}
              </span>
              <span className="text-[11px] font-sans text-slate-400">
                Reflect. Think. Grow.
              </span>
            </div>
          </div>

          {/* Full Caption Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="share-excerpt-input"
                className="block text-xs font-medium text-slate-700 font-sans"
              >
                Caption &amp; Reflection Text
              </label>
              <span className="text-[11px] text-slate-400 font-sans">
                Included in export and share
              </span>
            </div>
            <textarea
              id="share-excerpt-input"
              value={customExcerpt}
              onChange={(e) => setCustomExcerpt(e.target.value)}
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 bg-white font-sans resize-none"
              placeholder="Custom caption for your photo reflection..."
            />
          </div>

          {/* Privacy Consent Banner */}
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-600 leading-relaxed font-sans">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Private &amp; Secure:</strong> This creates a temporary export for you to share or download. Your private journal in Firestore remains protected and confidential.
            </p>
          </div>

          {/* Feedback banner */}
          {shareSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{shareSuccess}</span>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Controls */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#FAF9FC] border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Photo Card Button */}
            <button
              id="share-download-img-btn"
              type="button"
              disabled={downloadingImg || downloadingAll}
              onClick={handleDownloadCurrentCard}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-medium rounded-xl shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {downloadingImg
                  ? "Generating..."
                  : cardMode === "photo" && hasPhotos
                  ? "Download Photo Card"
                  : "Download Card"}
              </span>
            </button>

            {/* Copy Caption Button */}
            <button
              id="share-copy-caption-btn"
              type="button"
              onClick={handleCopyCaption}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium rounded-xl shadow-2xs transition active:scale-[0.98] cursor-pointer"
              title="Copy caption text to clipboard"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{copied ? "Copied" : "Copy Caption"}</span>
            </button>

            {/* Native share sheet if supported */}
            {canNativeShare && (
              <button
                id="share-native-btn"
                type="button"
                onClick={handleNativeShare}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-xl shadow-2xs transition active:scale-[0.98] cursor-pointer"
                title="Share via device share sheet"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Share</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadText}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium underline cursor-pointer"
          >
            Export .txt
          </button>
        </div>
      </div>
    </div>
  );
};
