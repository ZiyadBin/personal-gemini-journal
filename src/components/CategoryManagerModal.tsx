import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Tag,
  Check,
  Edit2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import {
  getAllCategories,
  registerCategory,
  renameCategory,
  deleteCategory,
  resetCategoriesToDefault,
  getCategoryTheme,
} from "../lib/categories";
import { ReflectionEntry } from "../types";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries?: ReflectionEntry[];
  onSelectCategory?: (category: string) => void;
  onCategoryRenamed?: (oldName: string, newName: string) => Promise<void> | void;
  onCategoryDeleted?: (categoryName: string) => Promise<void> | void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  entries = [],
  onSelectCategory,
  onCategoryRenamed,
  onCategoryDeleted,
}) => {
  const [categories, setCategories] = useState<string[]>(getAllCategories());
  const [newCatInput, setNewCatInput] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const refreshCategories = () => {
    setCategories(getAllCategories());
  };

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newCatInput.trim().replace(/^@+/, "").trim();
    if (!clean) return;

    if (clean.length < 2) {
      setErrorMsg("Category name must be at least 2 characters.");
      return;
    }

    if (clean.length > 30) {
      setErrorMsg("Category name cannot exceed 30 characters.");
      return;
    }

    const saved = registerCategory(clean);
    refreshCategories();
    setNewCatInput("");
    setErrorMsg(null);
    setSuccessMsg(`Added "${saved}" to categories.`);
    setTimeout(() => setSuccessMsg(null), 2500);

    if (onSelectCategory) {
      onSelectCategory(saved);
    }
  };

  const handleStartEdit = (cat: string) => {
    setEditingCat(cat);
    setEditingValue(cat);
    setErrorMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingCat(null);
    setEditingValue("");
    setErrorMsg(null);
  };

  const handleSaveEdit = async (oldName: string) => {
    const clean = editingValue.trim().replace(/^@+/, "").trim();
    if (!clean) {
      setErrorMsg("Category name cannot be empty.");
      return;
    }

    if (clean.toLowerCase() === oldName.toLowerCase()) {
      handleCancelEdit();
      return;
    }

    if (clean.length < 2) {
      setErrorMsg("Category name must be at least 2 characters.");
      return;
    }

    const success = renameCategory(oldName, clean);
    if (!success) {
      setErrorMsg(`A category named "${clean}" already exists.`);
      return;
    }

    refreshCategories();
    setEditingCat(null);
    setEditingValue("");
    setSuccessMsg(`Renamed to "${clean}".`);
    setTimeout(() => setSuccessMsg(null), 2500);

    if (onCategoryRenamed) {
      await onCategoryRenamed(oldName, clean);
    }
  };

  const handleConfirmDelete = async (cat: string) => {
    const success = deleteCategory(cat);
    if (success) {
      refreshCategories();
      setDeletingCat(null);
      setSuccessMsg(`Deleted "${cat}".`);
      setTimeout(() => setSuccessMsg(null), 2500);

      if (onCategoryDeleted) {
        await onCategoryDeleted(cat);
      }
    }
  };

  const handleResetDefaults = () => {
    resetCategoriesToDefault();
    refreshCategories();
    setSuccessMsg("Reset categories to default list.");
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // Count reflections per category
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const c = entry.category || "Personal Growth";
    counts[c] = (counts[c] || 0) + 1;
  }

  return (
    <div
      id="category-manager-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e9e6f0] overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FAF9FC]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold font-heading text-slate-900 leading-tight">
                Manage Categories
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Edit, rename, delete, or create categories
              </p>
            </div>
          </div>

          <button
            id="close-category-manager-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Quick info */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 leading-relaxed">
            <p>
              💡 <strong>Tip:</strong> All categories can be customized, renamed, or removed. You can also type{" "}
              <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-sky-600 font-semibold">
                @category
              </code>{" "}
              in your editor to tag a reflection on the fly.
            </p>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                @
              </span>
              <input
                id="new-category-input"
                type="text"
                placeholder="New category name..."
                value={newCatInput}
                onChange={(e) => {
                  setNewCatInput(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full pl-7 pr-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
              />
            </div>
            <button
              id="add-new-category-btn"
              type="submit"
              className="flex items-center gap-1 px-3.5 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <p className="text-xs text-emerald-700 font-medium px-1 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{successMsg}</span>
            </p>
          )}

          {/* Categories List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-semibold text-slate-400 font-heading uppercase tracking-wider">
                Categories ({categories.length})
              </p>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition cursor-pointer"
                title="Restore standard default categories"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to defaults</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {categories.map((cat) => {
                const theme = getCategoryTheme(cat);
                const count = counts[cat] || 0;
                const isEditing = editingCat === cat;
                const isDeleting = deletingCat === cat;

                if (isEditing) {
                  return (
                    <div
                      key={cat}
                      className="p-2 rounded-xl bg-sky-50/50 border border-sky-200 flex items-center gap-2 animate-in fade-in duration-150"
                    >
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(cat);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        autoFocus
                        className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg focus:outline-hidden text-slate-800"
                        placeholder="Category name..."
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cat)}
                        className="p-1.5 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition cursor-pointer"
                        title="Save changes"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                if (isDeleting) {
                  return (
                    <div
                      key={cat}
                      className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between gap-2 animate-in fade-in duration-150"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-rose-900 leading-tight">
                          Delete &ldquo;{cat}&rdquo;?
                        </p>
                        {count > 0 && (
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            {count} {count === 1 ? "reflection" : "reflections"} will stay in your journal.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(cat)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-xs transition cursor-pointer"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCat(null)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-rose-200 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-100 transition group"
                  >
                    <div
                      className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      onClick={() => {
                        if (onSelectCategory) {
                          onSelectCategory(cat);
                          onClose();
                        }
                      }}
                      title={`Filter by ${cat}`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${theme.dotColor} shrink-0`}
                      />
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {cat}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({count} {count === 1 ? "entry" : "entries"})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        title={`Edit / rename "${cat}"`}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setDeletingCat(cat)}
                        title={`Delete category "${cat}"`}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF9FC] border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
