export const DEFAULT_CATEGORIES = [
  "Personal Growth",
  "Work & Focus",
  "Creative Ideas",
  "Gratitude",
  "Mindfulness",
] as const;

export const CATEGORIES = DEFAULT_CATEGORIES;

export type CategoryName = (typeof DEFAULT_CATEGORIES)[number] | string;

const ACTIVE_CATEGORIES_KEY = "reflectai_active_categories_v2";
const LEGACY_CUSTOM_KEY = "reflectai_custom_categories";
export const CATEGORIES_UPDATED_EVENT = "reflectai_categories_updated";

/**
 * Get all active categories.
 * Initialized from default categories, and fully editable/deletable by the user.
 */
export function getAllCategories(): string[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_CATEGORIES];
  }
  try {
    const stored = localStorage.getItem(ACTIVE_CATEGORIES_KEY);
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Migrate from legacy custom categories if present
    const legacyStored = localStorage.getItem(LEGACY_CUSTOM_KEY);
    if (legacyStored) {
      const legacyCustom: string[] = JSON.parse(legacyStored);
      const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...legacyCustom]));
      localStorage.setItem(ACTIVE_CATEGORIES_KEY, JSON.stringify(merged));
      return merged;
    }

    // Default initialization
    localStorage.setItem(ACTIVE_CATEGORIES_KEY, JSON.stringify([...DEFAULT_CATEGORIES]));
    return [...DEFAULT_CATEGORIES];
  } catch (err) {
    console.error("Failed to read categories from localStorage:", err);
    return [...DEFAULT_CATEGORIES];
  }
}

function saveCategories(list: string[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ACTIVE_CATEGORIES_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
    } catch (err) {
      console.error("Failed to save categories to localStorage:", err);
    }
  }
}

/**
 * Adds a new category (from typing @name or from the category manager).
 */
export function registerCategory(name: string): string {
  const trimmed = name.trim().replace(/^@+/, "").trim();
  if (!trimmed) return "Personal Growth";

  const current = getAllCategories();
  const existing = current.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) return existing;

  // Format into clean title-cased name
  const formatted = trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  const updated = [...current, formatted];
  saveCategories(updated);
  return formatted;
}

/**
 * Renames an existing category (including defaults).
 */
export function renameCategory(oldName: string, newName: string): boolean {
  const trimmedNew = newName.trim().replace(/^@+/, "").trim();
  if (!trimmedNew || trimmedNew.length < 2) return false;

  const current = getAllCategories();
  const index = current.findIndex(
    (c) => c.toLowerCase() === oldName.toLowerCase()
  );
  if (index === -1) return false;

  // Check if new name conflicts with another existing category
  const conflict = current.find(
    (c, i) => i !== index && c.toLowerCase() === trimmedNew.toLowerCase()
  );
  if (conflict) return false;

  // Format title case
  const formatted = trimmedNew
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  current[index] = formatted;
  saveCategories(current);
  return true;
}

/**
 * Deletes any category (including defaults).
 */
export function deleteCategory(name: string): boolean {
  const current = getAllCategories();
  const nextList = current.filter(
    (c) => c.toLowerCase() !== name.toLowerCase()
  );

  // Keep at least one category to avoid zero-state picker errors
  if (nextList.length === 0) {
    nextList.push("Personal Growth");
  }

  saveCategories(nextList);
  return true;
}

/**
 * Legacy compatibility alias for deleteCategory.
 */
export function removeCustomCategory(name: string): boolean {
  return deleteCategory(name);
}

/**
 * Restores original factory default categories.
 */
export function resetCategoriesToDefault(): string[] {
  const list = [...DEFAULT_CATEGORIES];
  saveCategories(list);
  return list;
}

export interface CategoryTheme {
  name: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
  accentGradient: string;
}

/**
 * Deterministic mapping for categories into very light pastel accents.
 */
