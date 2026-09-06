/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, auth, User } from "./lib/firebase";
import {
  saveReflection,
  subscribeToReflections,
  deleteReflection,
} from "./lib/storage";
import { deleteReflectionPhotosFromStorage } from "./lib/photoStorage";
import { ReflectionEntry, AuthUserState, AppView } from "./types";
import { LandingPage } from "./components/LandingPage";
import { Navbar } from "./components/Navbar";
import { ReflectionHistory } from "./components/ReflectionHistory";
import { ReflectionEditor } from "./components/ReflectionEditor";
import { MyJournal } from "./components/MyJournal";
import { ExploreJournalView } from "./components/ExploreJournalView";
import { ShareMemoryModal } from "./components/ShareMemoryModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import {
  RefreshCw,
  BookOpen,
  Sparkles,
  PenLine,
  Plus,
} from "lucide-react";

export default function App() {
  const [user, setUser] = useState<AuthUserState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active View: "journal" (My Journal), "explore" (Ask ReflectAI), "editor" (reflection canvas)
  const [activeView, setActiveView] = useState<AppView>("journal");

  // Reflections state
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentEntry, setCurrentEntry] = useState<ReflectionEntry | null>(null);

  // Persistence status
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Deletion modal state
  const [entryToDelete, setEntryToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Share memory modal state
  const [entryToShare, setEntryToShare] = useState<ReflectionEntry | null>(null);

  // Sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(true);
  const [mobileEditorTab, setMobileEditorTab] = useState<"journal" | "companion">("journal");

  const handleToggleHistory = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1280) {
      setMobileSidebarOpen((prev) => !prev);
    } else {
      setIsHistorySidebarOpen((prev) => !prev);
    }
  };

  // Helper to create a fresh empty reflection
  const createFreshEntry = useCallback((uid: string): ReflectionEntry => {
    const id = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return {
      id,
      userId: uid,
      title: "",
      journalText: "",
      category: "Personal Growth",
      messages: [],
      photos: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, []);

  // 1. Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } else {
        setUser(null);
        setReflections([]);
        setSelectedId(null);
        setCurrentEntry(null);
        setActiveView("journal");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore subscription to user's reflections
  useEffect(() => {
    if (!user?.uid) {
      setReflections([]);
      return;
    }

    const unsubscribe = subscribeToReflections(
      user.uid,
      (entries) => {
        setReflections(entries);

        // If an entry was selected, keep currentEntry updated with Firestore sync
        if (selectedId) {
          const matching = entries.find((e) => e.id === selectedId);
          if (matching) {
            setCurrentEntry((prev) => {
              if (!prev || prev.id !== matching.id) return matching;
              const isIncomingNewer = (matching.updatedAt || 0) >= (prev.updatedAt || 0);
              return {
                ...matching,
                journalText: prev.journalText || matching.journalText,
                title: prev.title || matching.title,
                photos: isIncomingNewer ? matching.photos : (prev.photos ?? matching.photos),
              };
            });
          }
        }
      },
      (err) => {
        console.error("Firestore subscription error:", err);
        setSaveError("Firestore real-time sync encountered an issue: " + err.message);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, selectedId]);

  // Handle creating a new reflection
  const handleNewReflection = () => {
    if (!user) return;
    const fresh = createFreshEntry(user.uid);
    setSelectedId(fresh.id);
    setCurrentEntry(fresh);
    setActiveView("editor");
    setMobileSidebarOpen(false);
    setMobileEditorTab("journal");
  };

  // Handle selecting an existing reflection to view/edit
  const handleSelectReflection = (entry: ReflectionEntry) => {
    setSelectedId(entry.id);
    setCurrentEntry(entry);
    setActiveView("editor");
    setMobileSidebarOpen(false);
    setMobileEditorTab("journal");
  };

  // Handle saving reflection to Firestore
  const handleSaveReflection = async (entryToSave: ReflectionEntry) => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      await saveReflection(entryToSave);
      setCurrentEntry(entryToSave);
    } catch (err: any) {
      console.error("Failed to save reflection to Firestore:", err);
      setSaveError(
        err?.message ||
          "Could not save reflection to Firestore. Please check your connection and retry."
      );
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Open delete confirmation modal
  const promptDeleteReflection = (
    entry: ReflectionEntry,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }
    setEntryToDelete({
      id: entry.id,
      title: entry.title || "Untitled Reflection",
    });
  };

  // Prompt share modal
  const promptShareReflection = (
    entry: ReflectionEntry,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }
    setEntryToShare(entry);
  };

  // Execute deletion after user confirms in modal
  const handleConfirmDelete = async () => {
    if (!user || !entryToDelete) return;
    const targetId = entryToDelete.id;
    setIsDeleting(true);

    try {
      const targetEntry = reflections.find((r) => r.id === targetId);
      if (targetEntry?.photos && targetEntry.photos.length > 0) {
        // Asynchronously clean up associated photo documents from Firestore subcollection and cache
        deleteReflectionPhotosFromStorage(user.uid, targetId, targetEntry.photos).catch((err) =>
          console.warn("Storage photos cleanup warning on reflection delete:", err)
        );
      }

      setReflections((prev) => prev.filter((r) => r.id !== targetId));
      await deleteReflection(user.uid, targetId);

      if (selectedId === targetId) {
        const remaining = reflections.filter((r) => r.id !== targetId);
        if (remaining.length > 0) {
          setSelectedId(remaining[0].id);
          setCurrentEntry(remaining[0]);
        } else {
          setSelectedId(null);
          setCurrentEntry(null);
          setActiveView("journal");
        }
      }

      setEntryToDelete(null);
      setSaveError(null);
    } catch (err: any) {
      console.error("Failed to delete reflection:", err);
      setSaveError(
        "Could not delete reflection: " + (err?.message || "Please check connection")
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // 3. Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9FC] text-slate-600">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
          <p className="text-sm font-medium text-slate-700 font-heading">
            Connecting to ReflectAI...
          </p>
        </div>
      </div>
    );
  }

  // 4. If unauthenticated, show landing page with Google sign-in
  if (!user) {
    return <LandingPage />;
  }

  // Active entry fallback for editor
  const activeEntry = currentEntry || (selectedId ? reflections.find(r => r.id === selectedId) : null) || createFreshEntry(user.uid);

  // 5. Authenticated workspace layout
  return (
    <div
      id="authenticated-app-root"
      className="h-screen flex flex-col bg-[#FAF9FC] text-slate-800 overflow-hidden"
    >
      {/* Top Header Navigation with View Switchers */}
      <Navbar
        user={user}
        activeView={activeView}
        onChangeView={setActiveView}
        onNewReflection={handleNewReflection}
        onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        isSaving={isSaving}
      />

      {/* Main App Content Router - Padded at bottom on mobile to accommodate frozen bottom nav */}
      <div className="flex-1 flex overflow-hidden relative pb-14 sm:pb-0">
        {activeView === "journal" && (
          <MyJournal
            user={user}
            entries={reflections}
            onNewReflection={handleNewReflection}
            onAskReflectAI={() => setActiveView("explore")}
            onSelectReflection={handleSelectReflection}
            onShareReflection={promptShareReflection}
            onDeleteReflection={promptDeleteReflection}
            onSaveReflection={handleSaveReflection}
          />
        )}

        {activeView === "explore" && (
          <ExploreJournalView
            entries={reflections}
            onOpenEntry={handleSelectReflection}
            onNewReflection={handleNewReflection}
          />
        )}

        {activeView === "editor" && (
          <div className="flex-1 flex overflow-hidden w-full h-full">
            {/* Desktop Left Sidebar: Past Reflections list */}
            {isHistorySidebarOpen && (
              <div className="hidden xl:block w-60 lg:w-[250px] shrink-0 h-full">
                <ReflectionHistory
                  entries={reflections}
                  selectedId={selectedId}
                  onSelect={handleSelectReflection}
                  onNew={handleNewReflection}
                  onDelete={promptDeleteReflection}
                />
              </div>
            )}

            {/* Slide-over Drawer for Past Reflections (Tablet/Mobile < xl) */}
            {mobileSidebarOpen && (
              <div className="fixed inset-0 z-50 xl:hidden flex">
                <div
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs"
                  onClick={() => setMobileSidebarOpen(false)}
                />
                <div className="relative z-50 w-80 max-w-[85vw] h-full bg-white shadow-2xl">
                  <ReflectionHistory
                    entries={reflections}
                    selectedId={selectedId}
                    onSelect={handleSelectReflection}
                    onNew={handleNewReflection}
                    onDelete={promptDeleteReflection}
                    onCloseMobile={() => setMobileSidebarOpen(false)}
                  />
                </div>
              </div>
            )}

            {/* Reflection Editor Canvas */}
            <main className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
              <ReflectionEditor
                key={activeEntry.id}
                entry={activeEntry}
                onSave={handleSaveReflection}
                onDelete={promptDeleteReflection}
                onBack={() => setActiveView("journal")}
                onShare={promptShareReflection}
                isSaving={isSaving}
                saveError={saveError}
                onClearSaveError={() => setSaveError(null)}
                mobileTab={mobileEditorTab}
                onToggleHistoryDrawer={handleToggleHistory}
                historyCount={reflections.length}
              />
            </main>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (< sm) - Frozen permanently at bottom of screen */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 left-0 right-0 sm:hidden z-40 bg-white/95 backdrop-blur-md border-t border-[#e9e6f0] h-14 flex items-center justify-around px-2 shadow-[0_-2px_12px_rgba(0,0,0,0.06)] select-none"
      >
        {/* 1. My Journal */}
        <button
          id="mobile-nav-my-journal"
          type="button"
          onClick={() => setActiveView("journal")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] ${
            activeView === "journal"
              ? "text-slate-900 font-semibold"
              : "text-slate-400 hover:text-slate-600 font-medium"
          }`}
        >
          <div
            className={`p-1 rounded-lg transition ${
              activeView === "journal" ? "bg-slate-100 text-slate-900" : ""
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5 whitespace-nowrap">My Journal</span>
        </button>

        {/* 2. Middle + Button */}
        <button
          id="mobile-nav-plus-btn"
          type="button"
          onClick={handleNewReflection}
          className="flex flex-col items-center justify-center py-0.5 px-2.5 rounded-xl transition min-w-[56px] text-sky-600 group active:scale-95"
          title="Write New Reflection"
        >
          <div className="p-1.5 rounded-xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white shadow-xs group-hover:shadow-sm">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5 font-semibold text-slate-700">Write</span>
        </button>

        {/* 3. Ask ReflectAI (AI Overview) */}
        <button
          id="mobile-nav-ask-reflectai"
          type="button"
          onClick={() => setActiveView("explore")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition min-w-[56px] ${
            activeView === "explore"
              ? "text-indigo-600 font-semibold"
              : "text-slate-400 hover:text-slate-600 font-medium"
          }`}
        >
          <div
            className={`p-1 rounded-lg transition ${
              activeView === "explore" ? "bg-indigo-50 text-indigo-600" : ""
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-[10px] leading-tight mt-0.5 whitespace-nowrap">Ask ReflectAI</span>
        </button>
      </nav>

      {/* Floating AI Assistant Bot Button (Floating Circle Pen) - Strictly only in write/editor page */}
      {activeView === "editor" && (
        <button
          id="floating-ai-assistant-bot-btn"
          type="button"
          onClick={() => {
            setMobileEditorTab((prev) => (prev === "journal" ? "companion" : "journal"));
          }}
          className="fixed bottom-18 sm:bottom-6 right-4 sm:right-6 z-40 w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl shadow-indigo-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          title={
            mobileEditorTab === "companion"
              ? "Switch to Journal Writing"
              : "Open AI Writing Assistant"
          }
          aria-label="AI Writing Assistant Bot"
        >
          <div className="relative flex items-center justify-center">
            <PenLine className="w-5 h-5 text-white stroke-[2.2] group-hover:rotate-6 transition-transform" />
            <Sparkles className="w-3 h-3 text-sky-200 absolute -top-1.5 -right-1.5 animate-pulse" />
          </div>
        </button>
      )}

      {/* Accessible In-App Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!entryToDelete}
        title={entryToDelete?.title || "Untitled Reflection"}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) {
            setEntryToDelete(null);
          }
        }}
      />

      {/* Explicit Share Memory Modal */}
      <ShareMemoryModal
        isOpen={!!entryToShare}
        entry={entryToShare}
        onClose={() => setEntryToShare(null)}
      />
    </div>
  );
}

