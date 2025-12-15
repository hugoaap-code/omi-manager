import React from 'react';
import { Chat, Folder } from '../types';
import { Icons } from './Icons';

interface ChatListItemProps {
  chat: Chat;
  folders?: Folder[];
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string, currentStatus: boolean) => void;
  onClick: (chat: Chat) => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = ({ 
  chat, 
  folders = [],
  isSelected, 
  onToggleSelect, 
  onToggleFavorite,
  onClick
}) => {
  
  const handleCardClick = (e: React.MouseEvent) => {
    onClick(chat);
  };

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(chat.id);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(chat.id, chat.isFavorite);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`
        group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer
        glass-card select-none overflow-hidden mb-2
        ${isSelected ? 'ring-1 ring-blue-400/50 bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-white/40 dark:hover:bg-white/5'}
      `}
    >
      {/* Selection Checkbox */}
      <div onClick={handleSelectClick} className="flex-shrink-0 z-10">
        {isSelected ? (
          <Icons.CheckCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/30" />
        ) : (
          <Icons.Circle className="w-5 h-5 text-gray-300 dark:text-white/20 hover:text-gray-500 dark:hover:text-white/60" />
        )}
      </div>

      {/* Icon / Avatar */}
      <div className="hidden sm:flex w-10 h-10 rounded-full bg-gray-100 dark:bg-white/10 items-center justify-center text-gray-400 dark:text-white/30">
          <Icons.MessageSquare className="w-5 h-5" />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Title & Date */}
          <div className="md:col-span-4">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                {chat.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center">
                <Icons.Clock className="w-3 h-3 mr-1" />
                {new Date(chat.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              {chat.folderId && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center">
                  <Icons.Folder className="w-3 h-3 mr-1" />
                  {folders.find(f => f.id === chat.folderId)?.name || 'Unknown'}
                </span>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="md:col-span-5 hidden md:block">
             <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {chat.previewText || chat.summary}
             </p>
          </div>

          {/* Tags */}
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            <div className="flex gap-1 hidden lg:flex">
                {chat.tags.slice(0, 1).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                    {tag}
                    </span>
                ))}
                {chat.tags.length > 1 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[10px] text-gray-400 dark:text-gray-400 border border-gray-200 dark:border-white/10">+{chat.tags.length - 1}</span>
                )}
            </div>

            <button 
                onClick={handleFavoriteClick}
                className={`p-1.5 rounded-lg transition-all duration-300 ${chat.isFavorite ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-300 dark:text-white/20 hover:text-gray-600 dark:hover:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
                <Icons.Star className={`w-4 h-4 ${chat.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
      </div>
    </div>
  );
};