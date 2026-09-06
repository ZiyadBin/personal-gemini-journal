import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  CheckSquare,
  Compass,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Check,
  Trash2,
  Image as ImageIcon,
  Share2,
  ArrowLeft,
  Plus,
  MapPin,
  X,
} from "lucide-react";
import { ReflectionEntry, ChatMessage, ReflectionInsights, PhotoMemory, JournalLocation } from "../types";
import { GeminiCompanion } from "./GeminiCompanion";
import { PhotoMemoriesModal } from "./PhotoMemoriesModal";
import { LocationPickerModal } from "./LocationPickerModal";
import { CloudPhotoThumbnail } from "./CloudPhotoThumbnail";
import { deletePhotoFromStorage } from "../lib/photoStorage";
import { getAllCategories, registerCategory } from "../lib/categories";

interface ReflectionEditorProps {
  entry: ReflectionEntry;
  onSave: (entry: ReflectionEntry) => Promise<void>;
  onDelete?: (entry: ReflectionEntry) => void;
  onBack?: () => void;
  onShare?: (entry: ReflectionEntry) => void;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
  mobileTab?: "journal" | "companion";
  onToggleHistoryDrawer?: () => void;
  historyCount?: number;
}

const PROMPT_SUGGESTIONS = [
  "What brought me genuine energy or friction today?",
  "What is a challenging situation I want to reframe?",
  "A creative spark or insight I want to explore deeper...",
  "What am I grateful for right now, and why?",
];

