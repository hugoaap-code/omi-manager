import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lifelog, ChatFilterType, Folder } from '../types';
import { ApiService } from '../services/api';
import { LifelogCard } from './LifelogCard';
import { Icons } from './Icons';
import { MoveToFolderModal } from './FolderModals';

interface LifelogPageProps {
    userToken?: string;
    timezone?: string;
    activeFilter?: ChatFilterType;
    activeFolderId?: string;
    onOpenSidebar: () => void;
}

export const LifelogPage: React.FC<LifelogPageProps> = ({ userToken, timezone, activeFilter = 'all', activeFolderId, onOpenSidebar }) => {
    const [lifelogs, setLifelogs] = useState<Lifelog[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Initialize with local date (not UTC)
    const getLocalDateString = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLifelogIds, setSelectedLifelogIds] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [tagFilter, setTagFilter] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest'); // New: sort order state

    // Modals
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [lifelogToMove, setLifelogToMove] = useState<string | null>(null); // ID of single lifelog to move

    const inputRef = React.useRef<HTMLInputElement>(null);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Determine if we should filter by date
            const shouldUseDate = activeFilter === 'all' || activeFilter === undefined;
            const dateToUse = shouldUseDate ? selectedDate : null;

            const [logs, fetchedFolders] = await Promise.all([
                ApiService.getLifelogs(dateToUse, searchQuery, tz),
                ApiService.getFolders('lifelog')
            ]);

            let filtered = logs;

            // Apply client-side filters based on activeFilter
            if (activeFilter === 'favorites') {
                filtered = logs.filter(l => l.isStarred);
            } else if (activeFilter === 'folder' && activeFolderId) {
                filtered = logs.filter(l => l.folderId === activeFolderId);
            }

            setLifelogs(filtered);
            setFolders(fetchedFolders);
        } catch (error) {
            console.error("Failed to load lifelogs", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate, searchQuery, timezone, activeFilter, activeFolderId]);

    // Auto-sync when date changes (only in daily view)
    useEffect(() => {
        const syncAndLoad = async () => {
            if (activeFilter !== 'all' && activeFilter !== undefined) {
                loadData();
                return;
            }

            if (!userToken) {
                loadData(); // Just load local if no token
                return;
            }

            setIsSyncing(true);
            try {
                // Load local first to show something immediately (optimistic)
                await loadData();

                // Check if date is already synced
                const alreadySynced = await ApiService.isDateSynced(selectedDate);
                if (!alreadySynced) {
                    // Sync with remote
                    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
                    await ApiService.syncLifelogs(userToken, selectedDate, tz);

                    // Mark as synced
                    await ApiService.markDateAsSynced(selectedDate);

                    // Reload to get the synced data
                    await loadData();
                }
            } catch (error) {
                console.error("Auto-sync failed", error);
            } finally {
                setIsSyncing(false);
            }
        };

        syncAndLoad();
    }, [selectedDate, userToken, timezone, loadData, activeFilter]);

    const handleManualSync = async () => {
        if (!userToken) {
            alert("Please add your Limitless API Token in settings first.");
            return;
        }

        setIsSyncing(true);
        try {
            const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
            await ApiService.syncLifelogs(userToken, selectedDate, tz, true);
            await ApiService.markDateAsSynced(selectedDate);
            await loadData();
        } catch (error) {
            console.error("Sync failed", error);
            alert("Failed to sync lifelogs. Check console for details.");
        } finally {
            setIsSyncing(false);
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

    const initiateMove = (lifelogId?: string) => {
        if (lifelogId) {
            setLifelogToMove(lifelogId);
        } else {
            setLifelogToMove(null); // Bulk move
        }
        setShowMoveModal(true);
    };

    const handleMoveConfirm = async (folderId: string | undefined) => {
        setShowMoveModal(false);
        const idsToMove = lifelogToMove ? [lifelogToMove] : Array.from(selectedLifelogIds);

        try {
            await ApiService.moveLifelogsToFolder(idsToMove, folderId || null);
            if (!lifelogToMove) {
                setSelectedLifelogIds(new Set());
                setSelectionMode(false);
            }
            await loadData();
        } catch (error) {
            console.error("Failed to move lifelogs", error);
            alert("Failed to move lifelogs");
        }
        setLifelogToMove(null);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedLifelogIds.size} lifelog(s)?`)) return;

        try {
            await ApiService.deleteLifelogs(Array.from(selectedLifelogIds));
            setSelectedLifelogIds(new Set());
            setSelectionMode(false);
            await loadData();
        } catch (error) {
            console.error("Failed to delete lifelogs", error);
            alert("Failed to delete lifelogs");
        }
    };

    const handleToggleStar = async (lifelogId: string) => {
        try {
            await ApiService.toggleLifelogStar(lifelogId);
            await loadData();
        } catch (error) {
            console.error("Failed to toggle star", error);
        }
    };

    const handleEditTags = async (lifelogId: string) => {
        const log = lifelogs.find(l => l.id === lifelogId);
        if (!log) return;

        const currentTags = log.tags || [];
        const newTagsStr = prompt("Edit tags (comma separated):", currentTags.join(", "));

        if (newTagsStr !== null) {
            const newTags = newTagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
            // We need an API method to update tags. Assuming updateLifelog exists or we create it.
            // For now, let's assume we can update it locally/via a generic update method if it existed.
            // Since ApiService.updateLifelog doesn't exist yet, I'll need to add it.
            // For this step, I'll just log it or try to use a hypothetical method.
            // actually, I'll implement updateLifelog in ApiService in the next step.
            try {
                await ApiService.updateLifelog(lifelogId, { tags: newTags });
                await loadData();
            } catch (e) {
                console.error("Failed to update tags", e);
                alert("Failed to update tags");
            }
        }
    };

    const [selectedHour, setSelectedHour] = useState<number | null>(null);
    const [showHourFilter, setShowHourFilter] = useState(false);

    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        lifelogs.forEach(l => (l.tags || []).forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [lifelogs]);

    // Filter logs by hour and tag
    const filteredLifelogs = React.useMemo(() => {
        let result = lifelogs;

        if (tagFilter) {
            result = result.filter(l => (l.tags || []).includes(tagFilter));
        }

        if (selectedHour !== null) {
            result = result.filter(log => {
                try {
                    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const date = new Date(log.createdAt);
                    const hourStr = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: tz });
                    const hour = parseInt(hourStr, 10);
                    return hour === selectedHour;
                } catch (e) {
                    console.error("Error parsing hour", e);
                    return false;
                }
            });
        }

        // Apply sort order
        result.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
        });

        return result;
    }, [lifelogs, selectedHour, timezone, tagFilter, sortOrder]);

    const isDailyView = activeFilter === 'all' || activeFilter === undefined;

    return (
        <div className="flex flex-col h-full" onClick={() => showHourFilter && setShowHourFilter(false)}>
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
                            {activeFilter === 'favorites' ? 'Favorites' :
                                activeFilter === 'folder' ? 'Folder View' : 'Memories'}
                        </h1>
                    </div>

                    {/* Date Navigator - Only show in Daily View */}
                    {isDailyView && (
                        <div className="flex items-center gap-1 md:gap-2 bg-white/60 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-200 dark:border-white/10 ml-auto md:ml-0">
                            <button
                                onClick={() => {
                                    const date = new Date(selectedDate + 'T00:00:00');
                                    date.setDate(date.getDate() - 1);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    setSelectedDate(`${year}-${month}-${day}`);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                <Icons.ChevronLeft className="w-4 h-4" />
                            </button>

                            <div
                                className="relative group px-2 py-1 cursor-pointer text-center min-w-[80px] md:min-w-auto"
                                onClick={() => inputRef.current?.showPicker()}
                            >
                                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white select-none pointer-events-none block">
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <input
                                    ref={inputRef}
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                />
                            </div>

                            <button
                                onClick={() => {
                                    const date = new Date(selectedDate + 'T00:00:00');
                                    date.setDate(date.getDate() + 1);
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    setSelectedDate(`${year}-${month}-${day}`);
                                }}
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all"
                            >
                                <Icons.ChevronRight className="w-4 h-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/10 mx-1" />
                            <button
                                onClick={handleManualSync}
                                disabled={isSyncing}
                                className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all"
                                title="Force Sync"
                            >
                                <Icons.Sync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
                    {/* Search */}
                    <div className="relative flex-1 group">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search lifelogs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/60 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap pb-1 md:pb-0 no-scrollbar">
                        {/* Tag Filter */}
                        <div className="relative flex items-center flex-shrink-0">
                            <select
                                value={tagFilter}
                                onChange={(e) => setTagFilter(e.target.value)}
                                className="appearance-none bg-white/60 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-gray-600 dark:text-white/70 focus:outline-none hover:bg-white dark:hover:bg-white/10 cursor-pointer h-9 w-full md:w-auto"
                            >
                                <option value="" className="dark:bg-gray-900 dark:text-white">All Tags</option>
                                {availableTags.map(tag => (
                                    <option key={tag} value={tag} className="dark:bg-gray-900 dark:text-white">{tag}</option>
                                ))}
                            </select>
                            <Icons.Tag className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Sort Order Toggle - Only show in Daily View */}
                        {isDailyView && (
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
                        )}

                        {/* Hourly Filter */}
                        <div className="relative flex-shrink-0">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowHourFilter(!showHourFilter);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors whitespace-nowrap ${selectedHour !== null ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/60 dark:bg-gray-900/50 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'}`}
                            >
                                <Icons.Clock className="w-4 h-4" />
                                {selectedHour !== null ? `${selectedHour}:00` : <span className="hidden md:inline">Time</span>}
                            </button>

                            {showHourFilter && (
                                <>
                                    {/* Mobile backdrop */}
                                    <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setShowHourFilter(false)} />

                                    <div className="fixed md:absolute left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0 top-1/2 md:top-full -translate-y-1/2 md:translate-y-0 md:right-0 md:mt-2 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-white/10 p-2 z-50 grid grid-cols-4 gap-1 animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => setSelectedHour(null)}
                                            className={`col-span-4 p-2 text-xs font-medium rounded-lg mb-1 ${selectedHour === null ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'}`}
                                        >
                                            All Day
                                        </button>
                                        {Array.from({ length: 24 }).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedHour(i)}
                                                className={`p-2 text-xs font-medium rounded-lg ${selectedHour === i ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300'}`}
                                            >
                                                {i}:00
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Selection Mode Toggle */}
                        {!selectionMode && selectedLifelogIds.size === 0 && (
                            <button
                                onClick={() => setSelectionMode(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 transition-colors text-sm font-medium whitespace-nowrap flex-shrink-0"
                            >
                                <Icons.CheckCircle className="w-4 h-4" />
                                <span className="hidden md:inline">Select</span>
                            </button>
                        )}

                        {/* Bulk Actions Toolbar */}
                        {(selectionMode || selectedLifelogIds.size > 0) && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/80 dark:bg-blue-900/20 flex-shrink-0 overflow-x-auto">
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 whitespace-nowrap">
                                    {selectedLifelogIds.size} <span className="hidden md:inline">selected</span>
                                </span>

                                {selectedLifelogIds.size > 0 && (
                                    <>
                                        <div className="w-px h-4 bg-blue-300 dark:bg-blue-600" />

                                        <button
                                            onClick={() => initiateMove()}
                                            className="text-xs px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 whitespace-nowrap"
                                        >
                                            Move
                                        </button>

                                        <button
                                            onClick={handleBulkDelete}
                                            className="text-xs px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 whitespace-nowrap"
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
                                    className="text-xs px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 whitespace-nowrap"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Sync Button (Manual Refresh) */}
                        {isDailyView && (
                            <button
                                onClick={handleManualSync}
                                disabled={isSyncing}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                <Icons.Sync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Refresh'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                {isLoading && !isSyncing ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-white/30">
                        <div className="w-8 h-8 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
                        <p>Loading lifelogs...</p>
                    </div>
                ) : filteredLifelogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-white/30 border border-dashed border-gray-200 dark:border-white/10 rounded-3xl bg-white/50 dark:bg-white/5">
                        <Icons.Sparkles className="w-12 h-12 mb-3 opacity-20" />
                        <p>{selectedHour !== null ? `No lifelogs found for ${selectedHour}:00` :
                            isDailyView ? 'No lifelogs found for this date.' : 'No lifelogs found.'}</p>
                        {isSyncing && <p className="text-sm mt-2 text-blue-500 animate-pulse">Syncing with Limitless...</p>}
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        {filteredLifelogs.map(log => (
                            <LifelogCard
                                key={log.id}
                                lifelog={log}
                                isSelected={selectedLifelogIds.has(log.id)}
                                selectionMode={selectionMode}
                                onToggleSelection={toggleSelection}
                                onToggleStar={handleToggleStar}
                                onMoveToFolder={() => initiateMove(log.id)}
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
