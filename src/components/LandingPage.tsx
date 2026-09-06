import React, { useState } from "react";
import { Shield, BookmarkCheck, AlertCircle, Compass } from "lucide-react";
import { signInWithGoogle } from "../lib/firebase";
import { ReflectLogo, ReflectWordmark } from "./ReflectLogo";

interface LandingPageProps {
  onAuthSuccess?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Authentication error:", err);
      const msg =
        err?.message ||
        "Sign-in was interrupted. Please try again or open the app in a new tab.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="landing-container"
      className="min-h-screen bg-[#FAF9FC] text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans"
    >
      {/* Subtle slow-moving ambient liquid color fields inspired by the logo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Soft Blue Blob */}
        <div className="ambient-liquid-blue absolute top-[-5%] left-[20%] w-[540px] h-[540px] rounded-full bg-sky-400/9 blur-[130px]" />
        {/* Soft Violet Blob */}
        <div className="ambient-liquid-violet absolute top-[18%] right-[15%] w-[480px] h-[480px] rounded-full bg-violet-400/8 blur-[140px]" />
        {/* Soft Pink Blob */}
        <div className="ambient-liquid-pink absolute top-[40%] left-[28%] w-[460px] h-[460px] rounded-full bg-pink-400/7 blur-[135px]" />
        {/* Very Soft Warm Highlight */}
        <div className="ambient-liquid-warm absolute top-[15%] left-[45%] w-[320px] h-[320px] rounded-full bg-amber-200/6 blur-[110px]" />
      </div>

      {/* Top Header with subtle 1px light lavender/gray border */}
      <header
        id="landing-header"
        className="border-b border-[#e9e6f0] bg-[#FAF9FC]/90 backdrop-blur-md sticky top-0 z-20"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ReflectLogo size={38} withGlow />
            <ReflectWordmark size="md" showTagline={false} theme="light" />
          </div>

          <div className="flex items-center gap-3">
            <button
              id="landing-signin-top-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium font-sans text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg bg-white/90 hover:bg-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main
        id="landing-main"
        className="max-w-4xl mx-auto px-6 py-16 sm:py-20 flex-1 flex flex-col justify-center items-center text-center relative z-10"
      >
        {/* Emblem Hero presentation with serene halo */}
        <div className="mb-6 relative">
          <ReflectLogo size={88} withGlow />
        </div>

        {/* Hero Headline Hierarchy: ReflectAI Journal + Write. Reflect. Grow. */}
        <h1 className="font-heading tracking-tight text-center max-w-2xl mb-4">
          <span className="block text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
            ReflectAI Journal
          </span>
          <span className="block text-xl sm:text-2xl md:text-3xl font-semibold text-slate-700 mt-2 sm:mt-2.5 leading-tight">
            Write. Reflect. Grow.
          </span>
        </h1>

        {/* Subhead */}
        <p className="text-base sm:text-lg font-sans text-slate-600 max-w-lg mb-10 leading-relaxed">
          Capture your moments, continue meaningful conversations, and discover new perspectives along the way.
        </p>

        {/* Error notification if sign-in is blocked */}
        {errorMessage && (
          <div
            id="auth-error-banner"
            className="mb-6 p-4 max-w-md bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-left flex items-start gap-3 text-sm shadow-2xs font-sans"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-rose-900">Authentication Notice</p>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Primary Call to Action */}
        <div className="flex items-center justify-center w-full max-w-sm mb-16">
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full sm:w-auto min-w-[240px] px-7 py-3.5 bg-slate-900 text-white rounded-xl font-medium font-sans text-sm flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-[0.99] transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
            <span>{loading ? "Authenticating..." : "Sign In with Google"}</span>
          </button>
        </div>

        {/* Feature Cards */}
        <div
          id="landing-security-grid"
          className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl w-full text-left items-stretch"
        >
          {/* Card 1 */}
          <div className="p-5 sm:p-6 bg-white/95 rounded-2xl border border-[#e9e6f0] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.05)] hover:border-sky-200 transition-all duration-200 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100/80 text-sky-600 flex items-center justify-center shrink-0">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-base font-semibold font-heading text-slate-900">Private by default</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Your personal reflections stay private, confidential, and secure.
              </p>
            </div>
            <p className="mt-auto pt-4 text-xs text-slate-400 font-medium font-sans">
              Secured with Firebase &amp; Firestore
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 sm:p-6 bg-white/95 rounded-2xl border border-[#e9e6f0] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.05)] hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-600 flex items-center justify-center shrink-0">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-base font-semibold font-heading text-slate-900">AI Companion</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Thoughtful dialogue to help you explore ideas and gain perspective.
              </p>
            </div>
            <p className="mt-auto pt-4 text-xs text-slate-400 font-medium font-sans">
              Powered by Gemini
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 sm:p-6 bg-white/95 rounded-2xl border border-[#e9e6f0] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.05)] hover:border-purple-200 transition-all duration-200 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100/80 text-purple-600 flex items-center justify-center shrink-0">
                  <BookmarkCheck className="w-4.5 h-4.5" />
                </div>
                <h2 className="text-base font-semibold font-heading text-slate-900">Saves as you go</h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Everything saves automatically as you write, preserving every thought.
              </p>
            </div>
            <p className="mt-auto pt-4 text-xs text-slate-400 font-medium font-sans">
              Continuous cloud autosave
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        id="landing-footer"
        className="border-t border-[#e9e6f0] py-8 text-center text-xs text-slate-500 relative z-10 font-sans bg-[#FAF9FC]"
      >
        <p className="text-slate-600 font-medium">
          ReflectAI &middot; Your thoughts. A new perspective.
        </p>
        <p className="text-slate-400 mt-1 text-[11px]">
          &copy; 2026 ReflectAI
        </p>
      </footer>
    </div>
  );
};
