
import React from 'react';
import { Chat, Folder, AppContextType, Memory, ActionItem } from '../types';
import { Icons } from './Icons';
import { UserProfile } from '../services/auth';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

interface DashboardPageProps {
    user: UserProfile | null;
    chats: Chat[];
    lifelogs: Memory[]; // Maps to memories - for recent items display
    actionItems: ActionItem[];
    // Counters for accurate totals
    totalChats: number;
    totalMemories: number;
    totalActionItems: number;
    lifelogFolders: Folder[];
    onNavigate: (context: AppContextType) => void;
    onOpenChat: (chat: Chat) => void;
    onOpenSidebar: () => void;
    onSync: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
    user,
    chats,
    lifelogs,
    actionItems,
    totalChats,
    totalMemories,
    totalActionItems,
    lifelogFolders,
    onNavigate,
    onOpenChat,
    onOpenSidebar,
    onSync
}) => {
    const [isSyncing, setIsSyncing] = React.useState(false);

    // Calculate stats
    const favoriteChats = chats.filter(c => c.isFavorite).length;
    const pendingTasks = actionItems.filter(a => !a.completed).length;
    const recentChats = chats.slice(0, 3);
    const recentMemories = lifelogs.slice(0, 3);

    const handleSyncClick = async () => {
        setIsSyncing(true);
        try {
            await onSync();
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setIsSyncing(false);
        }
    };

    const StatCard = ({ icon: Icon, label, value, colorClass, onClick }: { icon: any, label: string, value: string | number, colorClass: string, onClick?: () => void }) => (
        <div
            onClick={onClick}
            className={`
        relative overflow-hidden p-6 rounded-3xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-md
        hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 group cursor-pointer shadow-sm
    `}
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass} `}>
                <Icon className="w-24 h-24 transform rotate-12 translate-x-4 -translate-y-4" />
            </div>

            <div className="relative z-10">
                <div className={`p-3 rounded-2xl w-fit mb-4 ${colorClass} bg-opacity-20`}>
                    <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')} `} />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
            </div>
        </div>
    );

    const ActionCard = ({ icon: Icon, title, description, onClick, gradient }: { icon: any, title: string, description: string, onClick: () => void, gradient: string }) => (
        <button
            onClick={onClick}
            className={`
        relative w-full text-left p-6 rounded-3xl overflow-hidden group
        border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300
        hover:scale-[1.02] active:scale-[0.98] bg-white dark:bg-transparent shadow-sm
    `}
        >
            <div className={`absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${gradient} `} />
            <div className="relative z-10 flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gray-100 dark:bg-white/10 backdrop-blur-sm">
                    <Icon className="w-8 h-8 text-gray-700 dark:text-white" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
                <Icons.ChevronRight className="w-6 h-6 text-gray-400 dark:text-white/30 ml-auto group-hover:translate-x-1 transition-transform" />
            </div>
        </button>
    );

    return (
        <div className="flex-1 h-full overflow-y-auto p-8">
            <div className="max-w-6xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <button
                            className="md:hidden p-2 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 rounded-lg mt-1"
                            onClick={onOpenSidebar}
                        >
                            <Icons.Menu className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">{user?.displayName?.split(' ')[0] || 'User'}</span>
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">Here's what's happening in your digital brain.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-500 bg-white/60 dark:bg-white/5 px-4 py-2 rounded-full border border-gray-200 dark:border-white/5 shadow-sm">
                            <Icons.Calendar className="w-4 h-4" />
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </div>
                        <button
                            onClick={handleSyncClick}
                            disabled={isSyncing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                        >
                            <Icons.Sync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    <StatCard
                        icon={Icons.MessageSquare}
                        label="Conversations"
                        value={totalChats}
                        colorClass="text-blue-600 dark:text-blue-400 bg-blue-500"
                        onClick={() => onNavigate('conversations')}
                    />
                    <StatCard
                        icon={Icons.BookOpen}
                        label="Memories"
                        value={totalMemories}
                        colorClass="text-purple-600 dark:text-purple-400 bg-purple-500"
                        onClick={() => onNavigate('memories')}
                    />
                    <StatCard
                        icon={Icons.CheckSquare}
                        label="Total Tasks"
                        value={totalActionItems}
                        colorClass="text-green-600 dark:text-green-400 bg-green-500"
                        onClick={() => onNavigate('action_items')}
                    />
                    <StatCard
                        icon={Icons.Clock}
                        label="Pending Tasks"
                        value={pendingTasks}
                        colorClass="text-orange-600 dark:text-orange-400 bg-orange-500"
                        onClick={() => onNavigate('action_items')}
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ActionCard
                        icon={Icons.MessageSquare}
                        title="Browse Conversations"
                        description="Access your conversation history and AI interactions"
                        onClick={() => onNavigate('conversations')}
                        gradient="from-blue-600 to-cyan-500"
                    />
                    <ActionCard
                        icon={Icons.BookOpen}
                        title="View Memories"
                        description="Explore your daily journals and recorded memories"
                        onClick={() => onNavigate('memories')}
                        gradient="from-purple-600 to-pink-500"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Chats */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Conversations</h2>
                            <button
                                onClick={() => onNavigate('conversations')}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm font-medium hover:underline"
                            >
                                View All
                            </button>
                        </div>

                        <div className="space-y-4">
                            {recentChats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => onOpenChat(chat)}
                                    className="group p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <Icons.MessageSquare className="w-4 h-4" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                                {chat.title}
                                            </h3>
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {new Date(chat.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 pl-9">
                                        {chat.summary || chat.previewText}
                                    </p>
                                </div>
                            ))}

                            {recentChats.length === 0 && (
                                <div className="py-8 text-center text-gray-500 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 border-dashed">
                                    No conversations found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Memories */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Memories</h2>
                            <button
                                onClick={() => onNavigate('memories')}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 text-sm font-medium hover:underline"
                            >
                                View All
                            </button>
                        </div>

                        <div className="space-y-4">
                            {recentMemories.map(log => (
                                <div
                                    key={log.id}
                                    onClick={() => onNavigate('memories')}
                                    className="group p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 transition-all cursor-pointer flex flex-col shadow-sm"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                                <Icons.Clock className="w-4 h-4" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                                                {log.title || "Untitled Memory"}
                                            </h3>
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {new Date(log.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 pl-9">
                                        <ReactMarkdown
                                            allowedElements={['p', 'strong', 'em']}
                                            rehypePlugins={[rehypeSanitize]}
                                            components={{ p: ({ node, ...props }) => <span {...props} /> }}
                                        >
                                            {log.content.replace(/[#*`]/g, '')}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}

                            {recentMemories.length === 0 && (
                                <div className="py-8 text-center text-gray-500 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 border-dashed">
                                    No memories found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
