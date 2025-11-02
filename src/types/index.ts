export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  chapter_count?: number;
  page_size?: 'A4' | 'A3';
  orientation?: 'portrait' | 'landscape';
}

export interface Chapter {
  id: string;
  project_id: string;
  title: string;
  content: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  role: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  date?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

export type AIMode = 'write' | 'brainstorm' | 'chat' | 'character' | 'plot';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface EditorState {
  content: string;
  isDirty: boolean;
  wordCount: number;
  selectionRange: {
    start: number;
    end: number;
  } | null;
}

export interface AppState {
  currentProject: Project | null;
  currentChapter: Chapter | null;
  currentUser: any | null;
  isDirty: boolean;
  wordTarget: number;
  chapterCache: Map<string, Chapter>;
  isLoading: boolean;
  loadingMessage: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ContextItem {
  id: string;
  type: 'character' | 'location' | 'timeline';
  name: string;
  description?: string;
}
