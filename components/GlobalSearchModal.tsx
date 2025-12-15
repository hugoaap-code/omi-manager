import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chat, Memory, ActionItem } from '../types';
import { Icons } from './Icons';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    chats: Chat[];
    memories: Memory[];
    actionItems: ActionItem[];
    onOpenChat: (chat: Chat) => void;
    onNavigateToMemories: () => void;
    onNavigateToActionItems: () => void;
    onNavigateToConversations: () => void;
}

const INITIAL_ITEMS = 3;
const LOAD_MORE_ITEMS = 6;

type ExpandedSection = 'conversations' | 'memories' | 'tasks' | null;

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
    isOpen,
    onClose,
    chats,
    memories,
    actionItems,
    onOpenChat,
    onNavigateToMemories,
    onNavigateToActionItems,
    onNavigateToConversations
}) => {
    const [query, setQuery] = useState('');
    const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null);
    const [visibleCounts, setVisibleCounts] = useState({
        conversations: INITIAL_ITEMS,
        memories: INITIAL_ITEMS,
        tasks: INITIAL_ITEMS
    });
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setExpandedSection(null);
            setVisibleCounts({
                conversations: INITIAL_ITEMS,
                memories: INITIAL_ITEMS,
                tasks: INITIAL_ITEMS
            });
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (expandedSection) {
                    setExpandedSection(null);
                } else {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose, expandedSection]);

    // Filter results
    const filteredChats = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return chats.filter(c =>
            c.title.toLowerCase().includes(q) ||
            c.summary.toLowerCase().includes(q) ||
            c.tags.some(t => t.toLowerCase().includes(q))
        );
    }, [chats, query]);

    const filteredMemories = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return memories.filter(m =>
            (m.title || '').toLowerCase().includes(q) ||
            (m.content || '').toLowerCase().includes(q) ||
            (m.tags || []).some(t => t.toLowerCase().includes(q))
        );
    }, [memories, query]);

    const filteredActionItems = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return actionItems.filter(a =>
            a.description.toLowerCase().includes(q) ||
            (a.details || '').toLowerCase().includes(q) ||
            (a.tags || []).some(t => t.toLowerCase().includes(q))
        );
    }, [actionItems, query]);

    const hasResults = filteredChats.length > 0 || filteredMemories.length > 0 || filteredActionItems.length > 0;
    const isSearching = query.trim().length > 0;

    const handleLoadMore = (section: 'conversations' | 'memories' | 'tasks') => {
        setVisibleCounts(prev => ({
            ...prev,
            [section]: prev[section] + LOAD_MORE_ITEMS
        }));
    };

    const handleExpandSection = (section: ExpandedSection) => {
        setExpandedSection(section);
        if (section) {
            // When expanding, show all items
            setVisibleCounts(prev => ({
                ...prev,
                [section]: 999
            }));
        }
    };

    const handleBackToAll = () => {
        setExpandedSection(null);
        setVisibleCounts({
            conversations: INITIAL_ITEMS,
            memories: INITIAL_ITEMS,
            tasks: INITIAL_ITEMS
        });
    };

    if (!isOpen) return null;

    // Render a single expanded section
    const renderExpandedSection = () => {
        if (expandedSection === 'conversations') {
            return (
                <div className="space-y-2">
                    {filteredChats.map(chat => (
                        <button
                            key={chat.id}
                            onClick={() => { onOpenChat(chat); onClose(); }}
                            className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {chat.title}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-white/50 line-clamp-1 mt-0.5">
                                        {chat.summary || chat.previewText}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-white/30 whitespace-nowrap">
                                    {new Date(chat.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            );
        }

        if (expandedSection === 'memories') {
            return (
                <div className="space-y-2">
                    {filteredMemories.map(memory => (
                        <button
                            key={memory.id}
                            onClick={() => { onNavigateToMemories(); onClose(); }}
                            className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                        {memory.title || 'Untitled Memory'}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-white/50 line-clamp-1 mt-0.5">
                                        {memory.content.replace(/[#*`]/g, '').slice(0, 100)}
                                    </p>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-white/30 whitespace-nowrap">
                                    {new Date(memory.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            );
        }

        if (expandedSection === 'tasks') {
            return (
                <div className="space-y-2">
                    {filteredActionItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => { onNavigateToActionItems(); onClose(); }}
                            className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-white/30'}`}>
                                    {item.completed && <Icons.Check className="w-3 h-3" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors ${item.completed ? 'text-gray-400 dark:text-white/40 line-through' : 'text-gray-900 dark:text-white'}`}>
                                        {item.description}
                                    </h4>
                                    {item.dueDate && (
                                        <p className="text-xs text-orange-500 mt-0.5 flex items-center gap-1">
                                            <Icons.Clock className="w-3 h-3" />
                                            Due: {new Date(item.dueDate).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#151519] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[75vh] flex flex-col">

                {/* Search Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-white/10">
                    {expandedSection && (
                        <button
                            onClick={handleBackToAll}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Icons.ChevronLeft className="w-5 h-5 text-gray-500 dark:text-white/50" />
                        </button>
                    )}
                    <Icons.Search className="w-5 h-5 text-gray-400 dark:text-white/40" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search conversations, memories, tasks..."
                        className="flex-1 bg-transparent text-gray-900 dark:text-white text-lg placeholder-gray-400 dark:placeholder-white/30 focus:outline-none"
                    />
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Icons.Close className="w-5 h-5 text-gray-500 dark:text-white/50" />
                    </button>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* Empty State */}
                    {!isSearching && (
                        <div className="text-center py-12 text-gray-400 dark:text-white/30">
                            <Icons.Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>Type to search across all your data</p>
                            <p className="text-sm mt-1 opacity-60">Conversations, memories, and tasks</p>
                        </div>
                    )}

                    {/* No Results */}
                    {isSearching && !hasResults && (
                        <div className="text-center py-12 text-gray-400 dark:text-white/30">
                            <Icons.Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No results found for "{query}"</p>
                            <p className="text-sm mt-1 opacity-60">Try a different search term</p>
                        </div>
                    )}

                    {/* Expanded Section View */}
                    {expandedSection && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-sm font-bold text-gray-700 dark:text-white/70 uppercase tracking-wider flex items-center gap-2">
                                    {expandedSection === 'conversations' && <><Icons.MessageSquare className="w-4 h-4" /> All Conversations ({filteredChats.length})</>}
                                    {expandedSection === 'memories' && <><Icons.Brain className="w-4 h-4" /> All Memories ({filteredMemories.length})</>}
                                    {expandedSection === 'tasks' && <><Icons.CheckSquare className="w-4 h-4" /> All Tasks ({filteredActionItems.length})</>}
                                </h3>
                            </div>
                            {renderExpandedSection()}
                        </div>
                    )}

                    {/* All Categories View */}
                    {!expandedSection && (
                        <>
                            {/* Conversations */}
                            {filteredChats.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.MessageSquare className="w-4 h-4" />
                                            Conversations ({filteredChats.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {filteredChats.slice(0, visibleCounts.conversations).map(chat => (
                                            <button
                                                key={chat.id}
                                                onClick={() => { onOpenChat(chat); onClose(); }}
                                                className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {chat.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 dark:text-white/50 line-clamp-1 mt-0.5">
                                                            {chat.summary || chat.previewText}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-400 dark:text-white/30 whitespace-nowrap">
                                                        {new Date(chat.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {filteredChats.length > visibleCounts.conversations && (
                                        <button
                                            onClick={() => handleExpandSection('conversations')}
                                            className="mt-3 w-full py-2 text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>View all {filteredChats.length} conversations</span>
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Memories */}
                            {filteredMemories.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.Brain className="w-4 h-4" />
                                            Memories ({filteredMemories.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {filteredMemories.slice(0, visibleCounts.memories).map(memory => (
                                            <button
                                                key={memory.id}
                                                onClick={() => { onNavigateToMemories(); onClose(); }}
                                                className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                            {memory.title || 'Untitled Memory'}
                                                        </h4>
                                                        <p className="text-sm text-gray-500 dark:text-white/50 line-clamp-1 mt-0.5">
                                                            {memory.content.replace(/[#*`]/g, '').slice(0, 100)}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-gray-400 dark:text-white/30 whitespace-nowrap">
                                                        {new Date(memory.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {filteredMemories.length > visibleCounts.memories && (
                                        <button
                                            onClick={() => handleExpandSection('memories')}
                                            className="mt-3 w-full py-2 text-sm text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>View all {filteredMemories.length} memories</span>
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Action Items */}
                            {filteredActionItems.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider flex items-center gap-2">
                                            <Icons.CheckSquare className="w-4 h-4" />
                                            Tasks ({filteredActionItems.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {filteredActionItems.slice(0, visibleCounts.tasks).map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => { onNavigateToActionItems(); onClose(); }}
                                                className="w-full text-left p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors group"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-white/30'}`}>
                                                        {item.completed && <Icons.Check className="w-3 h-3" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`font-medium truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors ${item.completed ? 'text-gray-400 dark:text-white/40 line-through' : 'text-gray-900 dark:text-white'}`}>
                                                            {item.description}
                                                        </h4>
                                                        {item.dueDate && (
                                                            <p className="text-xs text-orange-500 mt-0.5 flex items-center gap-1">
                                                                <Icons.Clock className="w-3 h-3" />
                                                                Due: {new Date(item.dueDate).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    {filteredActionItems.length > visibleCounts.tasks && (
                                        <button
                                            onClick={() => handleExpandSection('tasks')}
                                            className="mt-3 w-full py-2 text-sm text-green-500 dark:text-green-400 hover:text-green-600 dark:hover:text-green-300 font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>View all {filteredActionItems.length} tasks</span>
                                            <Icons.ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Hint */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 text-xs text-gray-400 dark:text-white/30 flex items-center justify-between">
                    <span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded text-[10px] font-mono mr-1">ESC</kbd>
                        {expandedSection ? 'to go back' : 'to close'}
                    </span>
                    <span className="flex items-center gap-2">
                        <Icons.Sparkles className="w-3 h-3" />
                        Global Search
                    </span>
                </div>
            </div>
        </div>
    );
};
