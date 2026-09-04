import React, { useState } from "react";
import { Shield, Database, Cpu, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { signInWithGoogle, signInAsGuest } from "../lib/firebase";

interface LandingPageProps {
  onAuthSuccess?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [loading, setLoading] = useState<"google" | "guest" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading("google");
      setErrorMessage(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Authentication error:", err);
      const msg =
        err?.message ||
        "Sign-in was interrupted. If you are viewing in an embedded frame, please try Guest Mode or open in a new tab.";
      setErrorMessage(msg);
    } finally {
      setLoading(null);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setLoading("guest");
      setErrorMessage(null);
      await signInAsGuest();
    } catch (err: any) {
      console.error("Guest authentication error:", err);
      setErrorMessage(err?.message || "Could not initialize session.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div id="landing-container" className="min-h-screen bg-[#09090b] text-zinc-300 flex flex-col justify-between">
      {/* Top Header */}
      <header id="landing-header" className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-semibold text-lg tracking-tight text-zinc-100 block leading-tight">
                ReflectAI
              </span>
              <span className="text-xs text-zinc-400 font-normal">
                Intelligent Journaling & Reflection
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-signin-top-btn"
              onClick={handleGoogleSignIn}
              disabled={loading !== null}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-800 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main id="landing-main" className="max-w-4xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center items-center text-center">
        {/* Subtle Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Gemini 3.6 Flash & Cloud Firestore Architecture</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl serif text-zinc-100 font-normal tracking-tight max-w-2xl mb-5 leading-tight">
          A private sanctuary for your reflections and deeper insights.
        </h1>

        {/* Subhead */}
        <p className="text-lg text-zinc-400 max-w-xl mb-10 leading-relaxed">
          Write multi-turn journal entries, converse with an empathetic Gemini AI companion,
          and explore structured breakthroughs—all stored in isolated, secure Firestore documents.
        </p>

        {/* Error notification if sign-in is blocked */}
        {errorMessage && (
          <div
            id="auth-error-banner"
            className="mb-6 p-4 max-w-md bg-rose-950/40 border border-rose-800/60 text-rose-200 rounded-xl text-left flex items-start gap-3 text-sm shadow-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Authentication Notice</p>
              <p className="text-xs text-rose-300 mt-1 leading-relaxed">{errorMessage}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleGuestSignIn}
                  className="text-xs underline font-semibold text-rose-300 hover:text-rose-100"
                >
                  Continue with Demo Guest Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md mb-12">
          {/* Primary Google Sign-in */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            className="w-full sm:w-auto min-w-[220px] px-6 py-3.5 bg-zinc-100 text-zinc-950 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 hover:bg-white active:scale-[0.99] transition shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading === "google" ? "Authenticating..." : "Sign In with Google"}</span>
          </button>

          {/* Secondary Guest / Fast Preview Sign-In */}
          <button
            id="guest-signin-btn"
            onClick={handleGuestSignIn}
            disabled={loading !== null}
            className="w-full sm:w-auto px-5 py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-zinc-800/80 hover:text-white active:scale-[0.99] transition disabled:opacity-50"
          >
            <span>{loading === "guest" ? "Starting..." : "Try as Guest"}</span>
            <ArrowRight className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        {/* Security & Architecture Badges */}
        <div id="landing-security-grid" className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full text-left">
          <div className="p-5 bg-zinc-900/60 rounded-xl border border-zinc-800 shadow-xs hover:border-zinc-700/80 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <Shield className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 mb-1">User Data Isolation</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enforced by strict Firestore security rules. Your journal entries are readable and writable only by your authenticated account.
            </p>
          </div>

          <div className="p-5 bg-zinc-900/60 rounded-xl border border-zinc-800 shadow-xs hover:border-zinc-700/80 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-3">
              <Cpu className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 mb-1">Gemini 3.6 Flash Engine</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Provides empathetic perspective and multi-turn brainstorming, safeguarded by a resilient server-side model fallback ladder.
            </p>
          </div>

          <div className="p-5 bg-zinc-900/60 rounded-xl border border-zinc-800 shadow-xs hover:border-zinc-700/80 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
              <Database className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 mb-1">Cloud Firestore Persistence</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real-time synchronization with undefined-safe payload verification so your reflections are always durably preserved.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer id="landing-footer" className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-400">
        ReflectAI &bull; Google AI Studio &bull; Cloud Run & Firestore Deployment
      </footer>
    </div>
  );
};
