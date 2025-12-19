
import React, { useState, useMemo, useCallback } from 'react';
import { Memory, Folder, ChatFilterType } from '../types';
import { Icons } from './Icons';
import { MemoryCard } from './MemoryCard';
import { MemoryModal } from './MemoryModal';
import { ApiService } from '../services/api';
import { MoveToFolderModal } from './FolderModals';

interface MemoriesPageProps {
    memories: Memory[];
    folders: Folder[];
    activeFilter?: ChatFilterType;
    activeFolderId?: string;
    onOpenSidebar: () => void;
    onRefresh?: () => void;
}

export const MemoriesPage: React.FC<MemoriesPageProps> = ({
    memories,
    folders,
    activeFilter = 'all',
    activeFolderId,
    onOpenSidebar,
    onRefresh
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTag, setSelectedTag] = useState<string>('');

    // Selection state for bulk actions
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);

    // Modals
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [memoryToMove, setMemoryToMove] = useState<string | null>(null);
    const [viewingMemory, setViewingMemory] = useState<Memory | null>(null);

    const dateInputRef = React.useRef<HTMLInputElement>(null);

    // Get all unique tags from memories
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        memories.forEach(m => {
            if (m.tags) {
                m.tags.forEach(t => tagSet.add(t));
            }
        });
        return Array.from(tagSet).sort();
    }, [memories]);

    // Filter and sort memories
    const filteredMemories = useMemo(() => {
        let result = [...memories];

        // Apply archived filter
        if (activeFilter === 'archived') {
            result = result.filter(m => m.isArchived === true);
        } else if (activeFilter !== 'folder') {
            // Don't show archived in normal views
            result = result.filter(m => !m.isArchived);
        }

        // Apply favorites filter
        if (activeFilter === 'favorites') {
            result = result.filter(m => m.isStarred);
        }

        // Apply folder filter
        if (activeFilter === 'folder' && activeFolderId) {
            result = result.filter(m => m.folderId === activeFolderId);
        }

        // Apply tag filter
        if (selectedTag) {
            result = result.filter(m => m.tags && m.tags.includes(selectedTag));
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(m =>
                (m.title || '').toLowerCase().includes(q) ||
                (m.content || '').toLowerCase().includes(q) ||
                (m.tags || []).some(t => t.toLowerCase().includes(q))
            );
        }

        // Apply date filter
        if (selectedDate) {
            result = result.filter(m => {
                if (!m.createdAt) return false;
                const memDate = new Date(m.createdAt).toISOString().split('T')[0];
                return memDate === selectedDate;
            });
        }

        // Apply sort
        result.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
        });

        return result;
    }, [memories, activeFilter, activeFolderId, searchQuery, selectedDate, selectedTag, sortOrder]);

    const clearFilters = () => {
        setSelectedDate('');
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
        setSelectedIds(new Set(filteredMemories.map(m => m.id)));
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    };

    // Bulk actions
    const handleBulkStar = async () => {
        for (const id of selectedIds) {
            await ApiService.toggleLifelogStar(id);
        }
        clearSelection();
        onRefresh?.();
    };

    const handleBulkArchive = async () => {
        for (const id of selectedIds) {
            await ApiService.updateLifelog(id, { isArchived: true });
        }
        clearSelection();
        onRefresh?.();
    };

    const handleBulkUnarchive = async () => {
        for (const id of selectedIds) {
            await ApiService.updateLifelog(id, { isArchived: false });
        }
        clearSelection();
        onRefresh?.();
    };

    const handleBulkMove = () => {
        setMemoryToMove(null); // null means bulk move
        setShowMoveModal(true);
    };

    const handleBulkApplyTag = async () => {
        const tag = prompt("Enter tag to apply to selected memories:");
        if (tag && tag.trim()) {
            for (const id of selectedIds) {
                const mem = memories.find(m => m.id === id);
                if (mem) {
                    const newTags = [...new Set([...(mem.tags || []), tag.trim()])];
                    await ApiService.updateLifelog(id, { tags: newTags });
                }
            }
            clearSelection();
            onRefresh?.();
        }
    };

    // Single item actions
    const handleToggleStar = async (memoryId: string) => {
        await ApiService.toggleLifelogStar(memoryId);
        onRefresh?.();
    };

    const initiateMove = (memoryId: string) => {
        setMemoryToMove(memoryId);
        setShowMoveModal(true);
    };

    const handleMoveConfirm = async (folderId: string | undefined) => {
        setShowMoveModal(false);
        if (memoryToMove) {
            // Single move
            await ApiService.moveLifelogsToFolder([memoryToMove], folderId || null);
        } else {
            // Bulk move
            await ApiService.moveLifelogsToFolder(Array.from(selectedIds), folderId || null);
            clearSelection();
        }
        setMemoryToMove(null);
        onRefresh?.();
    };

    const handleEditTags = async (memoryId: string) => {
        const mem = memories.find(m => m.id === memoryId);
        if (!mem) return;

        const currentTags = mem.tags || [];
        const newTagsStr = prompt("Edit tags (comma separated):", currentTags.join(", "));

        if (newTagsStr !== null) {
            const newTags = newTagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
            await ApiService.updateLifelog(memoryId, { tags: newTags });
            onRefresh?.();
        }
    };

    const handleOpenMemory = useCallback((memory: Memory) => {
        if (isSelectionMode) {
            toggleSelect(memory.id);
        } else {
            setViewingMemory(memory);
        }
    }, [isSelectionMode, toggleSelect]);

    const handleCloseMemory = () => {
        setViewingMemory(null);
    };

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
                            Memories
                        </h1>
                    </div>

                    {/* Date Filter */}
                    <div className="flex items-center gap-1 md:gap-2 bg-white/60 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-200 dark:border-white/10 ml-auto md:ml-0">
                        {selectedDate && (
                            <button
                                onClick={() => {
                                    const date = new Date(selectedDate + 'T00:00:00');
                                    date.setDate(date.getDate() - 1);
                                    setSelectedDate(date.toISOString().split('T')[0]);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                <Icons.ChevronLeft className="w-4 h-4" />
                            </button>
                        )}

                        <div
                            className="relative group px-2 py-1 cursor-pointer text-center min-w-[100px]"
                            onClick={() => dateInputRef.current?.showPicker()}
                        >
                            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white select-none pointer-events-none block">
                                {selectedDate
                                    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'All Dates'
                                }
                            </span>
                            <input
                                ref={dateInputRef}
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                        </div>

                        {selectedDate && (
                            <>
                                <button
                                    onClick={() => {
                                        const date = new Date(selectedDate + 'T00:00:00');
                                        date.setDate(date.getDate() + 1);
                                        setSelectedDate(date.toISOString().split('T')[0]);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all"
                                >
                                    <Icons.ChevronRight className="w-4 h-4" />
                                </button>
                                <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/10 mx-1" />
                                <button
                                    onClick={() => setSelectedDate('')}
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
                            placeholder="Search memories..."
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
                            {filteredMemories.length} memor{filteredMemories.length !== 1 ? 'ies' : 'y'}
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
                        <button onClick={handleBulkStar} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-500/30 flex items-center gap-1">
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

            {/* Memory List */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 pt-4">
                {filteredMemories.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-white/30">
                        <Icons.Brain className="w-12 h-12 mb-4 opacity-50" />
                        <p>No memories found</p>
                        {(selectedDate || selectedTag || searchQuery) && (
                            <button
                                onClick={clearFilters}
                                className="mt-2 text-sm text-blue-500 hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredMemories.map(memory => (
                            <MemoryCard
                                key={memory.id}
                                memory={memory}
                                folders={folders}
                                onClick={handleOpenMemory}
                                isSelected={selectedIds.has(memory.id)}
                                onToggleSelect={toggleSelect}
                                onToggleStar={handleToggleStar}
                                onMoveToFolder={() => initiateMove(memory.id)}
                                onEditTags={handleEditTags}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showMoveModal && (
                <MoveToFolderModal
                    folders={folders}
                    onClose={() => setShowMoveModal(false)}
                    onSelect={handleMoveConfirm}
                />
            )}

            {viewingMemory && (
                <MemoryModal
                    memory={viewingMemory}
                    folders={folders}
                    onClose={handleCloseMemory}
                    onToggleStar={(id) => {
                        handleToggleStar(id);
                        setViewingMemory(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
                    }}
                    onMoveToFolder={(id) => {
                        initiateMove(id);
                    }}
                    onEditTags={(id) => {
                        handleEditTags(id);
                        handleCloseMemory();
                    }}
                />
            )}
        </div>
    );
};
