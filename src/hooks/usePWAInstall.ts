import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone display mode
    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsInstalled(Boolean(isStandalone));

    // Check if iOS device
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      const isAppleMobile = /iphone|ipad|ipod/.test(ua);
      setIsIOS(isAppleMobile);
    }

    // Check if user previously dismissed the banner recently (24 hours cooldown)
    try {
      const dismissedUntil = localStorage.getItem("reflectai_pwa_dismissed_until");
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setIsDismissed(true);
      }
    } catch {
      // ignore storage errors
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error("Install prompt error:", err);
    }
    return false;
  };

  const dismiss = () => {
    setIsDismissed(true);
    try {
      // Dismiss for 24 hours
      localStorage.setItem("reflectai_pwa_dismissed_until", (Date.now() + 86400000).toString());
    } catch {
      // ignore
    }
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    isDismissed,
    install,
    dismiss,
  };
}
