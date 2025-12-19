import React from 'react';
import { Memory, Folder } from '../types';
import { Icons } from './Icons';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

interface MemoryModalProps {
    memory: Memory;
    folders: Folder[];
    onClose: () => void;
    onToggleStar: (id: string) => void;
    onMoveToFolder: (id: string) => void;
    onEditTags: (id: string) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
    memory,
    folders,
    onClose,
    onToggleStar,
    onMoveToFolder,
    onEditTags
}) => {
    const folder = folders.find(f => f.id === memory.folderId);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#1A1A1F] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-white/10">
                    <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                                <Icons.Brain className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                Memory
                            </span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">
                            {memory.title || 'Untitled Memory'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Icons.Close className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Metadata Bar */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <Icons.Calendar className="w-4 h-4" />
                        <span>{new Date(memory.createdAt).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>

                    {/* Folder */}
                    {folder && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                            <Icons.Folder className="w-4 h-4" />
                            <span>{folder.name}</span>
                        </div>
                    )}

                    {/* Category */}
                    {memory.category && (
                        <span className="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-xs font-medium text-blue-600 dark:text-blue-400">
                            {memory.category}
                        </span>
                    )}

                    {/* Star */}
                    {memory.isStarred && (
                        <div className="flex items-center gap-1 text-yellow-500">
                            <Icons.Star className="w-4 h-4 fill-current" />
                            <span className="text-xs font-medium">Starred</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-white" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-base font-semibold mt-3 mb-1 text-gray-900 dark:text-white" {...props} />,
                                p: ({ node, ...props }) => <p className="my-2 leading-relaxed" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc list-inside my-2 space-y-1" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-2 space-y-1" {...props} />,
                                li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                                blockquote: ({ node, ...props }) => (
                                    <blockquote className="border-l-4 border-purple-500 pl-4 py-1 my-3 bg-purple-50 dark:bg-purple-500/10 rounded-r-lg italic text-gray-600 dark:text-gray-400" {...props} />
                                ),
                                code: ({ node, className, ...props }) => (
                                    <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 rounded text-sm font-mono text-gray-800 dark:text-gray-200" {...props} />
                                ),
                                pre: ({ node, ...props }) => (
                                    <pre className="bg-gray-100 dark:bg-white/10 rounded-xl p-4 overflow-x-auto my-3" {...props} />
                                ),
                                a: ({ node, ...props }) => (
                                    <a className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                                ),
                            }}
                        >
                            {memory.content}
                        </ReactMarkdown>
                    </div>
                </div>

                {/* Tags */}
                {memory.tags && memory.tags.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Icons.Tag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            {memory.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-white/10 text-xs font-medium text-gray-600 dark:text-gray-300"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-white/10">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onToggleStar(memory.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${memory.isStarred
                                    ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                                    : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 hover:text-yellow-600 dark:hover:text-yellow-400'
                                }`}
                        >
                            <Icons.Star className={`w-4 h-4 ${memory.isStarred ? 'fill-current' : ''}`} />
                            {memory.isStarred ? 'Starred' : 'Star'}
                        </button>
                        <button
                            onClick={() => onMoveToFolder(memory.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"
                        >
                            <Icons.Folder className="w-4 h-4" />
                            Move
                        </button>
                        <button
                            onClick={() => onEditTags(memory.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 text-sm font-medium transition-colors"
                        >
                            <Icons.Tag className="w-4 h-4" />
                            Tags
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};
