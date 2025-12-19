
import React, { useState, useMemo, useCallback } from 'react';
import { Chat, ChatStatus, Folder, ChatFilterType } from '../types';
import { Icons } from './Icons';
import { ChatCard } from './ChatCard';
import { MoveToFolderModal } from './FolderModals';

interface ConversationsPageProps {
    chats: Chat[];
    folders: Folder[];
    activeFilter?: ChatFilterType;
    activeFolderId?: string;
    onOpenChat: (chat: Chat) => void;
    onOpenSidebar: () => void;
    onToggleFavorite: (id: string, current: boolean) => void;
    onMoveToFolder: (chatId: string) => void;
    onArchive: (chatId: string) => void;
    onUpdateChat?: (id: string, updates: Partial<Chat>) => void;
    onRefresh?: () => void;
}

export const ConversationsPage: React.FC<ConversationsPageProps> = ({
    chats,
    folders,
    activeFilter = 'all',
    activeFolderId,
    onOpenChat,
    onOpenSidebar,
    onToggleFavorite,
    onMoveToFolder,
    onArchive,
    onUpdateChat,
    onRefresh
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedTag, setSelectedTag] = useState<string>('');

    // Selection state for bulk actions
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);

    // Get all unique tags from chats
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        chats.forEach(c => {
            if (c.tags) {
                c.tags.forEach(t => tagSet.add(t));
            }
        });
        return Array.from(tagSet).sort();
    }, [chats]);

    // Filter and sort chats
    const filteredChats = useMemo(() => {
        let result = [...chats];

        // Apply status filter based on activeFilter
        if (activeFilter === 'archived') {
            result = result.filter(c => c.status === ChatStatus.ARCHIVED);
        } else {
            result = result.filter(c => c.status === ChatStatus.ACTIVE);
        }

        // Apply favorites filter
        if (activeFilter === 'favorites') {
            result = result.filter(c => c.isFavorite);
        }

        // Apply folder filter
        if (activeFilter === 'folder' && activeFolderId) {
            result = result.filter(c => c.folderId === activeFolderId);
        }

        // Apply tag filter
        if (selectedTag) {
            result = result.filter(c => c.tags && c.tags.includes(selectedTag));
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.title.toLowerCase().includes(q) ||
                c.summary.toLowerCase().includes(q) ||
                c.tags.some(t => t.toLowerCase().includes(q))
            );
        }

        // Apply date range filter
        if (startDate || endDate) {
            result = result.filter(c => {
                if (!c.createdAt) return false;
                const chatDate = new Date(c.createdAt).toISOString().split('T')[0];

                if (startDate && chatDate < startDate) return false;
                if (endDate && chatDate > endDate) return false;

                return true;
            });
        }

        // Apply sort
        result.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
        });

        return result;
    }, [chats, activeFilter, activeFolderId, searchQuery, startDate, endDate, selectedTag, sortOrder]);

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedTag('');
        setSearchQuery('');
    };

    // Selection handlers
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
                // Ensure selection mode is active when adding items
                setIsSelectionMode(true);
            }
            if (newSet.size === 0) {
                setIsSelectionMode(false);
            }
            return newSet;
        });
    }, []);

    const selectAll = () => {
        setSelectedIds(new Set(filteredChats.map(c => c.id)));
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    };

    // Bulk actions
    const handleBulkFavorite = async () => {
        for (const id of selectedIds) {
            const chat = chats.find(c => c.id === id);
            if (chat) {
                onToggleFavorite(id, chat.isFavorite);
            }
        }
        clearSelection();
    };

    const handleBulkArchive = async () => {
        for (const id of selectedIds) {
            onArchive(id);
        }
        clearSelection();
    };

    const handleBulkUnarchive = async () => {
        for (const id of selectedIds) {
            if (onUpdateChat) {
                onUpdateChat(id, { status: ChatStatus.ACTIVE });
            }
        }
        clearSelection();
        onRefresh?.();
    };

    const handleBulkMove = () => {
        setShowMoveModal(true);
    };

    const handleMoveConfirm = async (folderId: string | undefined) => {
        setShowMoveModal(false);
        for (const id of selectedIds) {
            if (onUpdateChat) {
                onUpdateChat(id, { folderId: folderId || null });
            }
        }
        clearSelection();
        onRefresh?.();
    };

    const handleBulkApplyTag = async () => {
        const tag = prompt("Enter tag to apply to selected conversations:");
        if (tag && tag.trim() && onUpdateChat) {
            for (const id of selectedIds) {
                const chat = chats.find(c => c.id === id);
                if (chat) {
                    const newTags = [...new Set([...(chat.tags || []), tag.trim()])];
                    onUpdateChat(id, { tags: newTags });
                }
            }
            clearSelection();
            onRefresh?.();
        }
    };

    const handleEditTags = async (chatId: string) => {
        const chat = chats.find(c => c.id === chatId);
        if (!chat || !onUpdateChat) return;

        const currentTags = chat.tags || [];
        const newTagsStr = prompt("Edit tags (comma separated):", currentTags.join(", "));

        if (newTagsStr !== null) {
            const newTags = newTagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
            onUpdateChat(chatId, { tags: newTags });
            onRefresh?.();
        }
    };

    const handleCardClick = useCallback((chat: Chat) => {
        if (isSelectionMode) {
            toggleSelect(chat.id);
        } else {
            onOpenChat(chat);
        }
    }, [isSelectionMode, toggleSelect, onOpenChat]);

    const [visibleCount, setVisibleCount] = useState(20);
    const observerTarget = React.useRef<HTMLDivElement>(null);

    // Reset visible count when filters change
    React.useEffect(() => {
        setVisibleCount(20);
        const scrollContainer = document.querySelector('.overflow-y-auto');
        if (scrollContainer) scrollContainer.scrollTop = 0;
    }, [searchQuery, startDate, endDate, selectedTag, sortOrder, chats.length]);

    // Infinite scroll observer
    React.useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((prev) => prev + 20);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [filteredChats.length]);

    const visibleChats = filteredChats.slice(0, visibleCount);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-none px-4 md:px-6 py-4 flex flex-col gap-4 backdrop-blur-md bg-transparent z-20 border-b border-gray-200 dark:border-white/5">
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden p-2 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-lg"
                            onClick={onOpenSidebar}
                        >
                            <Icons.Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                            Conversations
                        </h1>
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200 dark:border-white/10 ml-auto md:ml-0">
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 text-[10px] uppercase font-bold tracking-wider pointer-events-none">From</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-10 pr-2 py-1.5 bg-transparent text-xs md:text-sm font-medium text-gray-900 dark:text-white border border-transparent hover:bg-white dark:hover:bg-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer w-[120px] md:w-auto"
                                />
                            </div>
                            <span className="text-gray-400 dark:text-white/30">-</span>
                            <div className="relative group">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 text-[10px] uppercase font-bold tracking-wider pointer-events-none">To</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-8 pr-2 py-1.5 bg-transparent text-xs md:text-sm font-medium text-gray-900 dark:text-white border border-transparent hover:bg-white dark:hover:bg-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all cursor-pointer w-[110px] md:w-auto"
                                />
                            </div>
                        </div>

                        {(startDate || endDate) && (
                            <>
                                <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/10 mx-1" />
                                <button
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-red-500 transition-all"
                                    title="Clear date filter"
                                >
                                    <Icons.Close className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
                    {/* Search */}
                    <div className="relative flex-1 group">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/60 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap pb-1 md:pb-0 no-scrollbar">
                        {/* Tag Filter */}
                        <select
                            value={selectedTag}
                            onChange={(e) => setSelectedTag(e.target.value)}
                            className="px-3 py-2 rounded-xl border bg-white/60 dark:bg-gray-900/50 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                            <option value="">All Tags</option>
                            {allTags.map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>

                        {/* Sort Order Toggle */}
                        <button
                            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white/60 dark:bg-gray-900/50 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 transition-colors whitespace-nowrap flex-shrink-0"
                            title={sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
                        >
                            {sortOrder === 'newest' ? (
                                <>
                                    <Icons.ChevronDown className="w-4 h-4" />
                                    <span className="hidden md:inline text-xs font-medium">Newest</span>
                                </>
                            ) : (
                                <>
                                    <Icons.ChevronDown className="w-4 h-4 rotate-180" />
                                    <span className="hidden md:inline text-xs font-medium">Oldest</span>
                                </>
                            )}
                        </button>

                        {/* Selection Mode Toggle */}
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (isSelectionMode) clearSelection();
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors whitespace-nowrap flex-shrink-0 ${isSelectionMode
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white/60 dark:bg-gray-900/50 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                                }`}
                        >
                            <Icons.CheckSquare className="w-4 h-4" />
                            <span className="hidden md:inline text-xs font-medium">Select</span>
                        </button>

                        {/* Results count */}
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-white/50">
                            {filteredChats.length} conversation{filteredChats.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {isSelectionMode && selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-500/30 animate-in slide-in-from-top-2">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300 mr-2">
                            {selectedIds.size} selected
                        </span>
                        <button onClick={selectAll} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-500/30">
                            Select All
                        </button>
                        <button onClick={handleBulkFavorite} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 flex items-center gap-1">
                            <Icons.Star className="w-3 h-3" /> Star
                        </button>
                        <button onClick={handleBulkMove} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-500/30 flex items-center gap-1">
                            <Icons.Folder className="w-3 h-3" /> Move
                        </button>
                        <button onClick={handleBulkApplyTag} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-500/30 flex items-center gap-1">
                            <Icons.Tag className="w-3 h-3" /> Tag
                        </button>
                        {activeFilter === 'archived' ? (
                            <button onClick={handleBulkUnarchive} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500/30 flex items-center gap-1">
                                <Icons.Archive className="w-3 h-3" /> Unarchive
                            </button>
                        ) : (
                            <button onClick={handleBulkArchive} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30 flex items-center gap-1">
                                <Icons.Archive className="w-3 h-3" /> Archive
                            </button>
                        )}
                        <button onClick={clearSelection} className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 pt-4">
                {filteredChats.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-white/30">
                        <Icons.MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                        <p>No conversations found</p>
                        {(startDate || endDate || selectedTag || searchQuery) && (
                            <button
                                onClick={clearFilters}
                                className="mt-2 text-sm text-blue-500 hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {visibleChats.map(chat => (
                                <ChatCard
                                    key={chat.id}
                                    chat={chat}
                                    folders={folders}
                                    onClick={() => handleCardClick(chat)}
                                    isSelected={selectedIds.has(chat.id)}
                                    onToggleSelect={toggleSelect}
                                    onToggleFavorite={onToggleFavorite}
                                    onMoveToFolder={() => onMoveToFolder(chat.id)}
                                    onArchive={() => onArchive(chat.id)}
                                    onEditTags={() => handleEditTags(chat.id)}
                                />
                            ))}
                        </div>

                        {/* Sentinel for infinite scroll */}
                        {visibleCount < filteredChats.length && (
                            <div ref={observerTarget} className="py-8 flex justify-center w-full">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </>
                )}
            </div>

            {showMoveModal && (
                <MoveToFolderModal
                    folders={folders}
                    onClose={() => setShowMoveModal(false)}
                    onSelect={handleMoveConfirm}
                />
            )}
        </div>
    );
};
