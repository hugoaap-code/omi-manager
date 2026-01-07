import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Chat, ChatMessage, Folder } from '../types';
import { Icons } from './Icons';

interface ChatModalProps {
  chat: Chat;
  allChats: Chat[];
  folders?: Folder[];
  onClose: () => void;
  onNavigate: (chat: Chat) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onStatusChange: (id: string, newStatus: any) => void;
  onMoveToFolder: (chat: Chat) => void;
  onUpdateChat: (id: string, updates: Partial<Chat>) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  chat,
  allChats,
  folders = [],
  onClose,
  onNavigate,
  onToggleFavorite,
  onStatusChange,
  onMoveToFolder,
  onUpdateChat
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Editing Title State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat.title);

  // Tag State
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Editing Message State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessageContent, setEditedMessageContent] = useState('');

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);



  // View Mote State
  const [viewMode, setViewMode] = useState<'transcript' | 'overview'>('transcript');

  // Set initial view mode based on content
  useEffect(() => {
    if (chat.messages && chat.messages.length > 0) {
      setViewMode('transcript');
    } else {
      setViewMode('overview');
    }
  }, [chat.id, chat.messages]);

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    // Navigate with arrow keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const currentIndex = allChats.findIndex(c => c.id === chat.id);
      if (currentIndex === -1) return;

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        // Previous chat
        onNavigate(allChats[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && currentIndex < allChats.length - 1) {
        // Next chat
        onNavigate(allChats[currentIndex + 1]);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, chat, allChats, onNavigate]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileMenuOpen]);

  const isArchived = chat.status === 'archived';

  const handleCopyChat = () => {
    const formattedText = `${chat.title}\n\nSUMMARY:\n${chat.summary}\n\nTRANSCRIPT:\n\n${chat.messages?.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n')}`;
    navigator.clipboard.writeText(formattedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== chat.title) {
      onUpdateChat(chat.id, { title: editedTitle });
    }
    setIsEditingTitle(false);
  };

  const startEditingMessage = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditedMessageContent(msg.content);
  };

  const saveMessage = () => {
    if (editingMessageId && chat.messages) {
      const updatedMessages = chat.messages.map(m =>
        m.id === editingMessageId ? { ...m, content: editedMessageContent } : m
      );
      onUpdateChat(chat.id, { messages: updatedMessages });
      setEditingMessageId(null);
    }
  };

  const handleAddTag = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newTag.trim() && !chat.tags.includes(newTag.trim())) {
      const updatedTags = [...chat.tags, newTag.trim()];
      onUpdateChat(chat.id, { tags: updatedTags });
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = chat.tags.filter(t => t !== tagToRemove);
    onUpdateChat(chat.id, { tags: updatedTags });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8 text-gray-900 dark:text-white">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Window */}
      <div className="relative w-full max-w-4xl h-[85vh] bg-white/90 dark:bg-[#151519] glass-panel rounded-[32px] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300 border border-gray-200 dark:border-white/10">

        {/* Header Area */}
        <div className="flex flex-col border-b border-gray-200 dark:border-white/5 bg-gray-50/80 dark:bg-[#1A1A1F] p-6">

          {/* Top Row: Title and Actions */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 mr-4 group">
              {isEditingTitle ? (
                <div className="relative">
                  <input
                    autoFocus
                    className="w-full bg-white dark:bg-black/30 rounded-lg p-2 font-bold text-2xl border border-blue-500/50 outline-none text-gray-900 dark:text-white"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  />
                  <button onMouseDown={handleSaveTitle} className="absolute right-2 top-2.5 text-blue-500 dark:text-blue-400">
                    <Icons.Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold leading-tight break-words text-gray-900 dark:text-white">{chat.title}</h2>
                  <button
                    onClick={() => { setEditedTitle(chat.title); setIsEditingTitle(true); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-white/30 hover:text-gray-900 dark:hover:text-white transition-opacity"
                  >
                    <Icons.Edit className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-200 dark:bg-black/20 rounded-xl p-1 mr-2">
                <button
                  onClick={() => setViewMode('transcript')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'transcript' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Transcript
                </button>
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'overview' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  Overview
                </button>
              </div>

              <button
                onClick={handleCopyChat}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors relative group"
                title="Copy Chat"
              >
                {isCopied ? <Icons.Check className="w-5 h-5 text-green-500 dark:text-green-400" /> : <Icons.Copy className="w-5 h-5" />}
              </button>

              <button
                onClick={() => onMoveToFolder(chat)}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Move to Folder"
              >
                <Icons.Move className="w-5 h-5" />
              </button>

              <button
                onClick={() => onToggleFavorite(chat.id, chat.isFavorite)}
                className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${chat.isFavorite ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'}`}
                title={chat.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Icons.Star className={`w-5 h-5 ${chat.isFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={() => onStatusChange(chat.id, isArchived ? 'active' : 'archived')}
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
                title={isArchived ? "Unarchive" : "Archive"}
              >
                {isArchived ? <Icons.Inbox className="w-5 h-5" /> : <Icons.Archive className="w-5 h-5" />}
              </button>

              <div className="w-[1px] h-6 bg-gray-200 dark:bg-white/10 mx-1" />

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Icons.Close className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Icons.Close className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-white/60">
            {/* Mobile View Toggle */}
            <div className="md:hidden flex items-center bg-gray-200 dark:bg-black/20 rounded-xl p-1 mr-2 w-full mb-2">
              <button
                onClick={() => setViewMode('transcript')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'transcript' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Transcript
              </button>
              <button
                onClick={() => setViewMode('overview')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'overview' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'}`}
              >
                Overview
              </button>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Icons.Calendar className="w-4 h-4 opacity-70" />
              <span>{new Date(chat.createdAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Source */}
            {chat.source && (
              <div className="flex items-center gap-1.5">
                <Icons.Sparkles className="w-4 h-4 opacity-70" />
                <span className="capitalize">{chat.source}</span>
              </div>
            )}

            {/* Language */}
            {chat.language && (
              <div className="flex items-center gap-1.5">
                <Icons.Globe className="w-4 h-4 opacity-70" />
                <span className="uppercase">{chat.language}</span>
              </div>
            )}

            {/* Geolocation */}
            {chat.geolocation?.locality && (
              <div className="flex items-center gap-1.5">
                <Icons.MapPin className="w-4 h-4 opacity-70" />
                <span>{chat.geolocation.locality}</span>
              </div>
            )}

            {/* Folder */}
            {chat.folderId && (
              <div className="flex items-center gap-1.5">
                <Icons.Folder className="w-4 h-4 opacity-70" />
                <span>{folders.find(f => f.id === chat.folderId)?.name || 'Unknown Folder'}</span>
              </div>
            )}

            {/* Tags */}
            <div className="flex items-center gap-2">
              <div className="flex flex-wrap gap-2">
                {chat.tags.map(tag => (
                  <span key={tag} className="group flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-white dark:bg-white/10 text-xs font-medium text-gray-600 dark:text-white/80 border border-gray-200 dark:border-white/5">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="p-0.5 rounded hover:bg-red-500/20 hover:text-red-400 text-gray-400 dark:text-white/30 opacity-0 group-hover:opacity-100 transition-all">
                      <Icons.Close className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {isAddingTag ? (
                <form onSubmit={handleAddTag} className="flex gap-1 animate-in fade-in slide-in-from-left-2">
                  <input
                    autoFocus
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New tag..."
                    className="w-32 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-md px-2 py-0.5 text-xs focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30"
                  />
                  <button
                    type="submit"
                    disabled={!newTag.trim()}
                    className="bg-blue-500 text-white rounded-md px-1.5 py-0.5 text-xs disabled:opacity-50"
                  >
                    <Icons.Check className="w-3 h-3" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Icons.Plus className="w-3 h-3" />
                  Tag
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full bg-white/50 dark:bg-[#111115] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

            {/* OVERVIEW MODE */}
            {viewMode === 'overview' && (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white dark:bg-[#1F1F25] rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-sm">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                    <Icons.FileText className="w-5 h-5 text-blue-500" />
                    Overview
                  </h3>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                      {chat.summary || chat.previewText || "_No content available for this conversation._"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* TRANSCRIPT MODE */}
            {viewMode === 'transcript' && (chat.messages && chat.messages.length > 0 ? (
              chat.messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 group ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  {/* Avatar */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-white
                    ${msg.role === 'user'
                      ? 'bg-gradient-to-tr from-blue-600 to-purple-600'
                      : 'bg-white border border-gray-100 dark:border-transparent dark:bg-gradient-to-tr dark:from-emerald-500 dark:to-cyan-500 text-gray-400 dark:text-white'}
                  `}>
                    {msg.role === 'user' ? <Icons.User className="w-5 h-5" /> : <Icons.Sparkles className="w-5 h-5" />}
                  </div>

                  {/* Bubble */}
                  <div className={`
                    relative max-w-[80%] md:max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all
                    ${msg.role === 'user'
                      ? 'bg-blue-600/10 dark:bg-blue-500/20 text-gray-900 dark:text-white rounded-tl-sm border border-blue-100 dark:border-blue-500/20'
                      : 'bg-white dark:bg-[#1F1F25] text-gray-800 dark:text-gray-200 rounded-tr-sm border border-gray-200 dark:border-white/5'}
                  `}>
                    {editingMessageId === msg.id ? (
                      <div className="w-full">
                        <textarea
                          autoFocus
                          className="w-full bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-lg p-2 outline-none resize-none min-h-[100px]"
                          value={editedMessageContent}
                          onChange={(e) => setEditedMessageContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setEditingMessageId(null)}
                            className="text-xs px-3 py-1 rounded-md bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-600 dark:text-white/60"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveMessage}
                            className="text-xs px-3 py-1 rounded-md bg-blue-500 hover:bg-blue-400 text-white"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="markdown-content whitespace-normal">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSanitize]}
                            components={{
                              // Style code blocks
                              code: ({ node, inline, className, children, ...props }: any) => {
                                return inline ? (
                                  <code className="bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                                    {children}
                                  </code>
                                ) : (
                                  <code className="block bg-black/10 dark:bg-white/10 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              // Style links
                              a: ({ node, children, ...props }: any) => (
                                <a className="text-blue-500 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
                                  {children}
                                </a>
                              ),
                              // Style lists
                              ul: ({ node, children, ...props }: any) => (
                                <ul className="list-disc list-outside ml-4 my-2 space-y-1" {...props}>{children}</ul>
                              ),
                              ol: ({ node, children, ...props }: any) => (
                                <ol className="list-decimal list-outside ml-4 my-2 space-y-1" {...props}>{children}</ol>
                              ),
                              // Style headings
                              h1: ({ node, children, ...props }: any) => (
                                <h1 className="text-2xl font-bold mt-4 mb-2" {...props}>{children}</h1>
                              ),
                              h2: ({ node, children, ...props }: any) => (
                                <h2 className="text-xl font-bold mt-3 mb-2" {...props}>{children}</h2>
                              ),
                              h3: ({ node, children, ...props }: any) => (
                                <h3 className="text-lg font-bold mt-2 mb-1" {...props}>{children}</h3>
                              ),
                              // Style paragraphs
                              p: ({ node, children, ...props }: any) => (
                                <p className="mb-2 last:mb-0" {...props}>{children}</p>
                              ),
                              // Style blockquotes
                              blockquote: ({ node, children, ...props }: any) => (
                                <blockquote className="border-l-4 border-gray-300 dark:border-white/20 pl-4 italic my-2" {...props}>
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 text-[10px] opacity-40">
                            {msg.start !== undefined && msg.end !== undefined ? (
                              <span className="flex items-center gap-1">
                                <Icons.Timer className="w-3 h-3" />
                                {Math.floor(msg.start / 60)}:{(msg.start % 60).toFixed(0).padStart(2, '0')} - {Math.floor(msg.end / 60)}:{(msg.end % 60).toFixed(0).padStart(2, '0')}
                              </span>
                            ) : (
                              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                          <button
                            onClick={() => startEditingMessage(msg)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 dark:text-white/30 hover:text-gray-900 dark:hover:text-white"
                            title="Edit Message"
                          >
                            <Icons.Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-white/30 p-8">
                <Icons.MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>No transcript available.</p>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

        </div>
      </div>
    </div>
  );
};