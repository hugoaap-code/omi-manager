import React, { useState } from 'react';
import { Icons } from './Icons';
import { LifelogCard } from './LifelogCard';
import { MoveToFolderModal } from './FolderModals';
import { Lifelog, Folder } from '../types';
import { ApiService } from '../services/api';

interface LifelogSearchPageProps {
    userToken: string | undefined;
    timezone?: string;
    onOpenSidebar: () => void;
    folders: Folder[];
}

export const LifelogSearchPage: React.FC<LifelogSearchPageProps> = ({ userToken, timezone, onOpenSidebar, folders }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [lifelogs, setLifelogs] = useState<Lifelog[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedLifelogIds, setSelectedLifelogIds] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [lifelogToMove, setLifelogToMove] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!userToken) {
            alert("Please add your Limitless API Token in settings first.");
            return;
        }

        if (!searchQuery.trim()) {
            alert("Please enter a search query.");
            return;
        }

        setIsSearching(true);
        setHasSearched(true);
        try {
            const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            const results = await ApiService.searchLifelogs(userToken, searchQuery, tz);

            // Load existing lifelogs from database to check for favorites/folders
            const existingLifelogs = await ApiService.getLifelogs('', '', tz);
            const existingMap = new Map(existingLifelogs.map(l => [l.id, l]));

            // Merge with existing data (preserve isStarred, folderId, tags)
            const mergedResults = results.map(result => {
                const existing = existingMap.get(result.id);
                return existing ? {
                    ...result,
                    isStarred: existing.isStarred,
                    folderId: existing.folderId || null,
                    tags: (existing.tags && existing.tags.length > 0) ? existing.tags : (result.tags || [])
                } : result;
            });

            // Save new lifelogs to database
            await ApiService.saveLifelogsToDatabase(mergedResults);

            setLifelogs(mergedResults);
        } catch (error) {
            console.error("Search failed", error);
            alert("Failed to search lifelogs. Check console for details.");
        } finally {
            setIsSearching(false);
        }
    };

    const toggleSelection = (lifelogId: string) => {
        const newSelection = new Set(selectedLifelogIds);
        if (newSelection.has(lifelogId)) {
            newSelection.delete(lifelogId);
        } else {
            newSelection.add(lifelogId);
        }
        setSelectedLifelogIds(newSelection);
    };

    const handleBulkMoveToFolder = async (folderId: string | null) => {
        try {
            await ApiService.moveLifelogsToFolder(Array.from(selectedLifelogIds), folderId);
            setSelectedLifelogIds(new Set());
            setSelectionMode(false);
        } catch (error) {
            console.error("Failed to move lifelogs", error);
            alert("Failed to move lifelogs");
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedLifelogIds.size} lifelog(s)?`)) return;

        try {
            await ApiService.deleteLifelogs(Array.from(selectedLifelogIds));
            setSelectedLifelogIds(new Set());
            setSelectionMode(false);
            // Remove deleted items from current results
            setLifelogs(prev => prev.filter(l => !selectedLifelogIds.has(l.id)));
        } catch (error) {
            console.error("Failed to delete lifelogs", error);
            alert("Failed to delete lifelogs");
        }
    };

    const handleToggleStar = async (lifelogId: string) => {
        console.log('[LifelogSearch] handleToggleStar called for:', lifelogId);
        try {
            await ApiService.toggleLifelogStar(lifelogId);
            console.log('[LifelogSearch] toggleLifelogStar API call successful');
            // Update local state
            setLifelogs(prev => prev.map(l =>
                l.id === lifelogId ? { ...l, isStarred: !l.isStarred } : l
            ));
            console.log('[LifelogSearch] Local state updated');
        } catch (error) {
            console.error("[LifelogSearch] Failed to toggle star:", error);
            alert(`Failed to toggle star: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleMoveToFolder = (lifelogId: string) => {
        console.log('[LifelogSearch] handleMoveToFolder called for:', lifelogId);
        setLifelogToMove(lifelogId);
        setShowMoveModal(true);
    };

    const handleSelectFolder = async (folderId: string | undefined) => {
        if (!lifelogToMove) return;

        try {
            console.log('[LifelogSearch] Moving to folder:', folderId || 'none');
            await ApiService.moveLifelogsToFolder([lifelogToMove], folderId || null);
            console.log('[LifelogSearch] moveLifelogsToFolder API call successful');
            // Update local state
            setLifelogs(prev => prev.map(l =>
                l.id === lifelogToMove ? { ...l, folderId: folderId } : l
            ));
            console.log('[LifelogSearch] Local state updated');
            setShowMoveModal(false);
            setLifelogToMove(null);
        } catch (error) {
            console.error("[LifelogSearch] Failed to move lifelog:", error);
            alert(`Failed to move lifelog: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleEditTags = async (lifelogId: string) => {
        console.log('[LifelogSearch] handleEditTags called for:', lifelogId);
        const lifelog = lifelogs.find(l => l.id === lifelogId);
        if (!lifelog) {
            console.error('[LifelogSearch] Lifelog not found:', lifelogId);
            return;
        }

        const newTagsStr = prompt("Edit tags (comma separated):", lifelog.tags.join(", "));
        if (newTagsStr !== null) {
            const newTags = newTagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
            try {
                console.log('[LifelogSearch] Updating tags to:', newTags);
                await ApiService.updateLifelog(lifelogId, { tags: newTags });
                console.log('[LifelogSearch] updateLifelog API call successful');
                // Update local state
                setLifelogs(prev => prev.map(l =>
                    l.id === lifelogId ? { ...l, tags: newTags } : l
                ));
                console.log('[LifelogSearch] Local state updated');
            } catch (error) {
                console.error("[LifelogSearch] Failed to update tags:", error);
                alert(`Failed to update tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex-none px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between backdrop-blur-md bg-transparent z-20 gap-4 border-b border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button
                        className="md:hidden p-2 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-lg"
                        onClick={onOpenSidebar}
                    >
                        <Icons.Menu className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Lifelogs</h1>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full max-w-sm group">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search lifelogs by text..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full bg-white/60 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    {/* Selection Mode Toggle */}
                    {!selectionMode && selectedLifelogIds.size === 0 && lifelogs.length > 0 && (
                        <button
                            onClick={() => setSelectionMode(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 transition-colors text-sm font-medium"
                        >
                            <Icons.CheckCircle className="w-4 h-4" />
                            Select
                        </button>
                    )}

                    {/* Bulk Actions Toolbar */}
                    {(selectionMode || selectedLifelogIds.size > 0) && (
                        <div className="flex items-center gap-2 flex-wrap px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-900/20">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {selectedLifelogIds.size} selected
                            </span>

                            {selectedLifelogIds.size > 0 && (
                                <>
                                    <div className="w-px h-4 bg-blue-300 dark:bg-blue-600" />

                                    <button
                                        onClick={() => {
                                            const folderId = prompt("Enter folder ID (or leave empty for no folder):");
                                            if (folderId !== null) {
                                                handleBulkMoveToFolder(folderId || null);
                                            }
                                        }}
                                        className="text-xs px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300"
                                    >
                                        Move to Folder
                                    </button>

                                    <button
                                        onClick={handleBulkDelete}
                                        className="text-xs px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}

                            <div className="w-px h-4 bg-blue-300 dark:bg-blue-600" />

                            <button
                                onClick={() => {
                                    setSelectionMode(false);
                                    setSelectedLifelogIds(new Set());
                                }}
                                className="text-xs px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Icons.Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                        {isSearching ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {!hasSearched ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-white/30 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-white/50 dark:bg-white/5">
                        <Icons.Search className="w-12 h-12 mb-3 opacity-20" />
                        <p>Enter a search query to find lifelogs</p>
                    </div>
                ) : isSearching ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-white/30">
                        <div className="w-8 h-8 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
                        <p>Searching lifelogs...</p>
                    </div>
                ) : lifelogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-white/30 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-white/50 dark:bg-white/5">
                        <Icons.Sparkles className="w-12 h-12 mb-3 opacity-20" />
                        <p>No lifelogs found for "{searchQuery}"</p>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            Found {lifelogs.length} result{lifelogs.length !== 1 ? 's' : ''} for "{searchQuery}"
                        </div>
                        <div className="max-w-3xl mx-auto w-full px-4 md:px-0">
                            {lifelogs.map(log => (
                                <LifelogCard
                                    key={log.id}
                                    lifelog={log}
                                    isSelected={selectedLifelogIds.has(log.id)}
                                    selectionMode={selectionMode}
                                    onToggleSelection={toggleSelection}
                                    onToggleStar={handleToggleStar}
                                    onMoveToFolder={handleMoveToFolder}
                                    onEditTags={handleEditTags}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Move to Folder Modal */}
            {showMoveModal && (
                <MoveToFolderModal
                    folders={folders}
                    onClose={() => {
                        setShowMoveModal(false);
                        setLifelogToMove(null);
                    }}
                    onSelect={handleSelectFolder}
                />
            )}
        </div>
    );
};
