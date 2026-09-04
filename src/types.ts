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

export interface ReflectionEntry {
  id: string;
  userId: string;
  title: string;
  journalText: string;
  category: string;
  messages: ChatMessage[];
  insights?: ReflectionInsights;
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
