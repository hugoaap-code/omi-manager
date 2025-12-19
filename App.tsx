import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Icons } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { ChatCard } from './components/ChatCard';
import { ChatListItem } from './components/ChatListItem';
import { MemoriesPage } from './components/MemoriesPage';
import { ActionItemsPage } from './components/ActionItemsPage';
import { ConversationsPage } from './components/ConversationsPage';
import { DashboardPage } from './components/DashboardPage';
import { ChatModal } from './components/ChatModal';
import { FolderModal, MoveToFolderModal, DeleteFolderModal } from './components/FolderModals';
import { SyncModal, SettingsModal, EditProfileModal } from './components/SettingsModals';
import { OnboardingModal } from './components/OnboardingModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ApiService } from './services/api';
import { AuthService, UserProfile } from './services/auth';
import { Chat, ChatStatus, Folder, Memory, ActionItem, ChatFilterType, AppContextType } from './types';
import { useDebounce } from './hooks/usePerformance';

// Toast Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-500/90 dark:bg-green-500/20 text-white dark:text-green-200 border-green-500/50',
    error: 'bg-red-500/90 dark:bg-red-500/20 text-white dark:text-red-200 border-red-500/50',
    info: 'bg-blue-500/90 dark:bg-blue-500/20 text-white dark:text-blue-200 border-blue-500/50',
  };

  const icons = {
    success: Icons.CheckCircle,
    error: Icons.Alert,
    info: Icons.Sparkles
  };

  const Icon = icons[type];

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl animate-in slide-in-from-top-5 fade-in duration-300 ${bgColors[type]}`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><Icons.Close className="w-4 h-4" /></button>
    </div>
  );
};

// Background Component
const Background = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-gray-50 dark:bg-[#050505]">
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-900/10 blur-[120px]" />
    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-900/10 blur-[120px]" />
  </div>
);

// Main App Component
const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // --- App State ---
  const [chats, setChats] = useState<Chat[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ message: string; progress: number } | undefined>(undefined);

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Notifications
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  const [activeContext, setActiveContext] = useState<AppContextType>('dashboard');
  const [activeFilter, setActiveFilter] = useState<ChatFilterType>('all');
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('');

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // View & Date Filter State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dateFilterStart, setDateFilterStart] = useState<string>('');
  const [dateFilterEnd, setDateFilterEnd] = useState<string>('');

  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modal State
  const [viewingChat, setViewingChat] = useState<Chat | null>(null);
  const [showFolderModal, setShowFolderModal] = useState<'create' | 'edit' | null>(null);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [chatToMove, setChatToMove] = useState<Chat | null>(null);

  // Infinite Scroll
  const [visibleChatsCount, setVisibleChatsCount] = useState(30);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // --- Helper: Show Toast ---
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  // --- Effects ---

  // 1. Initialize Theme & Auth
  useEffect(() => {
    // Theme
    const storedTheme = localStorage.getItem('limitless_theme') as 'light' | 'dark';
    if (storedTheme) {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Auth - Get local user
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setIsAuthChecking(false);

    // Listen for local user updates
    const handleLocalUpdate = () => {
      setUser(AuthService.getCurrentUser());
    };
    window.addEventListener('local-user-update', handleLocalUpdate);

    // Global keyboard shortcut for search (Ctrl+K or Cmd+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('local-user-update', handleLocalUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('limitless_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // 2. Load Data Function
  const refreshData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [fetchedChats, fetchedMemories, fetchedActions, fetchedChatFolders, fetchedMemFolders, fetchedActionFolders] = await Promise.all([
        ApiService.getChats(),
        ApiService.getMemories(),
        ApiService.getActionItems(),
        ApiService.getFolders('chat'),
        ApiService.getFolders('memory'),
        ApiService.getFolders('action_item')
      ]);
      setChats(fetchedChats);
      setMemories(fetchedMemories);
      setActionItems(fetchedActions);

      const allFolders = [...fetchedChatFolders, ...fetchedMemFolders, ...fetchedActionFolders];
      setFolders(allFolders);

    } catch (error) {
      console.error("Failed to load data", error);
      showToast("Failed to load data", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 3. Trigger Load Data on User Change
  useEffect(() => {
    if (!user) {
      setChats([]);
      setMemories([]);
      setActionItems([]);
      setFolders([]);
      return;
    }
    refreshData();
  }, [user, refreshData]);

  // 4. Show Onboarding if user has no token
  useEffect(() => {
    if (user && !user.omiToken) {
      const hasSeenOnboarding = localStorage.getItem('limitless_onboarding_seen');
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('limitless_onboarding_seen', 'true');
  };

  // --- Derived State ---
  const filteredChats = useMemo(() => {
    let result = chats;

    switch (activeFilter) {
      case 'all':
        result = result.filter((c: Chat) => c.status === ChatStatus.ACTIVE);
        break;
      case 'favorites':
        result = result.filter((c: Chat) => c.isFavorite && c.status !== ChatStatus.DELETED);
        break;
      case 'archived':
        result = result.filter((c: Chat) => c.status === ChatStatus.ARCHIVED);
        break;
      case 'folder':
        if (activeFolderId) {
          result = result.filter((c: Chat) => c.folderId === activeFolderId && c.status !== ChatStatus.DELETED);
        }
        break;
    }

    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      result = result.filter((c: Chat) =>
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.tags.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    return result.sort((a: Chat, b: Chat) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [chats, activeFilter, activeFolderId, debouncedSearchQuery]);

  // --- Handlers ---

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      showToast('Logged out successfully', 'info');
    } catch (e) {
      showToast('Error logging out', 'error');
    }
  };

  const handleFilterChange = (type: ChatFilterType, folderId?: string) => {
    setActiveFilter(type);
    setActiveFolderId(folderId);
    setSelectedChatIds(new Set());
    setIsSidebarOpen(false);
  };

  const toggleSelectChat = (id: string) => {
    const newSet = new Set(selectedChatIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedChatIds(newSet);
  };

  const handleOpenChat = (chat: Chat) => {
    setViewingChat(chat);
  };

  const toggleFavorite = async (id: string, current: boolean) => {
    setChats((prev: Chat[]) => prev.map((c: Chat) => c.id === id ? { ...c, isFavorite: !current } : c));
    if (viewingChat && viewingChat.id === id) {
      setViewingChat((prev: Chat | null) => prev ? ({ ...prev, isFavorite: !current }) : null);
    }
    await ApiService.updateChat(id, { isFavorite: !current });
  };

  const handleUpdateChat = async (id: string, updates: Partial<Chat>) => {
    setChats((prev: Chat[]) => prev.map((c: Chat) => c.id === id ? { ...c, ...updates } : c));
    if (viewingChat && viewingChat.id === id) {
      setViewingChat((prev: Chat | null) => prev ? ({ ...prev, ...updates }) : null);
    }
    await ApiService.updateChat(id, updates);
  };

  const handleUpdateActionItem = async (id: string, updates: Partial<ActionItem>) => {
    setActionItems((prev: ActionItem[]) => prev.map((a: ActionItem) => a.id === id ? { ...a, ...updates } : a));
    await ApiService.updateActionItem(id, updates);
  };

  // --- Folder Actions ---
  const handleSaveFolder = async (name: string, color: string) => {
    if (showFolderModal === 'create') {
      let type: 'chat' | 'memory' | 'action_item' = 'chat';
      if (activeContext === 'memories') type = 'memory';
      if (activeContext === 'action_items') type = 'action_item';

      const newFolder = await ApiService.createFolder(name, type);
      setFolders((prev: Folder[]) => [...prev, newFolder]);
      showToast('Folder created', 'success');
    } else if (showFolderModal === 'edit' && folderToEdit) {
      try {
        const updated = await ApiService.updateFolder(folderToEdit.id, { name, color });
        setFolders((prev: Folder[]) => prev.map((f: Folder) => f.id === folderToEdit.id ? updated : f));
        showToast('Folder updated', 'success');
      } catch (error) {
        showToast('Failed to update folder', 'error');
      }
    }
    setShowFolderModal(null);
    setFolderToEdit(null);
  };

  const initiateEditFolder = (folder: Folder) => {
    setFolderToEdit(folder);
    setShowFolderModal('edit');
  };

  const initiateDeleteFolder = (id: string) => {
    const folder = folders.find((f: Folder) => f.id === id);
    if (folder) setFolderToDelete(folder);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    const id = folderToDelete.id;

    setFolders((prev: Folder[]) => prev.filter((f: Folder) => f.id !== id));

    if (activeFilter === 'folder' && activeFolderId === id) {
      handleFilterChange('all');
    }
    // Remove from chats/memories
    setChats((prev: Chat[]) => prev.map((c: Chat) => c.folderId === id ? { ...c, folderId: undefined } : c));
    setMemories((prev: Memory[]) => prev.map((m: Memory) => m.folderId === id ? { ...m, folderId: undefined } : m));

    setFolderToDelete(null);
    showToast('Folder deleted', 'success');
    await ApiService.deleteFolder(id);
  };

  const initiateMove = (chat?: Chat) => {
    if (chat) {
      setChatToMove(chat);
    } else {
      setChatToMove(null);
    }
    setShowMoveModal(true);
  };

  const handleMoveChats = async (targetFolderId: string | undefined) => {
    setShowMoveModal(false);
    let idsToMove: string[] = [];

    if (chatToMove) {
      idsToMove = [chatToMove.id];
      setViewingChat((prev: Chat | null) => prev ? { ...prev, folderId: targetFolderId } : null);
    } else {
      idsToMove = Array.from(selectedChatIds) as string[];
      setSelectedChatIds(new Set());
    }
    setChats((prev: Chat[]) => prev.map((c: Chat) => idsToMove.includes(c.id) ? { ...c, folderId: targetFolderId } : c));
    showToast(targetFolderId ? 'Moved to folder' : 'Removed from folder', 'success');
    await ApiService.moveChatsToFolder(idsToMove, targetFolderId);
    setChatToMove(null);
  };

  // --- Sync Logic ---
  const handleSync = async (startDate: Date, endDate: Date) => {
    const token = user?.omiToken;

    if (!token || token.trim() === '') {
      setShowSyncModal(false);
      showToast("No Omi API Token found. Please check your Settings.", 'error');
      setShowSettingsModal(true);
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ message: 'Initializing sync...', progress: 0 });

    try {
      setSyncProgress({ message: 'Connecting to Omi API...', progress: 10 });
      await new Promise(resolve => setTimeout(resolve, 300));

      const { conversations, memories: memCount, actionItems: acCount } = await ApiService.syncWithOmi(token);

      setSyncProgress({ message: 'Updating local data...', progress: 80 });
      await refreshData();

      setSyncProgress({ message: 'Sync complete', progress: 100 });
      await new Promise(resolve => setTimeout(resolve, 500));

      setShowSyncModal(false);
      showToast(`Synced: ${conversations} chats, ${memCount} memories, ${acCount} tasks.`, 'success');

    } catch (error: any) {
      console.error("Sync failed", error);
      showToast("Failed to sync: " + error.message, 'error');
    } finally {
      setIsSyncing(false);
      setSyncProgress(undefined);
    }
  };

  // --- Render ---
  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050505] text-white">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050505] text-white">
        <p>Loading user...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500/30">
      <Background />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modals */}
      {viewingChat && (
        <ChatModal
          chat={viewingChat}
          allChats={filteredChats}
          folders={folders.filter((f: Folder) => f.type === 'chat')}
          onClose={() => setViewingChat(null)}
          onNavigate={(chat: Chat) => setViewingChat(chat)}
          onToggleFavorite={toggleFavorite}
          onStatusChange={async (id: string, s: ChatStatus) => {
            setChats((prev: Chat[]) => prev.map((c: Chat) => c.id === id ? { ...c, status: s } : c));
            await ApiService.updateChat(id, { status: s });
          }}
          onUpdateChat={handleUpdateChat}
          onMoveToFolder={initiateMove}
        />
      )}

      {showFolderModal && (
        <FolderModal
          mode={showFolderModal}
          initialName={showFolderModal === 'edit' ? folderToEdit?.name : ''}
          initialColor={showFolderModal === 'edit' ? folderToEdit?.color : undefined}
          onClose={() => { setShowFolderModal(null); setFolderToEdit(null); }}
          onSubmit={handleSaveFolder}
        />
      )}

      {showMoveModal && (
        <MoveToFolderModal
          folders={folders.filter((f: Folder) => f.type === 'chat')}
          onClose={() => setShowMoveModal(false)}
          onSelect={handleMoveChats}
        />
      )}

      {showSyncModal && (
        <SyncModal
          onClose={() => setShowSyncModal(false)}
          onSync={handleSync}
          isLoading={isSyncing}
          syncProgress={syncProgress}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          user={user}
          onRefreshData={refreshData}
        />
      )}

      {showEditProfileModal && (
        <EditProfileModal onClose={() => setShowEditProfileModal(false)} user={user} />
      )}

      {showOnboarding && (
        <OnboardingModal
          onClose={handleCloseOnboarding}
          onOpenSettings={() => {
            handleCloseOnboarding();
            setShowSettingsModal(true);
          }}
        />
      )}

      {folderToDelete && (
        <DeleteFolderModal
          folderName={folderToDelete.name}
          onClose={() => setFolderToDelete(null)}
          onConfirm={confirmDeleteFolder}
        />
      )}

      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        chats={chats}
        memories={memories}
        actionItems={actionItems}
        onOpenChat={handleOpenChat}
        onNavigateToMemories={() => setActiveContext('memories')}
        onNavigateToActionItems={() => setActiveContext('action_items')}
        onNavigateToConversations={() => setActiveContext('conversations')}
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        activeContext={activeContext}
        onContextChange={setActiveContext}
        activeFilter={activeFilter}
        activeFolderId={activeFolderId}
        folders={folders}
        onFilterChange={handleFilterChange}
        onCreateFolder={() => setShowFolderModal('create')}
        onDeleteFolder={initiateDeleteFolder}
        onEditFolder={initiateEditFolder}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenEditProfile={() => setShowEditProfileModal(true)}
        onOpenGuide={() => setShowOnboarding(true)}
        onOpenSearch={() => setShowSearchModal(true)}
        onSync={() => setShowSyncModal(true)}
        onLogout={handleLogout}
        user={user}
        onMobileClose={() => setIsSidebarOpen(false)}
        className={`
           md:translate-x-0 transition-transform duration-300 ease-in-out
           ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
           border-r border-gray-200 dark:border-white/5
        `}
      />

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden flex flex-col relative">

        {/* Dashboard Layer */}
        {activeContext === 'dashboard' && (
          <DashboardPage
            user={user}
            chats={chats}
            lifelogs={memories.slice(0, 5)}
            actionItems={actionItems}
            totalChats={chats.length}
            totalMemories={memories.length}
            totalActionItems={actionItems.length}
            lifelogFolders={folders.filter((f: Folder) => f.type === 'memory')}
            onNavigate={(ctx: AppContextType) => setActiveContext(ctx)}
            onOpenChat={handleOpenChat}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        )}

        {/* Action Items Layer */}
        {activeContext === 'action_items' && (
          <ActionItemsPage
            actionItems={actionItems}
            folders={folders.filter((f: Folder) => f.type === 'action_item')}
            activeFolderId={activeFilter === 'folder' ? activeFolderId : undefined}
            onUpdateActionItem={handleUpdateActionItem}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onRefresh={refreshData}
          />
        )}

        {/* Memories Layer */}
        {activeContext === 'memories' && (
          <MemoriesPage
            memories={memories}
            folders={folders.filter((f: Folder) => f.type === 'memory')}
            activeFilter={activeFilter}
            activeFolderId={activeFilter === 'folder' ? activeFolderId : undefined}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onRefresh={refreshData}
          />
        )}

        {/* Conversations Layer */}
        {activeContext === 'conversations' && (
          <ConversationsPage
            chats={chats}
            folders={folders.filter((f: Folder) => f.type === 'chat' || !f.type)}
            activeFilter={activeFilter}
            activeFolderId={activeFilter === 'folder' ? activeFolderId : undefined}
            onOpenChat={handleOpenChat}
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onToggleFavorite={toggleFavorite}
            onMoveToFolder={(chatId: string) => {
              const chat = chats.find((c: Chat) => c.id === chatId);
              if (chat) initiateMove(chat);
            }}
            onArchive={async (chatId: string) => {
              await handleUpdateChat(chatId, { status: ChatStatus.ARCHIVED });
              showToast('Conversation archived', 'info');
            }}
            onUpdateChat={handleUpdateChat}
            onRefresh={refreshData}
          />
        )}

      </div>
    </div>
  );
};

export default App;