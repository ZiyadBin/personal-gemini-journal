import React from "react";
import { Sparkles, Plus, LogOut, ShieldCheck, Menu, User as UserIcon } from "lucide-react";
import { AuthUserState } from "../types";
import { logOut } from "../lib/firebase";

interface NavbarProps {
  user: AuthUserState;
  onNewReflection: () => void;
  onToggleSidebar?: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onNewReflection,
  onToggleSidebar,
  isSaving,
}) => {
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <nav id="app-navbar" className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left branding & mobile toggle */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              id="toggle-sidebar-btn"
              onClick={onToggleSidebar}
              aria-label="Toggle history menu"
              className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800/60 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-semibold text-zinc-100 text-base leading-none block">
                ReflectAI
              </span>
              <span className="text-[11px] text-zinc-400 font-normal block mt-0.5">
                Gemini &bull; Firestore
              </span>
            </div>
          </div>

          {/* Privacy badge */}
          <div className="hidden lg:flex items-center gap-1.5 ml-4 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Isolated Firestore Storage</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* New reflection trigger */}
          <button
            id="nav-new-reflection-btn"
            onClick={onNewReflection}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>

          {/* User profile item */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User avatar"}
                className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 text-xs font-semibold">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
            )}

            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-zinc-200 leading-tight truncate max-w-[130px]">
                {user.displayName || (user.isAnonymous ? "Guest Explorer" : "User")}
              </p>
              <p className="text-[10px] text-zinc-400 truncate max-w-[130px]">
                {user.email || (user.isAnonymous ? "Local Session" : "Authenticated")}
              </p>
            </div>

            {/* Sign Out Button */}
            <button
              id="sign-out-btn"
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
