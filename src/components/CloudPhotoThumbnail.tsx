import React, { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";
import { PhotoMemory } from "../types";
import { resolvePhotoUrl } from "../lib/photoStorage";

interface CloudPhotoThumbnailProps {
  photo: PhotoMemory;
  alt?: string;
  className?: string;
  isMini?: boolean;
  userId?: string;
  reflectionId?: string;
}

export const CloudPhotoThumbnail: React.FC<CloudPhotoThumbnailProps> = ({
  photo,
  alt,
  className = "w-full h-full object-cover",
  isMini = false,
  userId,
  reflectionId,
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | null>(
    photo.previewUrl || photo.downloadUrl || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!currentSrc && Boolean(photo.id));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    if (photo.previewUrl || photo.downloadUrl) {
      setCurrentSrc(photo.previewUrl || photo.downloadUrl || null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // Attempt resolution from cache or Firestore subcollection
    if (photo.id) {
      setIsLoading(true);
      resolvePhotoUrl(userId, reflectionId, photo.id, photo.previewUrl)
        .then((url) => {
          if (isMounted) {
            if (url) {
              setCurrentSrc(url);
              setHasError(false);
            } else {
              setHasError(true);
            }
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setIsLoading(false);
            setHasError(true);
          }
        });
    } else {
      setIsLoading(false);
      setHasError(true);
    }

    return () => {
      isMounted = false;
    };
  }, [photo.previewUrl, photo.downloadUrl, photo.id, userId, reflectionId]);

  const handleImageError = () => {
    // If runtime image load failed, try resolving once from store
    if (photo.id) {
      resolvePhotoUrl(userId, reflectionId, photo.id)
        .then((url) => {
          if (url && url !== currentSrc) {
            setCurrentSrc(url);
            setHasError(false);
          } else {
            setHasError(true);
          }
        })
        .catch(() => {
          setHasError(true);
        });
    } else {
      setHasError(true);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 animate-pulse text-slate-400">
        <ImageIcon className={isMini ? "w-4 h-4 text-slate-400" : "w-6 h-6 text-slate-400"} />
      </div>
    );
  }

  if (hasError || !currentSrc) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-1 text-center">
        {isMini ? (
          <ImageIcon className="w-4 h-4 text-slate-400" />
        ) : (
          <>
            <ImageIcon className="w-5 h-5 text-slate-400 mb-1" />
            <span className="text-[10px] text-slate-500 truncate max-w-full px-1 font-sans">
              {photo.fileName || photo.name}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt || photo.name || "Visual memory"}
      className={className}
      onError={handleImageError}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};
