import React, { useState, useEffect } from 'react';
import { ActionItem } from '../types';
import { Icons } from './Icons';

interface ActionItemModalProps {
    item: ActionItem;
    onClose: () => void;
    onSave: (id: string, updates: Partial<ActionItem>) => void;
}

export const ActionItemModal: React.FC<ActionItemModalProps> = ({ item, onClose, onSave }) => {
    const [description, setDescription] = useState(item.description);
    const [details, setDetails] = useState(item.details || '');
    const [dueDate, setDueDate] = useState(item.dueDate || '');
    const [completed, setCompleted] = useState(item.completed);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSave = () => {
        onSave(item.id, {
            description: description.trim(),
            details: details.trim() || undefined,
            dueDate: dueDate || undefined,
            completed,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-[#151519] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-200 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#1A1A1F]">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Action Item</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-white/50 transition-colors"
                    >
                        <Icons.Close className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 space-y-4">
                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-white/50 mb-1">
                            Task Description
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="What needs to be done?"
                            autoFocus
                        />
                    </div>

                    {/* Details */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 dark:text-white/50 mb-1">
                            Details
                        </label>
                        <textarea
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                            placeholder="Add more details about this task..."
                        />
                    </div>

                    {/* Due Date & Completed */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-white/50 mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase text-gray-500 dark:text-white/50 mb-1">
                                Status
                            </label>
                            <button
                                onClick={() => setCompleted(!completed)}
                                className={`w-full px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors border ${completed
                                        ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white'
                                    }`}
                            >
                                {completed ? (
                                    <>
                                        <Icons.Check className="w-4 h-4" />
                                        Completed
                                    </>
                                ) : (
                                    <>
                                        <Icons.Circle className="w-4 h-4" />
                                        Pending
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-white/30 pt-2 border-t border-gray-200 dark:border-white/10">
                        <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.conversationId && (
                            <span className="flex items-center gap-1">
                                <Icons.MessageSquare className="w-3 h-3" />
                                Linked to conversation
                            </span>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!description.trim()}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
