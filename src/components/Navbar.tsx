import React from "react";
import {
  Plus,
  LogOut,
  Menu,
  User as UserIcon,
  LayoutDashboard,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { AuthUserState, AppView } from "../types";
import { logOut } from "../lib/firebase";
import { ReflectLogo, ReflectWordmark } from "./ReflectLogo";

interface NavbarProps {
  user: AuthUserState;
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onNewReflection: () => void;
  onToggleSidebar?: () => void;
  isSaving?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  onChangeView,
  onNewReflection,
  onToggleSidebar,
}) => {
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <nav
      id="app-navbar"
      className="border-b border-[#e9e6f0] bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
    >
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Left branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => onChangeView("journal")}
            className="flex items-center gap-2.5 cursor-pointer"
            title="Go to My Journal"
          >
            <ReflectLogo size={30} />
            <ReflectWordmark size="md" showTagline={false} theme="light" />
          </div>
        </div>

        {/* Center: Main View Navigation (1. My Journal, 2. + Button, 3. Ask ReflectAI) */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* 1. My Journal */}
          <button
            id="nav-tab-my-journal"
            type="button"
            onClick={() => onChangeView("journal")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition font-medium ${
              activeView === "journal"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-700" />
            <span>My Journal</span>
          </button>

          {/* 2. Middle + Button */}
          <button
            id="nav-tab-middle-plus"
            type="button"
            onClick={onNewReflection}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-xs transition active:scale-95 group"
            title="Write New Reflection"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New</span>
          </button>

          {/* 3. Ask ReflectAI (AI Overview) */}
          <button
            id="nav-tab-ask-reflectai"
            type="button"
            onClick={() => onChangeView("explore")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs transition font-medium ${
              activeView === "explore"
                ? "bg-white text-indigo-700 shadow-xs font-semibold"
                : "text-slate-600 hover:text-indigo-900 hover:bg-white/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Ask ReflectAI</span>
          </button>
        </div>

        {/* Right Actions: User profile and sign out */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* User profile item */}
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User avatar"}
                className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold">
                {user.displayName ? (
                  user.displayName.charAt(0).toUpperCase()
                ) : (
                  <UserIcon className="w-3.5 h-3.5" />
                )}
              </div>
            )}

            <div className="hidden lg:block text-left">
              <p className="text-xs font-medium text-slate-900 leading-tight truncate max-w-[110px]">
                {user.displayName || (user.isAnonymous ? "Guest" : "User")}
              </p>
              <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                {user.email || (user.isAnonymous ? "Local" : "Auth")}
              </p>
            </div>

            {/* Sign Out Button */}
            <button
              id="sign-out-btn"
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-0.5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
