import React, { useState } from "react";
import { Download, X, Share, PlusSquare, Smartphone } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { ReflectLogo } from "./ReflectLogo";

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isDismissed, install, dismiss } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // If already installed or dismissed, do not show the banner
  if (isInstalled || isDismissed) {
    return null;
  }

  // Only show if browser supports prompt or is iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {/* Floating subtle banner at bottom right of viewport */}
      <div
        id="pwa-install-banner"
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-[#e9e6f0] p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all animate-in fade-in slide-in-from-bottom-3 duration-300"
      >
        <div className="flex items-start gap-3.5">
          <div className="shrink-0 mt-0.5">
            <ReflectLogo size={36} />
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold font-heading text-slate-900 leading-snug">
                Install ReflectAI
              </h4>
              <button
                type="button"
                onClick={dismiss}
                className="text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded-lg transition cursor-pointer"
                title="Dismiss"
                aria-label="Dismiss install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">
              Add to your home screen for quick, peaceful daily reflection and offline access.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                id="pwa-install-action-btn"
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition active:scale-[0.98] shadow-xs cursor-pointer"
              >
                {isIOS ? (
                  <>
                    <Share className="w-3.5 h-3.5" />
                    <span>How to Install</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{isInstalling ? "Installing..." : "Add to Home Screen"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={dismiss}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Safari Guided Instructions Modal */}
      {showIOSModal && (
        <div
          id="ios-install-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-[#e9e6f0] p-6 shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold font-heading text-slate-900">
                  Install on iPhone &amp; iPad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans mb-4">
              Safari lets you add ReflectAI to your home screen with zero app store downloads:
            </p>

            <ol className="space-y-3 text-xs text-slate-700 font-sans mb-6">
              <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-semibold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <span>Tap the </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    <Share className="w-3 h-3 text-sky-600 inline" /> Share
                  </span>
                  <span> button in Safari&apos;s bottom toolbar.</span>
                </div>
              </li>

              <li className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 font-semibold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <span>Scroll down and tap </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    <PlusSquare className="w-3 h-3 text-sky-600 inline" /> Add to Home Screen
                  </span>
                  <span>.</span>
                </div>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const PWAInstallNavbarButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  if (isInstalled) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      <button
        id="navbar-pwa-install-btn"
        type="button"
        onClick={() => {
          if (isIOS) {
            setShowIOSModal(true);
          } else {
            install();
          }
        }}
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl transition cursor-pointer"
        title="Install ReflectAI as an app"
      >
        <Download className="w-3.5 h-3.5 text-sky-600" />
        <span>Install App</span>
      </button>

      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-[#e9e6f0] p-6 shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold font-heading text-slate-900">
                Install on iOS
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Tap the Share button in Safari, then select <strong>Add to Home Screen</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
