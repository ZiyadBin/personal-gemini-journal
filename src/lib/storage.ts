import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db, sanitizeForFirestore } from "./firebase";
import { ReflectionEntry } from "../types";

/**
 * Persists a reflection to Firestore, ensuring complete isolation to the user's path:
 * /users/{userId}/reflections/{reflectionId}
 * 
 * Strict Undefined-Stripping ensures zero payload crashes.
 */
export async function saveReflection(entry: ReflectionEntry): Promise<void> {
  if (!entry.userId) {
    throw new Error("Cannot save reflection without an authenticated userId.");
  }
  if (!entry.id) {
    throw new Error("Reflection ID is required.");
  }

  const docRef = doc(db, "users", entry.userId, "reflections", entry.id);

  // Strict Photo Metadata Hygiene:
  // Enforce zero raw bytes, zero base64, zero blob URLs in Firestore.
  // Store ONLY lightweight references and metadata in Firestore documents.
  const sanitizedPhotos = (entry.photos || []).map((photo) => {
    const isBlobUrl = photo.previewUrl?.startsWith("blob:") || false;
    const isDataUri = photo.previewUrl?.startsWith("data:") || false;

    // Use durable HTTPS download URL for preview, or omit if it was a temporary blob
    const safePreviewUrl = photo.downloadUrl
      ? photo.downloadUrl
      : !isBlobUrl && !isDataUri
      ? photo.previewUrl
      : undefined;

    return {
      id: photo.id,
      name: photo.name,
      fileName: photo.fileName || photo.name,
      storagePath: photo.storagePath || undefined,
      downloadUrl: photo.downloadUrl || undefined,
      previewUrl: safePreviewUrl || undefined,
      contentType: photo.contentType || undefined,
      fileSize: photo.fileSize || undefined,
      uploadedAt: photo.uploadedAt || undefined,
      source: photo.source || "cloud_storage",
      addedAt: photo.addedAt || Date.now(),
    };
  });

  // Strict Location Hygiene:
  // Store only placeName, latitude, longitude if present; or null if cleared
  const sanitizedLocation = entry.location && entry.location.placeName?.trim()
    ? {
        placeName: entry.location.placeName.trim(),
        latitude: typeof entry.location.latitude === "number" ? entry.location.latitude : null,
        longitude: typeof entry.location.longitude === "number" ? entry.location.longitude : null,
      }
    : null;

  // Guarantee undefined values are strictly removed before passing to Firestore
  const sanitized = sanitizeForFirestore<ReflectionEntry>({
    ...entry,
    photos: sanitizedPhotos,
    location: sanitizedLocation,
    updatedAt: Date.now(),
  });

  await setDoc(docRef, sanitized, { merge: true });
}

/**
 * Real-time subscription to the user's reflection list, ordered by latest updated.
 */
export function subscribeToReflections(
  userId: string,
  onUpdate: (entries: ReflectionEntry[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  const reflectionsCol = collection(db, "users", userId, "reflections");
  const q = query(reflectionsCol, orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ReflectionEntry[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ReflectionEntry);
      });
      onUpdate(items);
    },
    (err) => {
      console.error("Error subscribing to reflections:", err);
      onError(err);
    }
  );
}

/**
 * Deletes a reflection entry from Firestore.
 */
export async function deleteReflection(
  userId: string,
  reflectionId: string
): Promise<void> {
  if (!userId || !reflectionId) {
    throw new Error("Both userId and reflectionId are required for deletion.");
  }
  const path = `users/${userId}/reflections/${reflectionId}`;
  try {
    const docRef = doc(db, "users", userId, "reflections", reflectionId);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error(`Firestore deletion failed for path ${path}:`, error);
    throw new Error(error?.message || "Failed to delete reflection from database.");
  }
}
