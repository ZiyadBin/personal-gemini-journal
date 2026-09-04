import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import {
  Sparkles,
  Send,
  Save,
  CheckCircle2,
  RefreshCw,
  Tag,
  Lightbulb,
  CheckSquare,
  Compass,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { ReflectionEntry, ChatMessage, ReflectionInsights } from "../types";

interface ReflectionEditorProps {
  entry: ReflectionEntry;
  onSave: (entry: ReflectionEntry) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  onClearSaveError: () => void;
}

const CATEGORIES = [
  "Personal Growth",
  "Work & Focus",
  "Creative Ideas",
  "Gratitude",
  "Mindfulness",
];

const PROMPT_SUGGESTIONS = [
  "What brought me genuine energy or friction today?",
  "What is a challenging situation I want to reframe?",
  "A creative spark or insight I want to explore deeper...",
  "What am I grateful for right now, and why?",
];

const QUICK_CHAT_IDEAS = [
  "Help me reframe this from a growth perspective",
  "Suggest 3 concrete next steps I can take",
  "What potential blind spots might I be missing?",
  "Summarize the underlying emotion in this entry",
];

export const ReflectionEditor: React.FC<ReflectionEditorProps> = ({
  entry,
  onSave,
  isSaving,
  saveError,
  onClearSaveError,
}) => {
  const [title, setTitle] = useState(entry.title || "");
  const [journalText, setJournalText] = useState(entry.journalText || "");
  const [category, setCategory] = useState(entry.category || "Personal Growth");
  const [messages, setMessages] = useState<ChatMessage[]>(entry.messages || []);
  const [insights, setInsights] = useState<ReflectionInsights | undefined>(
    entry.insights
  );

  // Chat input state
  const [chatPrompt, setChatPrompt] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize when active entry changes
  useEffect(() => {
    setTitle(entry.title || "");
    setJournalText(entry.journalText || "");
    setCategory(entry.category || "Personal Growth");
    setMessages(entry.messages || []);
    setInsights(entry.insights);
  }, [entry.id]);

  // Scroll to bottom of chat when new message appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiResponding]);

  const handleManualSave = async () => {
    onClearSaveError();
    const updated: ReflectionEntry = {
      ...entry,
      title: title.trim() || "Untitled Reflection",
      journalText,
      category,
      messages,
      insights,
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

  const handleSendChat = async (promptToSend?: string) => {
    const textToSend = (promptToSend || chatPrompt).trim();
    if (!textToSend || isAiResponding) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setChatPrompt("");
    setIsAiResponding(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          journalContext: journalText,
          history: messages.slice(-8), // Send recent context
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
        updatedAt: Date.now(),
      };
      await onSave(updatedEntry);
    } catch (err: any) {
      console.error("Chat generation failed:", err);
      // Keep user message and show assistant error notice
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

      // If user hasn't explicitly set a custom title, update with AI title
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
        updatedAt: Date.now(),
      };
      await onSave(updatedEntry);
    } catch (err: any) {
      console.error("Summarization error:", err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const wordCount = journalText.trim() ? journalText.trim().split(/\s+/).length : 0;

  return (
    <div id="reflection-editor-container" className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#09090b] text-zinc-300">
      {/* Top Action Ribbon */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          {/* Title input */}
          <input
            id="reflection-title-input"
            type="text"
            placeholder="Title your reflection..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base sm:text-lg serif font-medium text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder:text-zinc-600"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 rounded-lg border border-zinc-800 text-xs">
            <Tag className="w-3.5 h-3.5 text-zinc-400" />
            <select
              id="reflection-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-zinc-200 font-medium text-xs focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-zinc-900 text-zinc-200">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* AI Summarize Action */}
          <button
            id="generate-summary-btn"
            onClick={handleGenerateSummary}
            disabled={isSummarizing || (!journalText.trim() && messages.length === 0)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-medium rounded-lg transition disabled:opacity-50"
            title="Generate AI insights, synthesis & takeaways"
          >
            {isSummarizing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{isSummarizing ? "Synthesizing..." : "AI Insights"}</span>
          </button>

          {/* Explicit Save Button */}
          <button
            id="save-reflection-btn"
            onClick={handleManualSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold rounded-lg shadow-xs transition active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-950" />
            ) : saveSuccessNotification ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>
              {isSaving
                ? "Saving..."
                : saveSuccessNotification
                ? "Saved to Cloud"
                : "Save"}
            </span>
          </button>
        </div>
      </div>

      {/* Error notification banner if Firestore save failed */}
      {saveError && (
        <div
          id="editor-save-error-banner"
          className="mx-6 mt-4 p-3.5 bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-xl text-xs flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{saveError}</span>
          </div>
          <button
            onClick={handleManualSave}
            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium text-xs transition"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Main Workspace (Split Grid: Left Journal Canvas, Right Gemini Companion) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Journaling canvas & Insights (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full border-r border-zinc-800 overflow-y-auto bg-zinc-950 p-6 sm:p-8 custom-scrollbar">
          {/* Quick thought starters if empty */}
          {!journalText && (
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                Thought Starters
              </span>
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setJournalText((prev) => (prev ? `${prev}\n\n${sug}` : sug))}
                    className="text-xs text-zinc-300 bg-zinc-900/80 hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/40 border border-zinc-800 rounded-lg px-3 py-1.5 transition text-left"
                  >
                    &ldquo;{sug}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Textarea */}
          <textarea
            id="journal-content-textarea"
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Start writing your reflection, thoughts, feelings, or ideas here..."
            className="w-full flex-1 min-h-[300px] text-sm sm:text-base leading-relaxed text-zinc-200 bg-transparent resize-none focus:outline-none font-normal placeholder:text-zinc-600"
          />

          {/* Word count & timestamp */}
          <div className="pt-3 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-500">
            <span>
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            <span>
              {entry.updatedAt
                ? `Last modified ${new Date(entry.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Unsaved"}
            </span>
          </div>

          {/* AI Insights & Synthesis Section if generated */}
          {insights && (
            <div id="ai-insights-panel" className="mt-8 p-5 bg-zinc-900/80 rounded-xl border border-amber-500/30 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>Gemini Insights & Synthesis</span>
                </div>
                {insights.sentiment && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    {insights.sentiment}
                  </span>
                )}
              </div>

              {/* Summary */}
              {insights.summary && (
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed italic bg-zinc-950/70 p-3 rounded-lg border border-zinc-800/80">
                  &ldquo;{insights.summary}&rdquo;
                </p>
              )}

              {/* Key Themes */}
              {insights.keyThemes && insights.keyThemes.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5">
                    Core Themes
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {insights.keyThemes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-200 font-medium"
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
                  <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Key Takeaways & Breakthroughs
                  </span>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {insights.insights.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold leading-none mt-1">&bull;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {insights.actionItems && insights.actionItems.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-zinc-400 block mb-1.5 flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    Actionable Next Steps
                  </span>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {insights.actionItems.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-zinc-950/70 p-2 rounded border border-zinc-800/80">
                        <span className="text-emerald-400 font-bold mt-0.5">&bull;</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Multi-turn Gemini Dialogue Companion (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full bg-[#09090b]">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-zinc-100">
                Gemini Reflection Companion
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              gemini-3.6-flash
            </span>
          </div>

          {/* Conversation Feed */}
          <div id="companion-chat-feed" className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="py-8 px-2 text-center text-zinc-400">
                <Sparkles className="w-6 h-6 text-amber-400/60 mx-auto mb-2" />
                <p className="text-xs font-medium text-zinc-200">
                  Converse with Gemini about your entry
                </p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-xs mx-auto">
                  Ask for a fresh angle, brainstorm solutions, or explore what you just wrote.
                </p>

                <div className="mt-5 space-y-1.5 text-left">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block px-1">
                    Try asking:
                  </span>
                  {QUICK_CHAT_IDEAS.map((idea, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChat(idea)}
                      className="w-full text-xs text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 hover:text-white border border-zinc-800/80 hover:border-zinc-700 rounded-lg p-2.5 text-left transition shadow-xs"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    id={`chat-bubble-${msg.id}`}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? "bg-amber-500/15 border border-amber-500/30 text-zinc-100 rounded-br-xs shadow-xs"
                          : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-bl-xs shadow-xs"
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        <div className="markdown-body space-y-2">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-zinc-500">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="hover:text-zinc-300 transition"
                          title="Copy reply"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isAiResponding && (
              <div className="flex items-start gap-2">
                <div className="bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-2xl rounded-bl-xs p-3 text-xs shadow-xs flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>ReflectAI is reflecting...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-950">
            <form
              id="companion-chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="companion-chat-input"
                type="text"
                placeholder="Ask Gemini to explore, brainstorm, or reframe..."
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                disabled={isAiResponding}
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder:text-zinc-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 transition"
              />
              <button
                id="companion-send-btn"
                type="submit"
                disabled={!chatPrompt.trim() || isAiResponding}
                className="p-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl transition disabled:opacity-30 shadow-xs font-semibold"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
