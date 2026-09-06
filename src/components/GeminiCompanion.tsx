import React, { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Sparkles, Send, RefreshCw, Copy, Check, X } from "lucide-react";
import { ChatMessage } from "../types";

interface GeminiCompanionProps {
  messages: ChatMessage[];
  onSendMessage: (promptToSend?: string) => Promise<void>;
  isAiResponding: boolean;
  onClose?: () => void;
  className?: string;
}

const QUICK_CHAT_IDEAS = [
  "Help me reframe this from a growth perspective",
  "Suggest 3 concrete next steps I can take",
  "What potential blind spots might I be missing?",
  "Summarize the underlying emotion in this entry",
];

export const GeminiCompanion: React.FC<GeminiCompanionProps> = ({
  messages,
  onSendMessage,
  isAiResponding,
  onClose,
  className = "",
}) => {
  const [chatPrompt, setChatPrompt] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiResponding]);

  const handleSend = (promptToSend?: string) => {
    const text = (promptToSend || chatPrompt).trim();
    if (!text || isAiResponding) return;
    if (!promptToSend) {
      setChatPrompt("");
    }
    onSendMessage(text);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      id="gemini-companion-panel"
      className={`flex flex-col h-full bg-[#FBFBFE] border-l border-[#e9e6f0] shrink-0 ${className}`}
    >
      {/* Header */}
      <div className="p-3 border-b border-[#e9e6f0] bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center border border-sky-100">
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900 font-heading leading-tight">
              Gemini Companion
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono">
            gemini-3.6-flash
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
              title="Close Companion"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation Feed */}
      <div
        id="companion-chat-feed"
        className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar bg-[#FAF9FC]"
      >
        {messages.length === 0 ? (
          <div className="py-5 px-2 text-center text-slate-500">
            <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-800 font-heading">
              Converse with Gemini about your entry
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Ask for a fresh angle, brainstorm solutions, or explore what you just wrote.
            </p>

            <div className="mt-4 space-y-1.5 text-left">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
                Try asking:
              </span>
              {QUICK_CHAT_IDEAS.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(idea)}
                  className="w-full text-xs text-slate-700 bg-white hover:bg-sky-50 hover:text-sky-800 border border-slate-200/90 hover:border-sky-200 rounded-xl p-2 text-left transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-[0.99]"
                >
                  &ldquo;{idea}&rdquo;
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
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 text-slate-900 rounded-br-xs shadow-2xs"
                      : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-xs shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="markdown-body space-y-1.5">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {!isUser && (
                    <button
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className="hover:text-slate-600 transition ml-0.5"
                      title="Copy reply"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
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
            <div className="bg-white text-slate-600 border border-slate-200 rounded-2xl rounded-bl-xs p-2.5 text-xs shadow-2xs flex items-center gap-2">
              <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
              <span>ReflectAI is reflecting...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <div className="p-2.5 border-t border-[#e9e6f0] bg-white shrink-0">
        <form
          id="companion-chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
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
            className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition"
          />
          <button
            id="companion-send-btn"
            type="submit"
            disabled={!chatPrompt.trim() || isAiResponding}
            className="p-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl transition disabled:opacity-30 shadow-xs font-medium active:scale-95"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
