
import React, { useState, useMemo } from 'react';
import { ActionItem, Folder } from '../types';
import { Icons } from './Icons';
import { ApiService } from '../services/api';
import { ActionItemModal } from './ActionItemModal';

interface ActionItemsPageProps {
    actionItems: ActionItem[];
    folders: Folder[];
    activeFolderId?: string;
    onUpdateActionItem: (id: string, updates: Partial<ActionItem>) => void;
    onOpenSidebar: () => void;
}

export const ActionItemsPage: React.FC<ActionItemsPageProps> = ({ actionItems, folders, activeFolderId, onUpdateActionItem, onOpenSidebar }) => {
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedTag, setSelectedTag] = useState<string>('');
    const [selectedFolder, setSelectedFolder] = useState<string>('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editingItem, setEditingItem] = useState<ActionItem | null>(null);

    const datePickerRef = React.useRef<HTMLDivElement>(null);

    // Close date picker when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        };
        if (showDatePicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showDatePicker]);

    // Get unique tags
    const availableTags = useMemo(() => {
        const set = new Set<string>();
        actionItems.forEach(item => {
            item.tags?.forEach(t => set.add(t));
        });
        return Array.from(set).sort();
    }, [actionItems]);

    // Determine effective folder filter (prefer sidebar selection, then local UI selection)
    const effectiveFolderId = activeFolderId || selectedFolder || '';

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let result = actionItems;

        // Apply folder filter
        if (effectiveFolderId) {
            result = result.filter(item => item.folderId === effectiveFolderId);
        }

        // Apply status filter
        if (statusFilter === 'pending') result = result.filter(item => !item.completed);
        if (statusFilter === 'completed') result = result.filter(item => item.completed);

        // Apply search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.description.toLowerCase().includes(q) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
            );
        }

        // Apply date range filter
        if (startDate || endDate) {
            result = result.filter(item => {
                if (!item.createdAt) return false;
                const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;
                return true;
            });
        }

        // Apply tag filter
        if (selectedTag) {
            result = result.filter(item => item.tags?.includes(selectedTag));
        }

        // Apply sort
        result.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
        });

        return result;
    }, [actionItems, effectiveFolderId, statusFilter, searchQuery, startDate, endDate, selectedTag, sortOrder]);

    const handleToggle = async (id: string, current: boolean) => {
        onUpdateActionItem(id, { completed: !current });
        await ApiService.updateActionItem(id, { completed: !current });
    };

    const handleFolderChange = async (id: string, folderId: string) => {
        const newVal = folderId === 'none' ? null : folderId;
        onUpdateActionItem(id, { folderId: newVal });
        await ApiService.updateActionItem(id, { folderId: newVal });
    };

    const handleAddTag = async (id: string, currentTags: string[] | undefined) => {
        const tag = prompt("Enter new tag:");
        if (tag && tag.trim()) {
            const newTags = [...(currentTags || []), tag.trim()];
            onUpdateActionItem(id, { tags: newTags });
            await ApiService.updateActionItem(id, { tags: newTags });
        }
    };

    const handleRemoveTag = async (id: string, currentTags: string[] | undefined, tagToRemove: string) => {
        if (!currentTags) return;
        const newTags = currentTags.filter(t => t !== tagToRemove);
        onUpdateActionItem(id, { tags: newTags });
        await ApiService.updateActionItem(id, { tags: newTags });
    };

    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
    };

    const getDateLabel = () => {
        if (startDate && endDate) {
            return `${new Date(startDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${new Date(endDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
        }
        if (startDate) {
            return `From ${new Date(startDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
        }
        if (endDate) {
            return `Until ${new Date(endDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
        }
        return 'All Dates';
    };

    return (
        <div className="flex flex-col h-full bg-gray-50/50 dark:bg-[#050505]/50 backdrop-blur-3xl">
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
                            Action Items
                        </h1>
                    </div>

                    {/* Folder, Tag and Date Filters */}
                    <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-200 dark:border-white/10 ml-auto md:ml-0">
                        {/* Folder Filter */}
                        <div className="relative group px-2 py-1">
                            <select
                                value={effectiveFolderId}
                                onChange={(e) => setSelectedFolder(e.target.value)}
                                className="bg-transparent text-xs md:text-sm font-medium text-gray-900 dark:text-white focus:outline-none cursor-pointer pr-4 appearance-none"
                                disabled={!!activeFolderId}
                            >
                                <option value="" className="bg-white dark:bg-gray-900">All Folders</option>
                                {folders.map(folder => (
                                    <option key={folder.id} value={folder.id} className="bg-white dark:bg-gray-900">{folder.name}</option>
                                ))}
                            </select>
                            <Icons.ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                        </div>

                        <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/10 mx-1" />

                        {/* Tag Filter */}
                        <div className="relative group px-2 py-1">
                            <select
                                value={selectedTag}
                                onChange={(e) => setSelectedTag(e.target.value)}
                                className="bg-transparent text-xs md:text-sm font-medium text-gray-900 dark:text-white focus:outline-none cursor-pointer pr-4 appearance-none"
                            >
                                <option value="" className="bg-white dark:bg-gray-900">All Tags</option>
                                {availableTags.map(tag => (
                                    <option key={tag} value={tag} className="bg-white dark:bg-gray-900">{tag}</option>
                                ))}
                            </select>
                            <Icons.ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                        </div>

                        <div className="w-[1px] h-4 bg-gray-300 dark:bg-white/10 mx-1" />

                        {/* Date Range Filter */}
                        <div className="relative" ref={datePickerRef}>
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${(startDate || endDate) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'} hover:bg-white dark:hover:bg-white/10`}
                            >
                                <Icons.Calendar className="w-4 h-4" />
                                <span className="whitespace-nowrap">{getDateLabel()}</span>
                                {(startDate || endDate) && (
                                    <span
                                        onClick={(e) => { e.stopPropagation(); clearDateFilter(); }}
                                        className="ml-1 p-0.5 rounded hover:bg-red-500/20 hover:text-red-500"
                                    >
                                        <Icons.Close className="w-3 h-3" />
                                    </span>
                                )}
                            </button>

                            {/* Date Picker Popover */}
                            {showDatePicker && (
                                <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-xl p-4 min-w-[280px] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex flex-col gap-3">
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-white/40 mb-1">From</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-gray-400 dark:text-white/40 mb-1">To</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            />
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-white/10">
                                            <button
                                                onClick={clearDateFilter}
                                                className="text-xs text-gray-500 dark:text-white/50 hover:text-red-500"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={() => setShowDatePicker(false)}
                                                className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full">
                    {/* Search */}
                    <div className="relative flex-1 group">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search action items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/60 dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap pb-1 md:pb-0 no-scrollbar">
                        {/* Status Filter */}
                        <div className="flex bg-gray-200 dark:bg-white/5 rounded-lg p-1 flex-shrink-0">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setStatusFilter('pending')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${statusFilter === 'pending' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setStatusFilter('completed')}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${statusFilter === 'completed' ? 'bg-white dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'}`}
                            >
                                Completed
                            </button>
                        </div>

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
                            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto space-y-2">
                    {filteredItems.length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            <Icons.CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No action items found.</p>
                            {(startDate || endDate || selectedTag) && (
                                <button
                                    onClick={() => { clearDateFilter(); setSelectedTag(''); }}
                                    className="mt-2 text-sm text-blue-500 hover:underline"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
                    {filteredItems.map(item => (
                        <div key={item.id} className="group flex items-start gap-4 p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-200 dark:border-white/5 hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => setEditingItem(item)}>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleToggle(item.id, item.completed); }}
                                className={`mt-1 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.completed ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400 dark:border-white/30 hover:border-blue-500'}`}
                            >
                                {item.completed && <Icons.Check className="w-3.5 h-3.5" />}
                            </button>
                            <div className="flex-1">
                                <p className={`text-sm ${item.completed ? 'line-through text-gray-500 dark:text-white/40' : 'text-gray-900 dark:text-white'}`}>
                                    {item.description}
                                </p>
                                {item.details && (
                                    <p className="text-xs text-gray-400 dark:text-white/30 mt-1 line-clamp-1">{item.details}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                    {/* Date */}
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-white/30">
                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {/* Due Date */}
                                    {item.dueDate && (
                                        <div className="flex items-center gap-1 text-xs text-orange-500">
                                            <Icons.Clock className="w-3 h-3" />
                                            {new Date(item.dueDate).toLocaleDateString()}
                                        </div>
                                    )}

                                    {/* Folder Selector */}
                                    <div className="flex items-center gap-1">
                                        <Icons.Folder className="w-3 h-3 text-gray-400" />
                                        <select
                                            value={item.folderId || 'none'}
                                            onChange={(e) => handleFolderChange(item.id, e.target.value)}
                                            className="bg-transparent text-xs text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white focus:outline-none cursor-pointer max-w-[100px] truncate"
                                        >
                                            <option value="none" className="bg-white dark:bg-gray-900">No Folder</option>
                                            {folders.map(f => (
                                                <option key={f.id} value={f.id} className="bg-white dark:bg-gray-900">{f.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex items-center flex-wrap gap-1">
                                        {item.tags?.map(tag => (
                                            <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 text-[10px] text-gray-600 dark:text-white/80 border border-gray-200 dark:border-white/5">
                                                {tag}
                                                <button
                                                    onClick={() => handleRemoveTag(item.id, item.tags, tag)}
                                                    className="hover:text-red-500"
                                                >
                                                    <Icons.Close className="w-2.5 h-2.5" />
                                                </button>
                                            </span>
                                        ))}
                                        <button
                                            onClick={() => handleAddTag(item.id, item.tags)}
                                            className="px-1.5 py-0.5 rounded-md bg-transparent hover:bg-gray-200 dark:hover:bg-white/10 text-[10px] text-gray-400 dark:text-white/40 hover:text-blue-500 transition-colors flex items-center gap-0.5"
                                        >
                                            <Icons.Plus className="w-2.5 h-2.5" />
                                            Tag
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edit Modal */}
            {editingItem && (
                <ActionItemModal
                    item={editingItem}
                    onClose={() => setEditingItem(null)}
                    onSave={async (id, updates) => {
                        onUpdateActionItem(id, updates);
                        await ApiService.updateActionItem(id, updates);
                    }}
                />
            )}
        </div>
    );
};