export const ReflectionEditor: React.FC<ReflectionEditorProps> = ({
  entry,
  onSave,
  onDelete,
  onBack,
  onShare,
  isSaving,
  saveError,
  onClearSaveError,
  mobileTab = "journal",
  onToggleHistoryDrawer,
  historyCount = 0,
}) => {
  const [title, setTitle] = useState(entry.title || "");
  const [journalText, setJournalText] = useState(entry.journalText || "");
  const [category, setCategory] = useState(entry.category || "Personal Growth");
  const [messages, setMessages] = useState<ChatMessage[]>(entry.messages || []);
  const [insights, setInsights] = useState<ReflectionInsights | undefined>(
    entry.insights
  );
  const [photos, setPhotos] = useState<PhotoMemory[]>(entry.photos || []);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Location state
  const [location, setLocation] = useState<JournalLocation | null | undefined>(entry.location);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Category selection via @ autocomplete & chip picker
  const [categoriesList, setCategoriesList] = useState<string[]>(() => getAllCategories());
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // Keep categories in sync with localStorage and other components
  useEffect(() => {
    const handleCategoriesUpdate = () => {
      setCategoriesList(getAllCategories());
    };
    window.addEventListener("reflectai_categories_updated", handleCategoriesUpdate);
    return () => window.removeEventListener("reflectai_categories_updated", handleCategoriesUpdate);
  }, []);

  // Collapsible Thought Starters
  const [isThoughtStartersOpen, setIsThoughtStartersOpen] = useState(false);

  // Tablet/desktop companion state
  const [companionDrawerOpen, setCompanionDrawerOpen] = useState(false);
  const [isDesktopCompanionOpen, setIsDesktopCompanionOpen] = useState(true);

  const handleToggleCompanion = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setCompanionDrawerOpen((prev) => !prev);
    } else {
      setIsDesktopCompanionOpen((prev) => !prev);
    }
  };

  // Chat & AI state
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  // Filtered categories for @ autocomplete
  const filteredCategories = categoriesList.filter((cat) =>
    cat.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  // Synchronize when active entry changes
  useEffect(() => {
    setTitle(entry.title || "");
    setJournalText(entry.journalText || "");
    setCategory(entry.category || "Personal Growth");
    setMessages(entry.messages || []);
    setInsights(entry.insights);
    setPhotos(entry.photos || []);
    setLocation(entry.location || null);
    setIsCategoryPickerOpen(false);
    setCategorySearchQuery("");
  }, [entry.id]);

  // Close category picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(e.target as Node)
      ) {
        setIsCategoryPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleManualSave = async () => {
    onClearSaveError();
    const updated: ReflectionEntry = {
      ...entry,
      title: title.trim() || "Untitled Reflection",
      journalText,
      category,
      messages,
      insights,
      photos,
      location: location || null,
      updatedAt: Date.now(),
    };

    try {
      await onSave(updated);
      setSaveSuccessNotification(true);
      setTimeout(() => setSaveSuccessNotification(false), 2500);
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleSelectLocation = async (loc: JournalLocation) => {
    setLocation(loc);
    const updated: ReflectionEntry = {
      ...entry,
      title: title.trim() || "Untitled Reflection",
      journalText,
      category,
      messages,
      insights,
      photos,
      location: loc,
      updatedAt: Date.now(),
    };
    try {
      await onSave(updated);
    } catch (err) {
      console.error("Failed to auto-save location:", err);
    }
  };

  const handleRemoveLocation = async () => {
    setLocation(null);
    const updated: ReflectionEntry = {
      ...entry,
      title: title.trim() || "Untitled Reflection",
      journalText,
      category,
      messages,
      insights,
      photos,
      location: null,
      updatedAt: Date.now(),
    };
    try {
      await onSave(updated);
    } catch (err) {
      console.error("Failed to auto-save location removal:", err);
    }
  };

  const handleSelectCategory = (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    registerCategory(trimmed);
    setCategoriesList(getAllCategories());
    setCategory(trimmed);
    setIsCategoryPickerOpen(false);
    setCategorySearchQuery("");

    // If an @ token exists in the textarea near cursor, cleanly strip it
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart || 0;
      const textBeforeCursor = journalText.slice(0, cursorPos);
      const textAfterCursor = journalText.slice(cursorPos);
      const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\-\s]{0,25})$/);

      if (atMatch) {
        const matchStart = textBeforeCursor.length - atMatch[0].length;
        const cleanText = textBeforeCursor.slice(0, matchStart) + textAfterCursor;
        setJournalText(cleanText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(matchStart, matchStart);
          }
        }, 0);
        return;
      }
      textareaRef.current.focus();
    }
  };

  const handleCreateAndSelectCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    handleSelectCategory(trimmed);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    // Check if user types @category at the start followed by space or newline -> auto register new category!
    const startAtMatch = newText.match(/^@([a-zA-Z0-9_\-\s]{2,25})[\s\n]/);
    if (startAtMatch) {
      const typedCatName = startAtMatch[1].trim();
      if (typedCatName && typedCatName.length >= 2) {
        registerCategory(typedCatName);
        setCategoriesList(getAllCategories());
        setCategory(typedCatName);
        setIsCategoryPickerOpen(false);
        setCategorySearchQuery("");

        // Strip the @name prefix from the journal body cleanly
        const remainingText = newText.slice(startAtMatch[0].length);
        setJournalText(remainingText);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(0, 0);
          }
        }, 0);
        return;
      }
    }

    setJournalText(newText);

    // Detect if user typed '@' or '@partialQuery' anywhere near cursor
    const textBeforeCursor = newText.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\-\s]{0,20})$/);

    if (atMatch) {
      setIsCategoryPickerOpen(true);
      setCategorySearchQuery(atMatch[1]);
      setSelectedCategoryIndex(0);
    } else if (isCategoryPickerOpen && !categorySearchQuery) {
      setIsCategoryPickerOpen(false);
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isCategoryPickerOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const count = Math.max(1, filteredCategories.length);
      setSelectedCategoryIndex((prev) => (prev + 1) % count);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const count = Math.max(1, filteredCategories.length);
      setSelectedCategoryIndex((prev) => (prev <= 0 ? count - 1 : prev - 1));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const targetCat = filteredCategories[selectedCategoryIndex] || filteredCategories[0];
      if (targetCat) {
        handleSelectCategory(targetCat);
      } else if (categorySearchQuery.trim()) {
        handleCreateAndSelectCategory(categorySearchQuery.trim());
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsCategoryPickerOpen(false);
    }
  };

  const handleSendChat = async (promptToSend?: string) => {
    const textToSend = (promptToSend || "").trim();
    if (!textToSend || isAiResponding) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsAiResponding(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          journalContext: journalText,
          history: messages.slice(-8),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `AI server returned error ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed,
      };

      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);

      // Persist reflection updates to Firestore
      const updatedEntry: ReflectionEntry = {
        ...entry,
        title: title.trim() || "Untitled Reflection",
        journalText,
        category,
        messages: finalMessages,
        insights,
        photos,
        location: location || null,
        updatedAt: Date.now(),
      };
      await onSave(updatedEntry);
    } catch (err: any) {
      console.error("Chat generation failed:", err);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `*Apologies, I encountered an issue: ${err.message || "Failed to reach Gemini"}. Please try again.*`,
        timestamp: new Date().toISOString(),
      };
      setMessages([...nextMessages, errorMessage]);
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleGenerateSummary = async () => {
    if ((!journalText.trim() && messages.length === 0) || isSummarizing) return;
    setIsSummarizing(true);
    onClearSaveError();

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: journalText,
          conversation: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate summary");
      }

      const data = await response.json();
      const nextInsights: ReflectionInsights = data.insights;
      setInsights(nextInsights);

      let nextTitle = title;
      if ((!title || title === "Untitled Reflection") && nextInsights.title) {
        nextTitle = nextInsights.title;
        setTitle(nextTitle);
      }

      const updatedEntry: ReflectionEntry = {
        ...entry,
        title: nextTitle,
        journalText,
        category,
        messages,
        insights: nextInsights,
        photos,
        location: location || null,
        updatedAt: Date.now(),
      };
      await onSave(updatedEntry);
    } catch (err: any) {
      console.error("Summarization error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddPhotos = async (newPhotos: PhotoMemory[]) => {
    const updatedPhotos = [...photos, ...newPhotos];
    setPhotos(updatedPhotos);

    // Save directly to Firestore so the photo reference is persisted across devices
    try {
      const updatedEntry: ReflectionEntry = {
        ...entry,
        title,
        journalText,
        category,
        messages,
        insights,
        photos: updatedPhotos,
        location: location || null,
        updatedAt: Date.now(),
      };
      await onSave(updatedEntry);
    } catch (err) {
      console.error("Failed to auto-save photo metadata:", err);
    }
  };

  const handleRemovePhoto = async (photoToRemove: PhotoMemory, index: number) => {
    const updatedPhotos = photos.filter((p, i) =>
      p.id ? p.id !== photoToRemove.id : i !== index
    );
    setPhotos(updatedPhotos);

    // Delete photo from Firestore subcollection and local cache
    if (photoToRemove.id) {
      try {
        await deletePhotoFromStorage(entry.userId, entry.id, photoToRemove.id);
      } catch (storageErr) {
        console.warn("Storage deletion warning (continuing to update Firestore):", storageErr);
      }
    }

    // Immediately update Firestore document to remove the metadata reference
    try {
      const updatedEntry: ReflectionEntry = {
        ...entry,
        title,
        journalText,
        category,
        messages,
        insights,
        photos: updatedPhotos,
        location: location || null,
        updatedAt: Date.now(),
      };
      await onSave(updatedEntry);
    } catch (err) {
      console.error("Failed to update Firestore after photo removal:", err);
    }
  };

  const wordCount = journalText.trim() ? journalText.trim().split(/\s+/).length : 0;

  // Render purely Gemini Companion when in mobile 'companion' tab
  if (mobileTab === "companion") {
    return (
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-[#FAF9FC]">
        <GeminiCompanion
          messages={messages}
          onSendMessage={handleSendChat}
          isAiResponding={isAiResponding}
          className="border-none"
        />
      </div>
    );
  }

  return (
    <div
      id="reflection-editor-container"
      className="flex-1 flex h-full overflow-hidden bg-[#FAF9FC] text-slate-800"
    >
      {/* Center Column: Journal Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Action Ribbon: Left (Back, History), Right (AI Companion, Save, Delete) */}
        <div className="border-b border-[#e9e6f0] bg-white px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 shrink-0">
          {/* Left: Back & History */}
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                id="editor-back-nav-btn"
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 px-3 py-1.5 rounded-xl transition cursor-pointer"
                title="Back to My Journal"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Back</span>
              </button>
            )}

            {onToggleHistoryDrawer && (
              <button
                id="editor-history-toggle-btn"
                type="button"
                onClick={onToggleHistoryDrawer}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl transition cursor-pointer"
                title="View Past Reflections"
              >
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                <span>History</span>
                {historyCount > 0 && (
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    ({historyCount})
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Right: AI Companion, Save & Delete */}
          <div className="flex items-center gap-2">
            <button
              id="editor-companion-toggle-btn"
              type="button"
              onClick={handleToggleCompanion}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition cursor-pointer ${
                companionDrawerOpen || isDesktopCompanionOpen
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-2xs font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200/90 text-slate-700"
              }`}
              title="Toggle Gemini AI Companion"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>AI Companion {messages.length > 0 && `(${messages.length})`}</span>
            </button>

            {/* Primary Save Button */}
            <button
              id="save-reflection-btn"
              type="button"
              onClick={handleManualSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white text-xs font-medium rounded-xl shadow-xs shadow-sky-600/20 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : saveSuccessNotification ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-200" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>
                {isSaving
                  ? "Saving..."
                  : saveSuccessNotification
                  ? "Saved"
                  : "Save"}
              </span>
            </button>

            {/* Delete Reflection Button */}
            {onDelete && (
              <button
                id="editor-delete-reflection-btn"
                type="button"
                onClick={() => onDelete({ ...entry, title: title || entry.title })}
                title="Delete this reflection"
                aria-label="Delete this reflection"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/90 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Error banner if save failed */}
        {saveError && (
          <div
            id="editor-save-error-banner"
            className="mx-4 sm:mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{saveError}</span>
            </div>
            <button
              onClick={handleManualSave}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-xs transition"
            >
              Retry Save
            </button>
          </div>
        )}

        {/* Writing Canvas Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#e9e6f0] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] p-5 sm:p-7 flex flex-col min-h-[560px]">
            {/* Title */}
            <div>
              <input
                id="reflection-title-input"
                type="text"
                placeholder="Title your reflection..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl sm:text-2xl font-heading font-semibold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-300 w-full"
              />
            </div>

            {/* Entry-Specific Controls: Category directly under title, plus Photos, Share, and AI Insights */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5 pb-3 border-b border-slate-100/90 mb-3">
              {/* Left: Category Picker & quick hint under title */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative" ref={categoryMenuRef}>
                  <button
                    id="category-picker-chip-btn"
                    type="button"
                    onClick={() => {
                      setIsCategoryPickerOpen((prev) => !prev);
                      setCategorySearchQuery("");
                      setSelectedCategoryIndex(0);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200/90 text-xs font-medium transition cursor-pointer"
                    title="Choose reflection category (or type @ in your entry)"
                  >
                    <span className="font-semibold text-sky-600">@</span>
                    <span className="font-medium text-slate-800">{category}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                  </button>

                  {/* Autocomplete / Dropdown Menu */}
                  {isCategoryPickerOpen && (
                    <div
                      id="category-autocomplete-menu"
                      className="absolute left-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-slate-200/90 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                        <span>Category</span>
                        <span className="text-[10px] text-slate-400">type @ in text</span>
                      </div>
                      <div className="py-1 max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredCategories.length === 0 ? (
                          categorySearchQuery.trim() ? (
                            <button
                              type="button"
                              onClick={() => handleCreateAndSelectCategory(categorySearchQuery.trim())}
                              className="w-full text-left px-3 py-2 text-xs text-sky-700 hover:bg-sky-50 font-medium flex items-center gap-1.5 transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-sky-600" />
                              <span>Add new &ldquo;{categorySearchQuery.trim()}&rdquo;</span>
                            </button>
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-400 italic">
                              No categories found
                            </div>
                          )
                        ) : (
                          <>
                            {filteredCategories.map((cat, idx) => {
                              const isSelected = cat === category;
                              const isHighlighted = idx === selectedCategoryIndex;
                              return (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => handleSelectCategory(cat)}
                                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition cursor-pointer ${
                                    isHighlighted || isSelected
                                      ? "bg-sky-50 text-sky-900 font-medium"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span className="text-sky-500 font-semibold text-[11px]">
                                      @
                                    </span>
                                    {cat}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-sky-600" />
                                  )}
                                </button>
                              );
                            })}

                            {categorySearchQuery.trim() &&
                              !filteredCategories.some(
                                (c) => c.toLowerCase() === categorySearchQuery.trim().toLowerCase()
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => handleCreateAndSelectCategory(categorySearchQuery.trim())}
                                  className="w-full text-left px-3 py-1.5 text-xs text-sky-700 hover:bg-sky-50 font-medium flex items-center gap-1.5 transition cursor-pointer border-t border-slate-100 mt-1"
                                >
                                  <Plus className="w-3.5 h-3.5 text-sky-600" />
                                  <span>Add &ldquo;{categorySearchQuery.trim()}&rdquo;</span>
                                </button>
                              )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                  Type <span className="font-mono text-sky-600 bg-sky-50 px-1 py-0.2 rounded border border-sky-100 font-semibold">@</span> to categorize
                </span>
              </div>

              {/* Right: Photos, Share & AI Insights inside the entry card */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {/* Photos Modal Trigger */}
                <button
                  id="editor-add-photos-btn"
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-medium transition cursor-pointer"
                  title="Attach subtle visual memories"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>Photos {photos.length > 0 && `(${photos.length})`}</span>
                </button>

                {/* Location Chip or Add Location Button */}
                {location?.placeName ? (
                  <div
                    id="editor-location-chip"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/90 rounded-lg text-xs font-medium"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="truncate max-w-[120px] sm:max-w-[170px] hover:underline text-left cursor-pointer"
                      title={`Location: ${location.placeName}. Click to edit.`}
                    >
                      {location.placeName}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveLocation}
                      className="text-emerald-500 hover:text-rose-600 p-0.5 rounded cursor-pointer transition"
                      title="Remove location"
                      aria-label="Remove location"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    id="editor-add-location-btn"
                    type="button"
                    onClick={() => setIsLocationModalOpen(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-medium transition cursor-pointer"
                    title="Add location to reflection"
                  >
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Add Location</span>
                  </button>
                )}

                {/* Share Memory Action */}
                {onShare && (
                  <button
                    id="editor-share-btn"
                    type="button"
                    onClick={() =>
                      onShare({
                        ...entry,
                        title: title || entry.title,
                        journalText,
                        category,
                        messages,
                        insights,
                        photos,
                        location: location || null,
                      })
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-medium transition cursor-pointer"
                    title="Share or export memory"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Share</span>
                  </button>
                )}

                {/* AI Insights Synthesis */}
                <button
                  id="generate-summary-btn"
                  onClick={handleGenerateSummary}
                  disabled={isSummarizing || (!journalText.trim() && messages.length === 0)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-sky-50 hover:from-indigo-100 hover:to-sky-100 text-indigo-700 border border-indigo-200/80 text-xs font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
                  title="Generate AI insights, synthesis & takeaways"
                >
                  {isSummarizing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  )}
                  <span>{isSummarizing ? "Synthesizing..." : "AI Insights"}</span>
                </button>
              </div>
            </div>

            {/* Collapsible Thought Starters */}
            <div className="mb-3 pt-2">
              <button
                type="button"
                id="thought-starters-toggle-btn"
                onClick={() => setIsThoughtStartersOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-0.5 group cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-500 group-hover:text-sky-600" />
                <span>✦ Thought starters</span>
                {isThoughtStartersOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                )}
              </button>

              {isThoughtStartersOpen && (
                <div
                  id="thought-starters-list"
                  className="mt-2 flex flex-wrap gap-1.5 p-2.5 bg-slate-50/80 border border-slate-200/70 rounded-xl"
                >
                  {PROMPT_SUGGESTIONS.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setJournalText((prev) =>
                          prev ? `${prev}\n\n${sug}` : sug
                        )
                      }
                      className="text-[11px] text-slate-600 bg-white hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 border border-slate-200/80 rounded-lg px-2.5 py-1 transition text-left shadow-2xs leading-snug"
                    >
                      &ldquo;{sug}&rdquo;
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtle Divider */}
            <hr className="border-slate-100 my-2" />

            {/* Visual Memories Gallery (Phase 5 & 6) */}
            {photos.length > 0 && (
              <div className="mb-4 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 font-heading">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                    <span>Visual Memories ({photos.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-sans">
                    Cloud-backed &middot; Images stored securely, metadata in Firestore
                  </span>
                </div>

                {/* Gallery responsive grid: 2-4 across on desktop, 1-2 on mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      className="relative rounded-xl overflow-hidden aspect-square bg-slate-100 border border-slate-200/90 group"
                    >
                      <CloudPhotoThumbnail
                        photo={photo}
                        alt={photo.name}
                        userId={entry.userId}
                        reflectionId={entry.id}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(photo, idx)}
                        title="Remove photo"
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main Textarea */}
            <div className="relative flex-1 flex flex-col">
              <textarea
                ref={textareaRef}
                id="journal-content-textarea"
                value={journalText}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Start writing your reflection, thoughts, feelings, or ideas here... (Type @ to categorize)"
                className="w-full flex-1 min-h-[360px] text-base leading-relaxed text-slate-800 bg-transparent resize-none focus:outline-none font-normal placeholder:text-slate-300 font-sans"
              />
            </div>

            {/* Word count & last modified status */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-sans">
              <span>
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
              <span>
                {entry.updatedAt
                  ? `Last modified ${new Date(entry.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Unsaved"}
              </span>
            </div>
          </div>

          {/* AI Insights & Synthesis Section if generated */}
          {insights && (
            <div
              id="ai-insights-panel"
              className="max-w-3xl mx-auto mt-5 p-5 bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-sky-50/50 rounded-2xl border border-indigo-100/90 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-900 font-heading font-semibold text-sm sm:text-base">
                  <Compass className="w-4 h-4 text-sky-600" />
                  <span>Gemini Insights &amp; Synthesis</span>
                </div>
                {insights.sentiment && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-700">
                    {insights.sentiment}
                  </span>
                )}
              </div>

              {/* Summary */}
              {insights.summary && (
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-white p-3 rounded-xl border border-indigo-100/70 shadow-2xs">
                  &ldquo;{insights.summary}&rdquo;
                </p>
              )}

              {/* Key Themes */}
              {insights.keyThemes && insights.keyThemes.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1 font-sans">
                    Core Themes
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.keyThemes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium shadow-2xs"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights List */}
              {insights.insights && insights.insights.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1 font-sans">
                    <Lightbulb className="w-3.5 h-3.5 text-sky-600" />
                    Key Takeaways
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {insights.insights.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-slate-100 shadow-2xs"
                      >
                        <span className="text-sky-600 font-bold leading-none mt-1">
                          &bull;
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {insights.actionItems && insights.actionItems.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center gap-1 font-sans">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Actionable Next Steps
                  </span>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {insights.actionItems.map((action, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 bg-white p-2 rounded-lg border border-emerald-100 shadow-2xs"
                      >
                        <span className="text-emerald-600 font-bold mt-0.5">
                          &bull;
                        </span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Multi-turn Gemini Dialogue Companion (Desktop >= xl) */}
      {isDesktopCompanionOpen && (
        <div className="hidden xl:block w-80 xl:w-[350px] shrink-0 h-full">
          <GeminiCompanion
            messages={messages}
            onSendMessage={handleSendChat}
            isAiResponding={isAiResponding}
            onClose={() => setIsDesktopCompanionOpen(false)}
          />
        </div>
      )}

      {/* Tablet Slide-over Drawer for Gemini Companion (md to lg) */}
      {companionDrawerOpen && (
        <div className="fixed inset-0 z-40 xl:hidden flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs"
            onClick={() => setCompanionDrawerOpen(false)}
          />
          <div className="relative z-50 w-88 max-w-[85vw] h-full bg-white shadow-2xl">
            <GeminiCompanion
              messages={messages}
              onSendMessage={handleSendChat}
              isAiResponding={isAiResponding}
              onClose={() => setCompanionDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Photo Memories Modal */}
      <PhotoMemoriesModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onAddPhotos={handleAddPhotos}
        existingCount={photos.length}
        userId={entry.userId}
        reflectionId={entry.id}
      />

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        currentLocation={location}
        onSelectLocation={handleSelectLocation}
        onRemoveLocation={handleRemoveLocation}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
};

