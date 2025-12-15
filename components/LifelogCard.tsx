
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Memory } from '../types';
import { Icons } from './Icons';

interface LifelogCardProps {
    lifelog: Memory;
    isSelected?: boolean;
    selectionMode?: boolean;
    onToggleSelection?: (id: string) => void;
    onToggleStar?: (id: string) => void;
    onMoveToFolder?: (id: string) => void;
    onEditTags?: (id: string) => void;
}

export const LifelogCard: React.FC<LifelogCardProps> = ({
    lifelog,
    isSelected = false,
    selectionMode = false,
    onToggleSelection,
    onToggleStar,
    onMoveToFolder,
    onEditTags
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Use createdAt for display
    const dateObj = new Date(lifelog.createdAt);
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = dateObj.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });

    // Use title if available, otherwise truncate content
    const title = lifelog.title || "Untitled Memory";

    const ActionButtons = ({ mobile = false }: { mobile?: boolean }) => (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEditTags?.(lifelog.id);
                }}
                className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-blue-500`}
                title="Edit Tags"
            >
                <Icons.Tag className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onMoveToFolder?.(lifelog.id);
                }}
                className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-blue-500`}
                title="Move to Folder"
            >
                <Icons.Folder className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar?.(lifelog.id);
                }}
                className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${lifelog.isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
            >
                <Icons.Star className={`w-4 h-4 md:w-5 md:h-5 ${lifelog.isStarred ? 'fill-yellow-400' : ''}`} />
            </button>
        </>
    );

    const ChevronButton = () => (
        !selectionMode ? (
            <button
                className={`p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            >
                <Icons.ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
            </button>
        ) : null
    );

    return (
        <div className={`glass-card rounded-2xl mb-4 w-full animate-in fade-in slide-in-from-bottom-2 overflow-hidden border transition-colors ${isSelected
            ? 'border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-white/5 bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10'
            }`}>
            <div
                className="p-4 md:p-5 cursor-pointer flex items-start gap-3 md:gap-4"
                onClick={() => !selectionMode && setIsExpanded(!isExpanded)}
            >
                {/* Selection Checkbox */}
                {selectionMode && (
                    <div
                        className="mt-1 flex-shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelection?.(lifelog.id);
                        }}
                    >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                            }`}>
                            {isSelected && <Icons.Check className="w-3 h-3 text-white" />}
                        </div>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    {/* Header: Date + Time */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-blue-500 dark:text-blue-400 mb-1.5">
                        <div className="flex items-center gap-1">
                            <Icons.Clock className="w-3 h-3" />
                            <span>{dateStr}</span>
                        </div>
                        <span>•</span>
                        <span>{timeStr}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight break-words">
                        {title}
                    </h3>

                    {/* Tags */}
                    {lifelog.tags && lifelog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {lifelog.tags.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-[10px] font-medium border border-blue-100 dark:border-blue-500/20">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Preview Content (Collapsed) */}
                    {!isExpanded && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 break-words">
                            {lifelog.content.replace(/[#*`]/g, '')}
                        </p>
                    )}

                    {/* Mobile Actions Footer */}
                    <div className="flex md:hidden items-center justify-end gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-white/5">
                        <ActionButtons mobile />
                        <ChevronButton />
                    </div>
                </div>

                {/* Desktop Actions Column */}
                <div className="hidden md:flex items-center gap-2 flex-shrink-0 -mr-1 md:mr-0">
                    <ActionButtons />
                    <ChevronButton />
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 md:px-6 pb-4 md:pb-6 pt-2 border-t border-gray-100 dark:border-white/5">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 break-words">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                                code: ({ node, ...props }) => <code className="bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded text-xs font-mono break-all" {...props} />
                            }}
                        >
                            {lifelog.content}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};
