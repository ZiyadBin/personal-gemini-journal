import React, { useEffect } from "react";
import { Trash2, RefreshCw } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  // Listen for Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      id="delete-confirmation-dialog-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-desc"
    >
      <div
        id="delete-confirmation-card"
        className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200/90 transform transition-all animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="delete-dialog-title"
              className="text-base font-semibold text-slate-900 font-heading"
            >
              Delete Reflection?
            </h3>
            <p
              id="delete-dialog-desc"
              className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed"
            >
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                &ldquo;{title || "Untitled Reflection"}&rdquo;
              </span>
              ? This action will permanently remove this reflection and its conversation history from your cloud journal.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 active:scale-98"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Reflection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