export function getCategoryTheme(category: string): CategoryTheme {
  const norm = (category || "").toLowerCase().trim();

  if (norm.includes("growth") || norm.includes("personal")) {
    return {
      name: "Personal Growth",
      cardBg: "bg-purple-50/40 hover:bg-purple-50/70",
      cardBorder: "border-purple-200/60 hover:border-purple-300",
      badgeBg: "bg-purple-50",
      badgeBorder: "border-purple-200/80",
      badgeText: "text-purple-700",
      dotColor: "bg-purple-400",
      accentGradient: "from-purple-500 to-indigo-500",
    };
  }

  if (norm.includes("work") || norm.includes("focus") || norm.includes("career")) {
    return {
      name: "Work & Focus",
      cardBg: "bg-sky-50/40 hover:bg-sky-50/70",
      cardBorder: "border-sky-200/60 hover:border-sky-300",
      badgeBg: "bg-sky-50",
      badgeBorder: "border-sky-200/80",
      badgeText: "text-sky-700",
      dotColor: "bg-sky-400",
      accentGradient: "from-sky-500 to-blue-600",
    };
  }

  if (norm.includes("idea") || norm.includes("creative") || norm.includes("project")) {
    return {
      name: "Creative Ideas",
      cardBg: "bg-amber-50/40 hover:bg-amber-50/70",
      cardBorder: "border-amber-200/60 hover:border-amber-300",
      badgeBg: "bg-amber-50",
      badgeBorder: "border-amber-200/80",
      badgeText: "text-amber-800",
      dotColor: "bg-amber-400",
      accentGradient: "from-amber-500 to-orange-500",
    };
  }

  if (norm.includes("gratitude") || norm.includes("thankful") || norm.includes("appreciation")) {
    return {
      name: "Gratitude",
      cardBg: "bg-emerald-50/40 hover:bg-emerald-50/70",
      cardBorder: "border-emerald-200/60 hover:border-emerald-300",
      badgeBg: "bg-emerald-50",
      badgeBorder: "border-emerald-200/80",
      badgeText: "text-emerald-700",
      dotColor: "bg-emerald-400",
      accentGradient: "from-emerald-500 to-teal-600",
    };
  }

  if (norm.includes("mind") || norm.includes("zen") || norm.includes("calm") || norm.includes("peace")) {
    return {
      name: "Mindfulness",
      cardBg: "bg-teal-50/40 hover:bg-teal-50/70",
      cardBorder: "border-teal-200/60 hover:border-teal-300",
      badgeBg: "bg-teal-50",
      badgeBorder: "border-teal-200/80",
      badgeText: "text-teal-700",
      dotColor: "bg-teal-400",
      accentGradient: "from-teal-500 to-cyan-600",
    };
  }

  // Deterministic fallback based on string hash
  const hash = norm.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palettes = [
    {
      badgeBg: "bg-indigo-50",
      badgeBorder: "border-indigo-200/80",
      badgeText: "text-indigo-700",
      cardBg: "bg-indigo-50/30 hover:bg-indigo-50/60",
      cardBorder: "border-indigo-200/60 hover:border-indigo-300",
      dotColor: "bg-indigo-400",
      accentGradient: "from-indigo-500 to-blue-600",
    },
    {
      badgeBg: "bg-rose-50",
      badgeBorder: "border-rose-200/80",
      badgeText: "text-rose-700",
      cardBg: "bg-rose-50/30 hover:bg-rose-50/60",
      cardBorder: "border-rose-200/60 hover:border-rose-300",
      dotColor: "bg-rose-400",
      accentGradient: "from-rose-500 to-pink-600",
    },
    {
      badgeBg: "bg-slate-100",
      badgeBorder: "border-slate-200",
      badgeText: "text-slate-700",
      cardBg: "bg-slate-50/50 hover:bg-slate-50/90",
      cardBorder: "border-slate-200/80 hover:border-slate-300",
      dotColor: "bg-slate-400",
      accentGradient: "from-slate-600 to-slate-800",
    },
  ];

  const chosen = palettes[hash % palettes.length];
  return {
    name: category || "General",
    ...chosen,
  };
}
