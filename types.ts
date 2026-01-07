
export enum ChatStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  speakerId?: string; // Omi uses speaker IDs
  start?: number; // Segment start time in seconds
  end?: number; // Segment end time in seconds
}

export interface Geolocation {
  latitude?: number;
  longitude?: number;
  locality?: string;
  address?: string;
  googlePlaceId?: string;
}

export interface Chat {
  id: string;
  title: string;
  summary: string;
  previewText: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  tags: string[];
  folderId?: string | null;
  isFavorite: boolean;
  status: ChatStatus;
  participants: string[];
  unreadCount: number;
  messages?: ChatMessage[];
  transcription?: any[]; // To store raw segments if needed
  source?: string; // e.g. 'phone', 'omi', 'plaud', 'frame', 'screenpipe'
  language?: string; // Language code (e.g., 'en', 'pt')
  geolocation?: Geolocation; // Location data from Omi
  discarded?: boolean; // Whether conversation was discarded
}

export interface ActionItem {
  id: string;
  description: string;
  details?: string;
  completed: boolean;
  dueDate?: string;
  conversationId?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  folderId?: string | null;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  color?: string;
  type?: 'chat' | 'memory' | 'action_item';
}

export type AppContextType = 'conversations' | 'memories' | 'action_items' | 'dashboard';

export type ChatFilterType = 'all' | 'favorites' | 'archived' | 'folder' | 'memories' | 'action_items';

export interface ChatFilter {
  type: ChatFilterType;
  folderId?: string;
  searchQuery: string;
}

export interface Memory {
  id: string;
  title?: string;
  content: string;
  category: 'interesting' | 'system' | 'manual';
  visibility: 'public' | 'private';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isStarred: boolean; // Local override
  isArchived?: boolean; // Local archive status
  folderId?: string; // Local organization
  manuallyAdded?: boolean; // Whether memory was manually added
  scoring?: string; // Omi internal scoring value
}

// Deprecated or mapped legacy types for compatibility if needed,
// but best to switch to new names.
export type Lifelog = Memory;