import React, { useState } from "react";
import {
  AlertCircle,
  BookmarkCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Images,
  MapPin,
  PenLine,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { signInWithGoogle } from "../lib/firebase";
import { ReflectLogo, ReflectWordmark } from "./ReflectLogo";

interface LandingPageProps {
  onAuthSuccess?: () => void;
}

const memoryCards = [
  {
    title: "A quiet morning",
    category: "Moments",
    text: "Some of the best moments are the ones that ask nothing from us.",
    date: "Saturday, June 14",
    tone: "from-sky-50 to-indigo-50",
  },
  {
    title: "Learning to trust the process",
    category: "Growth",
    text: "Progress does not always look dramatic. Sometimes it is simply continuing.",
    date: "Wednesday, June 18",
    tone: "from-violet-50 to-fuchsia-50",
  },
  {
    title: "A day worth remembering",
    category: "Memories",
    text: "Looking back helped me notice how much this small moment actually meant.",
    date: "Sunday, June 22",
    tone: "from-amber-50 to-rose-50",
  },
  {
    title: "A different perspective",
    category: "Reflection",
    text: "Writing it down made the situation feel clearer than it did in my head.",
    date: "Thursday, June 26",
    tone: "from-emerald-50 to-sky-50",
  },
];

export const LandingPage: React.FC<LandingPageProps> = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [memoryIndex, setMemoryIndex] = useState(0);

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

  const previousMemory = () => {
    setMemoryIndex((current) =>
      current === 0 ? memoryCards.length - 1 : current - 1
    );
  };

  const nextMemory = () => {
    setMemoryIndex((current) => (current + 1) % memoryCards.length);
  };

  const currentMemory = memoryCards[memoryIndex];

  return (
    <div
      id="landing-container"
      className="min-h-screen bg-[#FAF9FC] text-slate-800 flex flex-col relative overflow-hidden font-sans"
    >
      {/* Subtle ambient fields inspired by the ReflectAI logo */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div className="ambient-liquid-blue absolute top-[-5%] left-[20%] w-[540px] h-[540px] rounded-full bg-sky-400/9 blur-[130px]" />
        <div className="ambient-liquid-violet absolute top-[18%] right-[15%] w-[480px] h-[480px] rounded-full bg-violet-400/8 blur-[140px]" />
        <div className="ambient-liquid-pink absolute top-[40%] left-[28%] w-[460px] h-[460px] rounded-full bg-pink-400/7 blur-[135px]" />
        <div className="ambient-liquid-warm absolute top-[15%] left-[45%] w-[320px] h-[320px] rounded-full bg-amber-200/6 blur-[110px]" />
      </div>

      {/* Header */}
      <header
        id="landing-header"
        className="border-b border-[#e9e6f0] bg-[#FAF9FC]/90 backdrop-blur-md sticky top-0 z-20"
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ReflectLogo size={38} withGlow />
            <ReflectWordmark size="md" showTagline={false} theme="light" />
          </div>

          <button
            id="landing-signin-top-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium font-sans text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg bg-white/90 hover:bg-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </header>

      <main
        id="landing-main"
        className="w-full max-w-6xl mx-auto px-6 relative z-10"
      >
        {/* Hero */}
        <section className="min-h-[620px] flex flex-col justify-center items-center text-center pt-16 pb-20">
          <div className="mb-6 relative">
            <ReflectLogo size={88} withGlow />
          </div>

          <h1 className="font-heading tracking-tight text-center max-w-2xl mb-4">
            <span className="block text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
              ReflectAI Journal
            </span>
            <span className="block text-xl sm:text-2xl md:text-3xl font-semibold text-slate-700 mt-2.5 leading-tight">
              Write. Reflect. Grow.
            </span>
          </h1>

          <p className="text-base sm:text-lg font-sans text-slate-600 max-w-lg mb-10 leading-relaxed">
            Capture your moments, continue meaningful conversations, and
            discover new perspectives along the way.
          </p>

          {errorMessage && (
            <div
              id="auth-error-banner"
              className="mb-6 p-4 max-w-md w-full bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-left flex items-start gap-3 text-sm shadow-2xs"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-rose-900">
                  Authentication Notice
                </p>
                <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="min-w-[240px] px-7 py-3.5 bg-slate-900 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-3 hover:bg-slate-800 active:scale-[0.99] transition shadow-sm hover:shadow-md disabled:opacity-50 cursor-pointer"
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
        </section>

        {/* Product capabilities */}
        <section
          id="landing-capabilities"
          className="py-20 border-t border-[#e9e6f0]"
        >
          <div className="max-w-2xl mx-auto mb-12 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">
              Everything in one place
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Everything you need to reflect.
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
              Write freely, preserve the moments behind your words, and use AI
              to find new perspectives in what you have written.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
            <Capability
              icon={<PenLine className="w-5 h-5" />}
              title="Write & Reflect"
              text="Capture thoughts, moments, and experiences in your private journal."
              iconClass="bg-sky-50 text-sky-600 border-sky-100"
            />
            <Capability
              icon={<Camera className="w-5 h-5" />}
              title="Add Photos"
              text="Bring your memories to life by adding photos to your reflections."
              iconClass="bg-indigo-50 text-indigo-600 border-indigo-100"
            />
            <Capability
              icon={<MapPin className="w-5 h-5" />}
              title="Remember the Place"
              text="Attach a location to meaningful moments without continuous tracking."
              iconClass="bg-emerald-50 text-emerald-600 border-emerald-100"
            />
            <Capability
              icon={<Sparkles className="w-5 h-5" />}
              title="AI Insights"
              text="Use AI to uncover new perspectives and make more sense of what you write."
              iconClass="bg-violet-50 text-violet-600 border-violet-100"
            />
            <Capability
              icon={<Images className="w-5 h-5" />}
              title="Share the Memories"
              text="Turn your reflections into beautiful visual memory cards you can keep."
              iconClass="bg-amber-50 text-amber-600 border-amber-100"
            />
            <Capability
              icon={<Search className="w-5 h-5" />}
              title="Ask ReflectAI"
              text="Discover patterns, themes, and perspectives across your reflections."
              iconClass="bg-rose-50 text-rose-600 border-rose-100"
            />
          </div>
        </section>

        {/* Trust / core promises */}
        <section
          id="landing-security-grid"
          className="py-20 border-t border-[#e9e6f0]"
        >
          <div className="max-w-2xl mx-auto mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">
              Built for your thoughts
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              A calmer way to journal.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            <PromiseCard
              icon={<Shield className="w-4.5 h-4.5" />}
              title="Private by default"
              text="Your personal reflections stay private, confidential, and secure."
              footer="Secured with Firebase & Firestore"
              iconClass="bg-sky-50 border-sky-100/80 text-sky-600"
              hoverClass="hover:border-sky-200"
            />
            <PromiseCard
              icon={<Compass className="w-4.5 h-4.5" />}
              title="AI Companion"
              text="Thoughtful dialogue to help you explore ideas and gain perspective."
              footer="Powered by Gemini"
              iconClass="bg-indigo-50 border-indigo-100/80 text-indigo-600"
              hoverClass="hover:border-indigo-200"
            />
            <PromiseCard
              icon={<BookmarkCheck className="w-4.5 h-4.5" />}
              title="Saves as you go"
              text="Everything saves automatically as you write, preserving every thought."
              footer="Continuous cloud autosave"
              iconClass="bg-purple-50 border-purple-100/80 text-purple-600"
              hoverClass="hover:border-purple-200"
            />
          </div>
        </section>

        {/* Add Photos showcase */}
        <section
          id="landing-photos"
          className="py-24 border-t border-[#e9e6f0]"
        >
          <div className="flex flex-col items-center text-center gap-12 lg:gap-14">
            <div className="max-w-2xl flex flex-col items-center">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">
                Add Photos
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Keep the moment, not just the words.
              </h2>
              <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-2xl">
                Add photos directly to a reflection and keep the visual memory
                alongside the story. Your photos stay connected to your private
                journal.
              </p>
            </div>

            <div className="relative max-w-md w-full mx-auto">
              <div className="absolute -inset-5 rounded-[2rem] bg-indigo-100/30 blur-2xl" />
              <div className="relative bg-white rounded-[1.75rem] border border-[#e9e6f0] shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)] p-4">
                <div className="rounded-[1.25rem] overflow-hidden bg-gradient-to-br from-sky-100 via-indigo-100 to-violet-100 aspect-[4/3] flex items-center justify-center">
                  <div className="w-20 h-20 rounded-3xl bg-white/75 backdrop-blur flex items-center justify-center text-indigo-500 shadow-sm">
                    <Camera className="w-9 h-9" />
                  </div>
                </div>
                <div className="px-2 pt-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-indigo-600">
                      Moments
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Visual memory
                    </span>
                  </div>
                  <h3 className="font-heading font-semibold text-slate-900">
                    A moment worth remembering
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    Some memories deserve a picture beside the words.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Share the Memories carousel */}
        <section
          id="landing-memories"
          className="py-24 border-t border-[#e9e6f0]"
        >
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6">
              <Images className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">
              Share the Memories
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Turn reflections into memories worth keeping.
            </h2>
            <p className="mt-5 text-base text-slate-600 leading-relaxed">
              Create polished visual cards from your journal entries and keep
              the moments that matter in a format that feels like a memory.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <button
                type="button"
                onClick={previousMemory}
                aria-label="Previous memory"
                className="absolute left-0 sm:-left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-[#e9e6f0] shadow-sm text-slate-600 hover:text-slate-900 hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="mx-7 sm:mx-10 bg-white rounded-[1.75rem] border border-[#e9e6f0] shadow-[0_20px_60px_-25px_rgba(15,23,42,0.16)] overflow-hidden">
                <div
                  className={`bg-gradient-to-br ${currentMemory.tone} aspect-[16/8] sm:aspect-[16/7] flex items-center justify-center p-8`}
                >
                  <div className="w-full max-w-xl bg-white/90 backdrop-blur rounded-2xl border border-white/80 shadow-sm p-6 sm:p-8 text-center">
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-400 mb-3">
                      {currentMemory.category}
                    </p>
                    <h3 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900">
                      {currentMemory.title}
                    </h3>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-md mx-auto">
                      {currentMemory.text}
                    </p>
                    <p className="mt-5 text-[11px] text-slate-400">
                      {currentMemory.date}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 flex items-center justify-between border-t border-[#eeeaf3]">
                  <span className="text-xs text-slate-400">
                    Memory card preview
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {memoryIndex + 1} / {memoryCards.length}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={nextMemory}
                aria-label="Next memory"
                className="absolute right-0 sm:-right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-[#e9e6f0] shadow-sm text-slate-600 hover:text-slate-900 hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-5">
              {memoryCards.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setMemoryIndex(index)}
                  aria-label={`Show memory ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    index === memoryIndex
                      ? "w-6 bg-slate-700"
                      : "w-1.5 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Ask ReflectAI showcase */}
        <section
          id="landing-ask-reflectai"
          className="py-24 border-t border-[#e9e6f0]"
        >
          <div className="flex flex-col items-center text-center gap-12 lg:gap-14">
            <div className="max-w-2xl flex flex-col items-center">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mb-6">
                <Sparkles className="w-5 h-5" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold mb-3">
                Ask ReflectAI
              </p>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Your journal can reveal more than individual entries.
              </h2>
              <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-2xl">
                Ask questions about your own reflections and discover recurring
                themes, patterns, and perspectives across what you have written.
              </p>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-7 px-5 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
              >
                Explore with ReflectAI
              </button>
            </div>

            <div className="relative w-full max-w-2xl">
              <div className="absolute -inset-6 rounded-[2rem] bg-violet-100/25 blur-3xl" />
              <div className="relative bg-white rounded-[1.75rem] border border-[#e9e6f0] shadow-[0_20px_60px_-25px_rgba(15,23,42,0.18)] overflow-hidden">
                <div className="px-5 py-4 border-b border-[#eeeaf3] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Ask ReflectAI
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Across your reflections
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-7 space-y-5">
                  <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-slate-900 text-white px-4 py-3 text-sm leading-relaxed">
                    What themes keep appearing across my recent reflections?
                  </div>

                  <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-slate-50 border border-slate-100 px-4 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                      <span className="text-xs font-semibold text-slate-700">
                        ReflectAI
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      You have been returning to themes of{" "}
                      <span className="font-medium text-slate-800">
                        growth, patience, and finding clarity
                      </span>
                      . Several entries also suggest that writing things down
                      helps you turn uncertainty into a clearer next step.
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <div className="h-10 rounded-xl border border-slate-200 bg-slate-50 flex items-center px-3 text-xs text-slate-400">
                    Ask something about your journal...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-24 border-t border-[#e9e6f0] text-center">
          <ReflectLogo size={54} withGlow />
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-900 mt-5">
            Start with one thought.
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
            Your next reflection might be the beginning of a new perspective.
          </p>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-7 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Start Journaling"}
          </button>
        </section>
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

interface CapabilityProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  iconClass: string;
}

const Capability: React.FC<CapabilityProps> = ({
  icon,
  title,
  text,
  iconClass,
}) => (
  <div className="group flex flex-col items-center text-center px-4">
    <div
      className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5 ${iconClass}`}
    >
      {icon}
    </div>
    <h3 className="mt-4 font-heading text-base font-semibold text-slate-900">
      {title}
    </h3>
    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed max-w-xs">
      {text}
    </p>
  </div>
);

interface PromiseCardProps {
  icon: React.ReactNode;
  title: string;
  text: string;
  footer: string;
  iconClass: string;
  hoverClass: string;
}

const PromiseCard: React.FC<PromiseCardProps> = ({
  icon,
  title,
  text,
  footer,
  iconClass,
  hoverClass,
}) => (
  <div
    className={`p-5 sm:p-6 bg-white/95 rounded-2xl border border-[#e9e6f0] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-200 flex flex-col justify-between h-full ${hoverClass}`}
  >
    <div>
      <div className="flex items-center gap-3 mb-2.5">
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${iconClass}`}
        >
          {icon}
        </div>
        <h3 className="text-base font-semibold font-heading text-slate-900">
          {title}
        </h3>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
    <p className="mt-auto pt-4 text-xs text-slate-400 font-medium">{footer}</p>
  </div>
);
