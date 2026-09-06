export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface ReflectionInsights {
  title?: string;
  summary?: string;
  keyThemes?: string[];
  insights?: string[];
  actionItems?: string[];
  sentiment?: string;
}

export interface PhotoMemory {
  id: string;
  name: string;
  fileName?: string;
  storagePath?: string; // users/{uid}/reflections/{reflectionId}/photos/{photoId}
  downloadUrl?: string; // Durable HTTPS reference URL from Firebase Cloud Storage
  previewUrl?: string; // Resolved URL for instant rendering across devices
  contentType?: string;
  fileSize?: number;
  uploadedAt?: number;
  source: "local" | "google_photos" | "cloud_storage";
  addedAt: number;
}

export interface JournalLocation {
  placeName: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface ReflectionEntry {
  id: string;
  userId: string;
  title: string;
  journalText: string;
  category: string;
  messages: ChatMessage[];
  insights?: ReflectionInsights;
  photos?: PhotoMemory[];
  location?: JournalLocation | null;
  createdAt: number;
  updatedAt: number;
}

export interface AuthUserState {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type AppView = "journal" | "explore" | "editor";
