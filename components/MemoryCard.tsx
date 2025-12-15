import React from 'react';
import { Memory, Folder } from '../types';
import { Icons } from './Icons';

interface MemoryCardProps {
    memory: Memory;
    folders?: Folder[];
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onToggleStar: (id: string) => void;
    onClick: (memory: Memory) => void;
    onMoveToFolder?: (memoryId: string) => void;
    onEditTags?: (memoryId: string) => void;
}

export const MemoryCard: React.FC<MemoryCardProps> = React.memo((({
    memory,
    folders = [],
    isSelected,
    onToggleSelect,
    onToggleStar,
    onClick,
    onMoveToFolder,
    onEditTags
}) => {

    const handleCardClick = (e: React.MouseEvent) => {
        onClick(memory);
    };

    const handleSelectClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleSelect(memory.id);
    };

    const handleStarClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleStar(memory.id);
    };

    const handleMoveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMoveToFolder?.(memory.id);
    };

    const handleTagsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEditTags?.(memory.id);
    };

    // Get a preview of content (strip markdown)
    const preview = memory.content.replace(/[#*`]/g, '').slice(0, 200);

    return (
        <div
            onClick={handleCardClick}
            className={`
        group relative flex flex-col p-5 rounded-[24px] h-[220px] cursor-pointer
        glass-card select-none overflow-hidden
        ${isSelected ? 'ring-2 ring-blue-400/80 bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
        >
            {/* Selection Indicator Overlay */}
            <div
                onClick={handleSelectClick}
                className={`absolute top-4 right-4 z-20 ${isSelected ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}
            >
                {isSelected ? (
                    <Icons.CheckCircle className="w-6 h-6 text-blue-500 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/50" />
                ) : (
                    <Icons.Circle className="w-6 h-6 text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60" />
                )}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-3 pr-8">
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-300">
                        {memory.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center">
                            <Icons.Clock className="w-3 h-3 mr-1" />
                            {new Date(memory.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {memory.folderId && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center">
                                <Icons.Folder className="w-3 h-3 mr-1" />
                                {folders.find(f => f.id === memory.folderId)?.name || 'Unknown'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {preview}
                </p>
            </div>

            {/* Footer: Tags & Actions */}
            <div className="mt-4 flex items-center justify-between gap-2">
                <div className="flex gap-2 overflow-hidden flex-1 min-w-0">
                    {memory.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                            {tag}
                        </span>
                    ))}
                    {memory.tags.length > 2 && (
                        <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/10 text-[10px] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">+{memory.tags.length - 2}</span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    {onMoveToFolder && (
                        <button
                            onClick={handleMoveClick}
                            className="p-1.5 rounded-lg text-gray-400 dark:text-white/40 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-400/10"
                            title="Move to folder"
                        >
                            <Icons.Folder className="w-4 h-4" />
                        </button>
                    )}
                    {onEditTags && (
                        <button
                            onClick={handleTagsClick}
                            className="p-1.5 rounded-lg text-gray-400 dark:text-white/40 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-400/10"
                            title="Edit tags"
                        >
                            <Icons.Tag className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={handleStarClick}
                        className={`p-1.5 rounded-lg ${memory.isStarred ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10' : 'text-gray-400 dark:text-white/40 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-400/10'}`}
                        title="Star"
                    >
                        <Icons.Star className={`w-4 h-4 ${memory.isStarred ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
}), (prevProps, nextProps) => {
    // Custom comparison function - only re-render if these change
    return prevProps.memory.id === nextProps.memory.id &&
        prevProps.memory.title === nextProps.memory.title &&
        prevProps.memory.isStarred === nextProps.memory.isStarred &&
        prevProps.memory.updatedAt === nextProps.memory.updatedAt &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.folders === nextProps.folders;
});
