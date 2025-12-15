
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Memory, Folder, ChatFilterType } from '../types';
import { Icons } from './Icons';
import { MemoryCard } from './MemoryCard';
import { ApiService } from '../services/api';
import { MoveToFolderModal } from './FolderModals';

interface MemoriesPageProps {
    memories: Memory[];
    folders: Folder[];
    activeFilter?: ChatFilterType;
    activeFolderId?: string;
    onOpenSidebar: () => void;
    onOpenMemory?: (memory: Memory) => void;
    onRefresh?: () => void;
}

export const MemoriesPage: React.FC<MemoriesPageProps> = ({
    memories,
    folders,
    activeFilter = 'all',
    activeFolderId,
    onOpenSidebar,
    onOpenMemory,
    onRefresh
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Modal
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [memoryToMove, setMemoryToMove] = useState<string | null>(null);

    const dateInputRef = React.useRef<HTMLInputElement>(null);

    // Filter and sort memories
    const filteredMemories = useMemo(() => {
        let result = [...memories];

        // Apply favorites filter
        if (activeFilter === 'favorites') {
            result = result.filter(m => m.isStarred);
        }

        // Apply folder filter
        if (activeFilter === 'folder' && activeFolderId) {
            result = result.filter(m => m.folderId === activeFolderId);
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
    }, [memories, activeFilter, activeFolderId, searchQuery, selectedDate, sortOrder]);

    const clearDateFilter = () => {
        setSelectedDate('');
    };

    const handleToggleStar = async (memoryId: string) => {
        try {
            await ApiService.toggleLifelogStar(memoryId);
            onRefresh?.();
        } catch (error) {
            console.error("Failed to toggle star", error);
        }
    };

    const initiateMove = (memoryId: string) => {
        setMemoryToMove(memoryId);
        setShowMoveModal(true);
    };

    const handleMoveConfirm = async (folderId: string | undefined) => {
        setShowMoveModal(false);
        if (memoryToMove) {
            try {
                await ApiService.moveLifelogsToFolder([memoryToMove], folderId || null);
                onRefresh?.();
            } catch (error) {
                console.error("Failed to move memory", error);
            }
        }
        setMemoryToMove(null);
    };

    const handleEditTags = async (memoryId: string) => {
        const mem = memories.find(m => m.id === memoryId);
        if (!mem) return;

        const currentTags = mem.tags || [];
        const newTagsStr = prompt("Edit tags (comma separated):", currentTags.join(", "));

        if (newTagsStr !== null) {
            const newTags = newTagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
            try {
                await ApiService.updateLifelog(memoryId, { tags: newTags });
                onRefresh?.();
            } catch (e) {
                console.error("Failed to update tags", e);
            }
        }
    };

    const handleOpenMemory = (memory: Memory) => {
        if (onOpenMemory) {
            onOpenMemory(memory);
        }
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
                            <>
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
                            </>
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
                                    onClick={clearDateFilter}
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

                        {/* Results count */}
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-white/50">
                            {filteredMemories.length} memor{filteredMemories.length !== 1 ? 'ies' : 'y'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Memory List */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 pt-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-white/30">
                        <div className="w-8 h-8 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
                        <p>Loading memories...</p>
                    </div>
                ) : filteredMemories.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-white/30">
                        <Icons.Brain className="w-12 h-12 mb-4 opacity-50" />
                        <p>No memories found</p>
                        {selectedDate && (
                            <button
                                onClick={clearDateFilter}
                                className="mt-2 text-sm text-blue-500 hover:underline"
                            >
                                Clear date filter
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
                                isSelected={false}
                                onToggleSelect={() => { }}
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
        </div>
    );
};
