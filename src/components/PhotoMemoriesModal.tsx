import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Image as ImageIcon,
  Upload,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { PhotoMemory } from "../types";
import { uploadPhotoToCloudStorage, validatePhotoFile } from "../lib/photoStorage";

interface PhotoMemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPhotos: (photos: PhotoMemory[]) => void;
  existingCount: number;
  userId: string;
  reflectionId: string;
}

interface StagedFile {
  file: File;
  name: string;
  previewUrl: string;
}

export const PhotoMemoriesModal: React.FC<PhotoMemoriesModalProps> = ({
  isOpen,
  onClose,
  onAddPhotos,
  existingCount,
  userId,
  reflectionId,
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up object URLs on unmount or reset
  useEffect(() => {
    return () => {
      stagedFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, [stagedFiles]);

  if (!isOpen) return null;

  // Handle local device photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    const remainingSlots = 6 - (existingCount + stagedFiles.length);
    if (remainingSlots <= 0) {
      setUploadError("You can attach up to 6 photos per reflection to keep writing primary.");
      return;
    }

    const newFiles: StagedFile[] = [];
    const filesToRead = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToRead) {
      const validation = validatePhotoFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || `File ${file.name} is not valid.`);
        continue;
      }

      // Generate temporary object URL for local staging preview
      const objectUrl = URL.createObjectURL(file);
      newFiles.push({
        file,
        name: file.name,
        previewUrl: objectUrl,
      });
    }

    setStagedFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveStaged = (index: number) => {
    if (isUploading) return;
    setStagedFiles((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) {
        URL.revokeObjectURL(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleConfirmAdd = async () => {
    if (stagedFiles.length === 0 || isUploading) {
      onClose();
      return;
    }

    if (!userId || !reflectionId) {
      setUploadError("User authentication or reflection session is missing.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    abortControllerRef.current = new AbortController();
    const uploadedPhotos: PhotoMemory[] = [];

    try {
      for (let i = 0; i < stagedFiles.length; i++) {
        if (abortControllerRef.current.signal.aborted) {
          break;
        }

        const item = stagedFiles[i];
        setUploadProgress(`Processing photo ${i + 1} of ${stagedFiles.length}...`);

        const uploadedPhoto = await uploadPhotoToCloudStorage(
          userId,
          reflectionId,
          item.file,
          abortControllerRef.current.signal
        );
        uploadedPhotos.push(uploadedPhoto);
      }

      // Clean up staged previews
      stagedFiles.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });

      setStagedFiles([]);
      if (uploadedPhotos.length > 0) {
        onAddPhotos(uploadedPhotos);
      }
      onClose();
    } catch (err: any) {
      if (err?.message === "Upload was canceled.") {
        // Canceled cleanly by user
        return;
      }
      console.error("Photo processing error:", err);
      setUploadError(
        err?.message || "Failed to process photo. Please try again."
      );
    } finally {
      setIsUploading(false);
      setUploadProgress("");
      abortControllerRef.current = null;
    }
  };

  const handleCloseModal = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress("");
    stagedFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setStagedFiles([]);
    setUploadError(null);
    onClose();
  };

  return (
    <div
      id="photo-memories-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={handleCloseModal}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#e9e6f0] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FAF9FC]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold font-heading text-slate-900 leading-tight">
                Add Visual Memories
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Select photos directly from your device (up to 6)
              </p>
            </div>
          </div>

          <button
            id="close-photo-modal-btn"
            onClick={handleCloseModal}
            aria-label="Close photo memories modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans">
          {/* Privacy Notice Banner */}
          <div className="flex items-start gap-2.5 p-3.5 bg-sky-50/60 border border-sky-200/70 rounded-2xl text-xs text-sky-900 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Private Cloud Sync</p>
              <p className="text-slate-600 text-[11px] mt-0.5 leading-normal">
                Photos are web-optimized for fast loading, saved securely in your isolated cloud database, and sync across your devices.
              </p>
            </div>
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Notice</p>
                <p className="text-[11px] text-rose-700 mt-0.5">{uploadError}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* File input trigger */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={isUploading}
              onChange={handleFileChange}
              className="hidden"
              id="device-photo-input"
            />

            <div
              onClick={() => {
                if (!isUploading) fileInputRef.current?.click();
              }}
              className={`p-6 border-2 border-dashed border-slate-200 hover:border-sky-300 rounded-2xl bg-slate-50/50 hover:bg-sky-50/20 text-center transition flex flex-col items-center justify-center gap-2 ${
                isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-500">
                <Upload className="w-5 h-5 text-sky-600" />
              </div>
              <p className="text-xs font-medium text-slate-700">
                Click to select photos from your device
              </p>
              <p className="text-[11px] text-slate-400">
                PNG, JPG, WebP supported &middot; {Math.max(0, 6 - (existingCount + stagedFiles.length))} remaining slots
              </p>
            </div>

            {/* Staged photos preview */}
            {stagedFiles.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Selected for this reflection ({stagedFiles.length}):
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {stagedFiles.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl overflow-hidden aspect-square bg-slate-100 border border-slate-200 group"
                    >
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {!isUploading && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStaged(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-4 bg-[#FAF9FC] border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            id="cancel-photo-modal-btn"
            onClick={handleCloseModal}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            {isUploading ? "Cancel" : "Cancel"}
          </button>
          <button
            type="button"
            id="confirm-add-photos-btn"
            onClick={handleConfirmAdd}
            disabled={stagedFiles.length === 0 || isUploading}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-xs font-medium rounded-xl shadow-xs hover:shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{uploadProgress || "Processing..."}</span>
              </>
            ) : (
              <span>Attach {stagedFiles.length > 0 ? `(${stagedFiles.length})` : ""}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
