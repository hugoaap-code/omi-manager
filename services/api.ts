
import { v4 as uuidv4 } from 'uuid';
import { localDB } from '../lib/localDB';
import { Chat, ChatStatus, ChatMessage, Folder, Memory, ActionItem } from '../types';

// API Base URL:
// - Development (localhost): Uses Vite proxy to bypass CORS
// - Production: Uses Firebase Function proxy to bypass CORS
const API_BASE = '/omi-proxy/v1/dev'; // Sempre usa o proxy local do Vite para evitar CORS

export const ApiService = {
    // --- Chats (Conversations) ---
    getChats: async (): Promise<Chat[]> => {
        const chats = await localDB.getAll<Chat>('chats');
        return chats || [];
    },

    updateChat: async (id: string, updates: Partial<Chat>): Promise<void> => {
        const chat = await localDB.get<Chat>('chats', id);
        if (chat) {
            await localDB.put('chats', { ...chat, ...updates, updatedAt: new Date().toISOString() });
        }
    },

    batchUpdateChats: async (ids: string[], updates: Partial<Chat>): Promise<void> => {
        for (const id of ids) {
            await ApiService.updateChat(id, updates);
        }
    },

    deleteChats: async (ids: string[]): Promise<void> => {
        await localDB.bulkDelete('chats', ids);
    },

    moveChatsToFolder: async (chatIds: string[], folderId: string | undefined): Promise<void> => {
        await ApiService.batchUpdateChats(chatIds, { folderId: folderId || null });
    },

    // --- Folders ---
    getFolders: async (type: 'chat' | 'memory' | 'action_item'): Promise<Folder[]> => {
        const folders = await localDB.getAll<Folder>('folders');
        return folders.filter(f => f.type === type || (!f.type && type === 'chat'));
    },

    createFolder: async (name: string, type: 'chat' | 'memory' | 'action_item'): Promise<Folder> => {
        const newFolder: Folder = {
            id: uuidv4(),
            name,
            icon: type === 'chat' ? 'message' : type === 'action_item' ? 'check-square' : 'activity',
            color: 'blue',
            type,
        };
        await localDB.put('folders', newFolder);
        return newFolder;
    },

    updateFolder: async (id: string, updates: { name: string; color: string }): Promise<Folder> => {
        const folder = await localDB.get<Folder>('folders', id);
        if (!folder) throw new Error('Folder not found');
        const updated = { ...folder, ...updates };
        await localDB.put('folders', updated);
        return updated;
    },

    deleteFolder: async (id: string): Promise<void> => {
        await localDB.delete('folders', id);
    },

    // --- Memories ---
    getMemories: async (): Promise<Memory[]> => {
        const items = await localDB.getAll<Memory>('memories');
        return items || [];
    },

    getLifelogs: async (date: string | null, searchQuery: string, timezone: string): Promise<Memory[]> => {
        let memories = await ApiService.getMemories();

        // Filter by date if provided
        if (date) {
            memories = memories.filter(m => {
                if (!m.createdAt) return false;
                // Simple UTC date comparison
                const memDate = new Date(m.createdAt).toISOString().split('T')[0];
                return memDate === date;
            });
        }

        // Filter by search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            memories = memories.filter(m =>
                (m.content && m.content.toLowerCase().includes(q)) ||
                (m.title && m.title.toLowerCase().includes(q)) ||
                (m.tags && m.tags.some(t => t.toLowerCase().includes(q)))
            );
        }

        return memories;
    },

    // --- Action Items ---
    getActionItems: async (): Promise<ActionItem[]> => {
        const items = await localDB.getAll<ActionItem>('action_items');
        return items || [];
    },

    updateActionItem: async (id: string, updates: Partial<ActionItem>): Promise<void> => {
        const item = await localDB.get<ActionItem>('action_items', id);
        if (item) {
            await localDB.put('action_items', { ...item, ...updates, updatedAt: new Date().toISOString() });
        }
    },

    // --- External Sync (Omi) ---

    syncWithOmi: async (token: string, onProgress?: (message: string, progress: number) => void): Promise<{ conversations: number, memories: number, actionItems: number }> => {
        if (!token) throw new Error("Token required");

        const PAGE_SIZE = 50;

        // Helper to fetch from omi API
        const fetchOmi = async (endpoint: string) => {
            console.log(`[Omi Sync] Fetching ${API_BASE}${endpoint}...`);
            const res = await fetch(`${API_BASE}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                console.error(`[Omi Sync] Error ${res.status} for ${endpoint}: ${res.statusText}`);
                try {
                    const errorBody = await res.text();
                    console.error("Response body:", errorBody);
                } catch (e) { }

                if (res.status === 404) {
                    throw new Error(`Endpoint not found: ${endpoint}. API path might be incorrect.`);
                }
                if (res.status === 401) {
                    throw new Error("Unauthorized. Please check your API Token.");
                }
                throw new Error(`API Error ${res.status} for ${endpoint}`);
            }
            return res.json();
        };

        // Helper to fetch all pages
        const fetchAllPages = async (baseEndpoint: string, extraParams: string = ''): Promise<any[]> => {
            let allItems: any[] = [];
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                const separator = baseEndpoint.includes('?') ? '&' : '?';
                const endpoint = `${baseEndpoint}${separator}limit=${PAGE_SIZE}&offset=${offset}${extraParams}`;
                const data: any[] = await fetchOmi(endpoint);

                if (data.length === 0) {
                    hasMore = false;
                } else {
                    allItems = allItems.concat(data);
                    offset += PAGE_SIZE;
                    console.log(`[Omi Sync] Fetched ${allItems.length} items so far...`);

                    // If we got less than PAGE_SIZE, we've reached the end
                    if (data.length < PAGE_SIZE) {
                        hasMore = false;
                    }
                }
            }

            return allItems;
        };

        // 1. Sync Conversations
        let convCount = 0;
        try {
            onProgress?.('Syncing conversations...', 10);
            const data = await fetchAllPages('/user/conversations', '&include_transcript=true');

            if (data.length > 0) {
                console.log("[Omi Sync] First conversation raw:", JSON.stringify(data[0], null, 2));
            }
            convCount = data.length;
            console.log(`[Omi Sync] Total conversations fetched: ${convCount}`);

            const mappedChats: Chat[] = data.map((c: any) => {
                const structured = c.structured || {};

                const title = structured.title || (c.started_at ? `Conversation ${new Date(c.started_at).toLocaleDateString()}` : "Untitled Conversation");

                let summary = structured.overview || "";

                // Build tags from category
                const tags: string[] = [];
                if (structured.category) {
                    tags.push(structured.category);
                }

                let messages: ChatMessage[] = [];
                if (c.transcript_segments && Array.isArray(c.transcript_segments) && c.transcript_segments.length > 0) {
                    messages = c.transcript_segments.map((seg: any, index: number) => {
                        const isUser = seg.is_user === true || seg.speaker_id === 0 || seg.speaker === 'SPEAKER_00';
                        return {
                            id: seg.id || `seg_${index}`,
                            role: isUser ? 'user' : 'assistant',
                            content: seg.text || '',
                            timestamp: c.started_at || c.created_at || new Date().toISOString(),
                            speakerId: seg.speaker_id?.toString() || seg.speaker || undefined,
                        } as ChatMessage;
                    });

                    if (!summary) {
                        summary = messages.slice(0, 3).map(m => m.content).join(' ').slice(0, 300);
                        if (summary.length >= 300) summary += '...';
                    }
                }

                if (!summary) summary = "No summary available";

                return {
                    id: c.id,
                    title: title,
                    summary: summary,
                    previewText: summary,
                    createdAt: c.started_at || c.created_at,
                    updatedAt: c.finished_at || c.started_at || c.created_at,
                    tags: tags,
                    isFavorite: false,
                    status: ChatStatus.ACTIVE,
                    participants: [],
                    unreadCount: 0,
                    messages: messages,
                    source: c.source,
                };
            });

            const existing = await localDB.getAll<Chat>('chats');
            const existingMap = new Map(existing.map(c => [c.id, c]));

            for (const chat of mappedChats) {
                const prev = existingMap.get(chat.id);
                const toSave = prev
                    ? { ...chat, folderId: prev.folderId, isFavorite: prev.isFavorite, tags: prev.tags }
                    : chat;
                await localDB.put('chats', toSave);
            }
        } catch (e) {
            console.error("Failed to sync conversations", e);
        }

        // 2. Sync Memories
        let memCount = 0;
        try {
            onProgress?.('Syncing memories...', 40);
            const data = await fetchAllPages('/user/memories');

            if (data.length > 0) {
                console.log("[Omi Sync] First memory raw:", JSON.stringify(data[0], null, 2));
            }
            memCount = data.length;
            console.log(`[Omi Sync] Total memories fetched: ${memCount}`);

            const mappedMemories: Memory[] = data.map((m: any) => {
                const content = m.content || "_No content available_";

                let title = content.split('\n')[0].slice(0, 60);
                if (title.length >= 60) title = title.slice(0, 57) + '...';
                if (!title) title = "Untitled Memory";

                // Build tags array from category and existing tags (Uniquely)
                const tags = new Set<string>();
                if (m.category) tags.add(m.category);
                if (m.tags && Array.isArray(m.tags)) {
                    m.tags.forEach((t: string) => {
                        if (t) tags.add(t);
                    });
                }

                // Date handling: try multiple fields from API
                // Note: Omi API currently does NOT return created_at for memories.
                // We use import date as fallback (this is an Omi API limitation).
                let dateStr = m.created_at || m.started_at || m.date;
                if (!dateStr && m.structured) {
                    dateStr = m.structured.date || m.structured.created_at || m.structured.started_at;
                }
                // Fallback to import date if API doesn't provide one
                if (!dateStr) {
                    dateStr = new Date().toISOString();
                }

                return {
                    id: m.id,
                    title: title,
                    content: content,
                    category: m.category || 'manual',
                    visibility: m.visibility || 'private',
                    tags: Array.from(tags),
                    createdAt: dateStr,
                    updatedAt: m.updated_at || dateStr,
                    isStarred: false,
                };
            });

            const existing = await localDB.getAll<Memory>('memories');
            const existingMap = new Map(existing.map(m => [m.id, m]));

            for (const mem of mappedMemories) {
                const prev = existingMap.get(mem.id);
                const toSave = prev ? { ...mem, isStarred: prev.isStarred, folderId: prev.folderId } : mem;
                await localDB.put('memories', toSave);
            }
        } catch (e) {
            console.error("Failed to sync memories", e);
        }

        // 3. Sync Action Items
        // Omi API returns: { id, description, completed (bool), created_at, updated_at, due_at, completed_at, conversation_id }
        let actionCount = 0;
        try {
            onProgress?.('Syncing action items...', 70);
            const data = await fetchAllPages('/user/action-items');

            if (data.length > 0) {
                console.log("[Omi Sync] First action item raw:", JSON.stringify(data[0], null, 2));
            }
            actionCount = data.length;
            console.log(`[Omi Sync] Total action items fetched: ${actionCount}`);

            const mappedActions: ActionItem[] = data.map((a: any) => {
                // completed can be boolean or check if completed_at exists
                const isCompleted = a.completed === true || (a.completed_at != null && a.completed_at !== '');

                return {
                    id: a.id,
                    description: a.description || "Action Item",
                    completed: isCompleted,
                    createdAt: a.created_at || new Date().toISOString(),
                    updatedAt: a.updated_at || a.completed_at || new Date().toISOString(),
                    dueDate: a.due_at,
                    conversationId: a.conversation_id
                };
            });

            // Preserve local changes - only add items that don't exist locally
            const existing = await localDB.getAll<ActionItem>('action_items');
            const existingMap = new Map(existing.map(a => [a.id, a]));

            for (const item of mappedActions) {
                const prev = existingMap.get(item.id);
                if (prev) {
                    // Item already exists locally - preserve ALL local changes
                    // Only update conversationId if not set locally
                    const toSave = {
                        ...prev,
                        conversationId: prev.conversationId || item.conversationId,
                    };
                    await localDB.put('action_items', toSave);
                } else {
                    // New item from API - add it
                    await localDB.put('action_items', item);
                }
            }
        } catch (e) {
            console.error("Failed to sync action items", e);
        }

        onProgress?.('Sync complete!', 100);
        return { conversations: convCount, memories: memCount, actionItems: actionCount };
    },

    // Legacy sync alias
    syncWithLimitless: async (token: string) => {
        return ApiService.syncWithOmi(token);
    },

    syncLifelogs: async (token: string, date: string, timezone: string, force = false) => {
        await ApiService.syncWithOmi(token);
    },

    isDateSynced: async (date: string) => true,
    markDateAsSynced: async (date: string) => { },

    moveLifelogsToFolder: async (ids: string[], folderId: string | null) => {
        const items = await localDB.getAll<Memory>('memories');
        const toUpdate = items.filter(m => ids.includes(m.id)).map(m => ({ ...m, folderId: folderId || undefined }));
        for (const m of toUpdate) {
            await localDB.put('memories', m);
        }
    },

    deleteLifelogs: async (ids: string[]) => {
        await localDB.bulkDelete('memories', ids);
    },

    toggleLifelogStar: async (id: string) => {
        const item = await localDB.get<Memory>('memories', id);
        if (item) {
            await localDB.put('memories', { ...item, isStarred: !item.isStarred });
        }
    },

    updateLifelog: async (id: string, updates: Partial<Memory>) => {
        const item = await localDB.get<Memory>('memories', id);
        if (item) {
            await localDB.put('memories', { ...item, ...updates });
        }
    },

    generateDummyData: async () => {
        const chats: Chat[] = Array.from({ length: 5 }).map((_, i) => ({
            id: uuidv4(),
            title: `Demo Conversation ${i + 1}`,
            summary: "This is a demo conversation generated locally.",
            previewText: "Demo preview...",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: ['demo'],
            isFavorite: false,
            status: ChatStatus.ACTIVE,
            participants: ['User', 'Omi'],
            unreadCount: 0,
            messages: [
                { id: '1', role: 'user', content: 'Hello, this is a demo message.', timestamp: new Date().toISOString() },
                { id: '2', role: 'assistant', content: 'Hi! This is a demo response from Omi.', timestamp: new Date().toISOString() }
            ]
        }));
        await localDB.bulkPut('chats', chats);

        const memories: Memory[] = Array.from({ length: 5 }).map((_, i) => ({
            id: uuidv4(),
            title: `Memory ${i + 1}`,
            content: `This is a demo memory ${i + 1}. Omi is great!`,
            category: 'interesting',
            visibility: 'private',
            tags: ['demo', 'omi'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isStarred: false
        }));
        await localDB.bulkPut('memories', memories);

        const actions: ActionItem[] = Array.from({ length: 5 }).map((_, i) => ({
            id: uuidv4(),
            description: `Follow up on demo item ${i + 1}`,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }));
        await localDB.bulkPut('action_items', actions);
    },

    // Clear all synced data (conversations, memories, action items, folders)
    clearAllData: async () => {
        console.log("[Omi] Clearing all data from local database...");
        await localDB.clear('chats');
        await localDB.clear('memories');
        await localDB.clear('action_items');
        await localDB.clear('folders');
        console.log("[Omi] All data cleared successfully.");
    },

    // --- Export Functions ---

    // Get all data for export
    getAllDataForExport: async () => {
        const [chats, memories, actionItems, folders] = await Promise.all([
            localDB.getAll<Chat>('chats'),
            localDB.getAll<Memory>('memories'),
            localDB.getAll<ActionItem>('action_items'),
            localDB.getAll<Folder>('folders')
        ]);

        return {
            exportDate: new Date().toISOString(),
            version: '1.0',
            data: {
                conversations: chats || [],
                memories: memories || [],
                actionItems: actionItems || [],
                folders: folders || []
            },
            stats: {
                totalConversations: chats?.length || 0,
                totalMemories: memories?.length || 0,
                totalActionItems: actionItems?.length || 0,
                totalFolders: folders?.length || 0
            }
        };
    },

    // Export as JSON
    exportAsJSON: async (): Promise<string> => {
        const exportData = await ApiService.getAllDataForExport();
        return JSON.stringify(exportData, null, 2);
    },

    // Export as Markdown
    exportAsMarkdown: async (): Promise<string> => {
        const { data, stats, exportDate } = await ApiService.getAllDataForExport();

        let md = `# Omi Data Export\n\n`;
        md += `**Exported:** ${new Date(exportDate).toLocaleString()}\n\n`;
        md += `## Summary\n\n`;
        md += `- **Conversations:** ${stats.totalConversations}\n`;
        md += `- **Memories:** ${stats.totalMemories}\n`;
        md += `- **Action Items:** ${stats.totalActionItems}\n`;
        md += `- **Folders:** ${stats.totalFolders}\n\n`;
        md += `---\n\n`;

        // Folders
        if (data.folders.length > 0) {
            md += `## Folders\n\n`;
            for (const folder of data.folders) {
                md += `- **${folder.name}** (${folder.type || 'chat'})\n`;
            }
            md += `\n---\n\n`;
        }

        // Conversations
        if (data.conversations.length > 0) {
            md += `## Conversations\n\n`;
            const sortedConvs = [...data.conversations].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            for (const chat of sortedConvs) {
                const date = new Date(chat.createdAt).toLocaleDateString();
                md += `### ${chat.title}\n\n`;
                md += `**Date:** ${date}`;
                if (chat.tags && chat.tags.length > 0) {
                    md += ` | **Tags:** ${chat.tags.join(', ')}`;
                }
                if (chat.isFavorite) {
                    md += ` | ⭐ Favorite`;
                }
                md += `\n\n`;

                if (chat.summary) {
                    md += `> ${chat.summary}\n\n`;
                }

                // Include messages/transcript
                if (chat.messages && chat.messages.length > 0) {
                    md += `#### Transcript\n\n`;
                    for (const msg of chat.messages) {
                        const speaker = msg.role === 'user' ? '**You:**' : '**Omi:**';
                        md += `${speaker} ${msg.content}\n\n`;
                    }
                }
                md += `---\n\n`;
            }
        }

        // Memories
        if (data.memories.length > 0) {
            md += `## Memories\n\n`;
            const sortedMems = [...data.memories].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            for (const memory of sortedMems) {
                const date = new Date(memory.createdAt).toLocaleDateString();
                md += `### ${memory.title || 'Untitled Memory'}\n\n`;
                md += `**Date:** ${date}`;
                if (memory.category) {
                    md += ` | **Category:** ${memory.category}`;
                }
                if (memory.tags && memory.tags.length > 0) {
                    md += ` | **Tags:** ${memory.tags.join(', ')}`;
                }
                if (memory.isStarred) {
                    md += ` | ⭐ Starred`;
                }
                md += `\n\n`;
                md += `${memory.content}\n\n`;
                md += `---\n\n`;
            }
        }

        // Action Items
        if (data.actionItems.length > 0) {
            md += `## Action Items\n\n`;

            const pending = data.actionItems.filter(a => !a.completed);
            const completed = data.actionItems.filter(a => a.completed);

            if (pending.length > 0) {
                md += `### Pending Tasks\n\n`;
                for (const item of pending) {
                    const due = item.dueDate ? ` (Due: ${new Date(item.dueDate).toLocaleDateString()})` : '';
                    md += `- [ ] ${item.description}${due}\n`;
                    if (item.details) {
                        md += `  - ${item.details}\n`;
                    }
                }
                md += `\n`;
            }

            if (completed.length > 0) {
                md += `### Completed Tasks\n\n`;
                for (const item of completed) {
                    md += `- [x] ${item.description}\n`;
                    if (item.details) {
                        md += `  - ${item.details}\n`;
                    }
                }
                md += `\n`;
            }
        }

        return md;
    },

    // Download helper
    downloadFile: (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
