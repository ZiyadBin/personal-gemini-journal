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

  // Guarantee undefined values are strictly removed before passing to Firestore
  const sanitized = sanitizeForFirestore<ReflectionEntry>({
    ...entry,
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
  const docRef = doc(db, "users", userId, "reflections", reflectionId);
  await deleteDoc(docRef);
}
