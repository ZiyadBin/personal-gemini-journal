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
import { ReflectionEntry, AuthUserState } from "./types";
import { LandingPage } from "./components/LandingPage";
import { Navbar } from "./components/Navbar";
import { ReflectionHistory } from "./components/ReflectionHistory";
import { ReflectionEditor } from "./components/ReflectionEditor";
import { RefreshCw } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<AuthUserState | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Reflections state
  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentEntry, setCurrentEntry] = useState<ReflectionEntry | null>(null);

  // Persistence status
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Mobile drawer
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

        // If no active reflection is selected, select the first or create fresh
        if (!selectedId) {
          if (entries.length > 0) {
            setSelectedId(entries[0].id);
            setCurrentEntry(entries[0]);
          } else {
            const fresh = createFreshEntry(user.uid);
            setSelectedId(fresh.id);
            setCurrentEntry(fresh);
          }
        } else {
          // Keep currentEntry updated with Firestore sync
          const matching = entries.find((e) => e.id === selectedId);
          if (matching) {
            setCurrentEntry((prev) => {
              // Avoid clobbering in-progress local edits if same ID
              if (!prev || prev.id !== matching.id) return matching;
              return {
                ...matching,
                // Preserve local draft text if user is typing
                journalText: prev.journalText || matching.journalText,
                title: prev.title || matching.title,
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
  }, [user?.uid, createFreshEntry]);

  // Handle creating a new reflection
  const handleNewReflection = () => {
    if (!user) return;
    const fresh = createFreshEntry(user.uid);
    setSelectedId(fresh.id);
    setCurrentEntry(fresh);
    setMobileSidebarOpen(false);
  };

  // Handle selecting an existing reflection
  const handleSelectReflection = (entry: ReflectionEntry) => {
    setSelectedId(entry.id);
    setCurrentEntry(entry);
    setMobileSidebarOpen(false);
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

  // Handle deleting a reflection
  const handleDeleteReflection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this reflection? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteReflection(user.uid, id);
      if (selectedId === id) {
        const remaining = reflections.filter((r) => r.id !== id);
        if (remaining.length > 0) {
          setSelectedId(remaining[0].id);
          setCurrentEntry(remaining[0]);
        } else {
          const fresh = createFreshEntry(user.uid);
          setSelectedId(fresh.id);
          setCurrentEntry(fresh);
        }
      }
    } catch (err: any) {
      console.error("Failed to delete reflection:", err);
      setSaveError("Could not delete reflection: " + err.message);
    }
  };

  // 3. Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          <p className="text-sm font-medium">Connecting to ReflectAI...</p>
        </div>
      </div>
    );
  }

  // 4. If unauthenticated, show landing page with Google sign-in
  if (!user) {
    return <LandingPage />;
  }

  // Active entry fallback
  const activeEntry = currentEntry || createFreshEntry(user.uid);

  // 5. Authenticated private dashboard
  return (
    <div id="authenticated-app-root" className="min-h-screen flex flex-col bg-zinc-950 text-zinc-200">
      {/* Navigation */}
      <Navbar
        user={user}
        onNewReflection={handleNewReflection}
        onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        isSaving={isSaving}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar: Past Reflections */}
        <div className="hidden md:block">
          <ReflectionHistory
            entries={reflections}
            selectedId={selectedId}
            onSelect={handleSelectReflection}
            onNew={handleNewReflection}
            onDelete={handleDeleteReflection}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-50 w-80 max-w-[85vw] h-full bg-zinc-950 border-r border-zinc-800 shadow-2xl">
              <ReflectionHistory
                entries={reflections}
                selectedId={selectedId}
                onSelect={handleSelectReflection}
                onNew={handleNewReflection}
                onDelete={handleDeleteReflection}
                onCloseMobile={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Center/Right: Reflection Editor & Gemini Companion */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ReflectionEditor
            key={activeEntry.id}
            entry={activeEntry}
            onSave={handleSaveReflection}
            isSaving={isSaving}
            saveError={saveError}
            onClearSaveError={() => setSaveError(null)}
          />
        </main>
      </div>
    </div>
  );
}
