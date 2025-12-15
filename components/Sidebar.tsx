
import React, { useState, useRef, useEffect } from 'react';
import { Folder, ChatFilterType, AppContextType } from '../types';
import { Icons } from './Icons';
import { UserProfile } from '../services/auth';

interface SidebarProps {
  activeContext: AppContextType;
  onContextChange: (context: AppContextType) => void;
  activeFilter: ChatFilterType;
  activeFolderId?: string;
  folders: Folder[];
  onFilterChange: (type: ChatFilterType, folderId?: string) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (id: string) => void;
  onEditFolder: (folder: Folder) => void;
  onOpenSettings: () => void;
  onOpenEditProfile: () => void;
  onOpenGuide?: () => void;
  onOpenSearch?: () => void;
  onLogout: () => void;
  user: UserProfile | null;
  className?: string;
  onMobileClose?: () => void;
}

const NavItem = ({
  icon: Icon,
  label,
  isActive,
  onClick,
  colorClass = 'text-gray-600 dark:text-white/70'
}: { icon: any, label: string, isActive: boolean, onClick: () => void, colorClass?: string }) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
      group mb-1
      ${isActive
        ? 'bg-white/80 dark:bg-white/10 text-blue-600 dark:text-white shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-gray-200 dark:border-white/5'
        : 'text-gray-500 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
      }
    `}
  >
    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-500 dark:text-blue-400' : colorClass} group-hover:text-gray-900 dark:group-hover:text-white`} />
    <span className="font-medium text-sm tracking-wide truncate">{label}</span>
    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />}
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeContext,
  onContextChange,
  activeFilter,
  activeFolderId,
  folders,
  onFilterChange,
  onCreateFolder,
  onDeleteFolder,
  onEditFolder,
  onOpenSettings,
  onOpenEditProfile,
  onOpenGuide,
  onOpenSearch,
  onLogout,
  user,
  className = '',
  onMobileClose
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <aside className={`glass-panel flex flex-col w-72 h-full p-4 md:relative fixed z-40 transition-transform ${className}`}>

      {/* Logo / Brand */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg">O</span>
          </div>
          <h1 className="text-lg font-bold whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-white/50">
            Omi Manager
          </h1>
        </div>
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Global Search (Ctrl+K)"
          >
            <Icons.Search className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Context Switcher - Tabs */}
      <div className="flex items-center gap-2 pb-6 px-2">
        <button
          onClick={() => {
            onContextChange('dashboard');
            onMobileClose?.();
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all border ${activeContext === 'dashboard'
            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
            : 'bg-white/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-transparent hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
            }`}
          title="Dashboard"
        >
          <Icons.Grid className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Dash</span>
        </button>

        <button
          onClick={() => {
            onContextChange('conversations');
            onMobileClose?.();
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all border ${activeContext === 'conversations'
            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
            : 'bg-white/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-transparent hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
            }`}
          title="Conversations"
        >
          <Icons.MessageSquare className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Conv</span>
        </button>

        <button
          onClick={() => {
            onContextChange('action_items');
            onMobileClose?.();
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all border ${activeContext === 'action_items'
            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
            : 'bg-white/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-transparent hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
            }`}
          title="Action Items"
        >
          <Icons.CheckSquare className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Tasks</span>
        </button>

        <button
          onClick={() => {
            onContextChange('memories');
            onMobileClose?.();
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl transition-all border ${activeContext === 'memories'
            ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
            : 'bg-white/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-transparent hover:bg-white dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
            }`}
          title="Memories"
        >
          <Icons.Brain className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Mem</span>
        </button>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto">
        {activeContext === 'dashboard' ? (
          <>
            <div className="space-y-1 mb-6">
              <p className="px-4 text-xs font-bold text-gray-400 dark:text-white/20 uppercase tracking-widest mb-2">Shortcuts</p>
              <NavItem
                icon={Icons.MessageSquare}
                label="Conversations"
                isActive={false}
                onClick={() => onContextChange('conversations')}
              />
              <NavItem
                icon={Icons.CheckSquare}
                label="Action Items"
                isActive={false}
                onClick={() => onContextChange('action_items')}
              />
              <NavItem
                icon={Icons.Brain}
                label="Memories"
                isActive={false}
                onClick={() => onContextChange('memories')}
              />
            </div>
          </>
        ) : activeContext === 'conversations' ? (
          <>
            <div className="space-y-1 mb-8">
              <p className="px-4 text-xs font-bold text-gray-400 dark:text-white/20 uppercase tracking-widest mb-2">Conversations</p>
              <NavItem
                icon={Icons.Inbox}
                label="All Conversations"
                isActive={activeFilter === 'all'}
                onClick={() => onFilterChange('all')}
              />
              <NavItem
                icon={Icons.Star}
                label="Favorites"
                isActive={activeFilter === 'favorites'}
                onClick={() => onFilterChange('favorites')}
              />
              <NavItem
                icon={Icons.Archive}
                label="Archived"
                isActive={activeFilter === 'archived'}
                onClick={() => onFilterChange('archived')}
              />
            </div>
          </>
        ) : activeContext === 'action_items' ? (
          <>
            <div className="space-y-1 mb-8">
              <p className="px-4 text-xs font-bold text-gray-400 dark:text-white/20 uppercase tracking-widest mb-2">Action Items</p>
              <NavItem
                icon={Icons.List}
                label="All Tasks"
                isActive={activeFilter === 'all'}
                onClick={() => onFilterChange('all')}
              />
              <NavItem
                icon={Icons.CheckCircle}
                label="Completed"
                isActive={activeFilter === 'archived'}
                onClick={() => onFilterChange('archived')}
              />
            </div>
          </>
        ) : (
          /* Memories Navigation */
          <>
            <div className="space-y-1">
              <p className="px-4 text-xs font-bold text-gray-400 dark:text-white/20 uppercase tracking-widest mb-2">Memories</p>
              <NavItem
                icon={Icons.LayoutList}
                label="All Memories"
                isActive={activeFilter === 'all'}
                onClick={() => onFilterChange('all')}
              />
              <NavItem
                icon={Icons.Search}
                label="Search"
                isActive={activeFilter === 'memories'}
                onClick={() => onFilterChange('memories', undefined)}
              />
              <NavItem
                icon={Icons.Star}
                label="Favorites"
                isActive={activeFilter === 'favorites'}
                onClick={() => onFilterChange('favorites')}
              />
            </div>
          </>
        )}

        {/* Folders (Common) */}
        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between px-4 mb-2 group">
            <p className="text-xs font-bold text-gray-400 dark:text-white/20 uppercase tracking-widest">Folders</p>
            <button
              onClick={onCreateFolder}
              className="text-gray-400 dark:text-white/20 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
              title="Create Folder"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="space-y-1">
          {folders.map(folder => (
            <div key={folder.id} className="relative group">
              <NavItem
                icon={Icons.Folder}
                label={folder.name}
                isActive={activeFilter === 'folder' && activeFolderId === folder.id}
                onClick={() => onFilterChange('folder', folder.id)}
                colorClass={folder.color || 'text-gray-500 dark:text-white/50'}
              />

              {/* Edit/Delete Actions */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}
                  className="p-1.5 text-gray-400 dark:text-white/20 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                  title="Edit Folder"
                >
                  <Icons.Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                  className="p-1.5 text-gray-400 dark:text-white/20 hover:text-red-500 dark:hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-md"
                  title="Delete Folder"
                >
                  <Icons.Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {folders.length === 0 && (
            <div className="px-4 py-4 text-center text-gray-400 dark:text-white/20 text-xs">
              No folders yet
            </div>
          )}
        </div>
      </div>

      {/* User / Settings Footer */}
      <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/5 relative" ref={userMenuRef}>
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${isUserMenuOpen ? 'bg-black/5 dark:bg-white/5' : ''}`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 p-[1.5px]">
            <div className="w-full h-full rounded-full bg-white dark:bg-[#1A1A1F] overflow-hidden flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <Icons.User className="w-4 h-4 text-gray-400 dark:text-white/30" />
              )}
            </div>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.displayName || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-white/40">{user?.email}</p>
          </div>
          <Icons.Settings className={`w-4 h-4 text-gray-400 dark:text-white/30 transition-transform ${isUserMenuOpen ? 'rotate-90 text-gray-900 dark:text-white' : ''}`} />
        </button>

        {/* Popover Menu */}
        {isUserMenuOpen && (
          <div className="absolute bottom-full left-0 w-full mb-2 p-1 rounded-xl glass-panel bg-white dark:bg-[#1A1A1F] shadow-2xl animate-in fade-in slide-in-from-bottom-2 border border-gray-200 dark:border-white/10">
            <button
              onClick={() => { onOpenEditProfile(); setIsUserMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors text-sm text-left"
            >
              <Icons.UserEdit className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={() => { onOpenSettings(); setIsUserMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors text-sm text-left"
            >
              <Icons.Settings className="w-4 h-4" />
              Settings
            </button>
            {onOpenGuide && (
              <button
                onClick={() => { onOpenGuide(); setIsUserMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors text-sm text-left"
              >
                <Icons.Sparkles className="w-4 h-4" />
                Help Guide
              </button>
            )}
            <div className="h-[1px] bg-gray-200 dark:bg-white/10 my-1" />
            <button
              onClick={() => { setIsUserMenuOpen(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500/70 dark:text-red-400/70 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors text-sm text-left"
            >
              <Icons.LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
