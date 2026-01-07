
import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { AuthService, UserProfile } from '../services/auth';
import { ApiService } from '../services/api';


// --- SYNC MODAL ---

interface SyncModalProps {
    onClose: () => void;
    onSync: (startDate: Date, endDate: Date) => void;
    isLoading: boolean;
    syncProgress?: { message: string; progress: number };
}

export const SyncModal: React.FC<SyncModalProps> = ({ onClose, onSync, isLoading, syncProgress }) => {

    const handleSyncClick = () => {
        // Sync all data (last 365 days to cover everything)
        const end = new Date();
        const start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        end.setHours(23, 59, 59, 999);
        onSync(start, end);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />
            <div className="relative w-full max-w-md glass-panel bg-white dark:bg-[#1A1A1F] p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-900 dark:text-white">

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500 dark:text-blue-400">
                            <Icons.Sync className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </div>
                        <h3 className="text-lg font-semibold">Sync with Omi</h3>
                    </div>
                    {!isLoading && <button onClick={onClose} className="opacity-40 hover:opacity-100"><Icons.Close className="w-5 h-5" /></button>}
                </div>

                <div className="space-y-4">
                    {/* Progress Section - Show when syncing */}
                    {isLoading && syncProgress && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-white/70">{syncProgress.message}</span>
                                <span className="font-mono text-xs text-gray-500 dark:text-white/50">{Math.round(syncProgress.progress)}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                                    style={{ width: `${syncProgress.progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Content - Hide when syncing */}
                    {!isLoading && (
                        <>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                This will sync all your <strong>conversations</strong>, <strong>memories</strong>, and <strong>tasks</strong> from your Omi account.
                            </p>

                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3">
                                <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                                    <Icons.Alert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>The sync process may take a few minutes depending on the amount of data. Please wait until it completes.</span>
                                </p>
                            </div>

                            <button
                                onClick={handleSyncClick}
                                className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <Icons.Sync className="w-5 h-5" />
                                Sync All Data
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- SETTINGS MODAL ---

interface SettingsModalProps {
    onClose: () => void;
    onThemeChange: (theme: 'light' | 'dark') => void;
    currentTheme: 'light' | 'dark';
    user: UserProfile;
    onRefreshData?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onThemeChange, currentTheme, user, onRefreshData }) => {
    const [token, setToken] = useState('');
    const [saved, setSaved] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState<string | null>(null);


    useEffect(() => {
        if (user && user.omiToken) {
            setToken(user.omiToken);
        }
    }, [user]);

    const handleSave = async () => {
        if (user.uid) {
            await AuthService.updateOmiToken(user.uid, token);
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
            }, 800);
        }
    };

    const handleGenerateDummy = async () => {
        setIsGenerating(true);
        try {
            await ApiService.generateDummyData();
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
            if (onRefreshData) onRefreshData();
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = async (format: 'json' | 'markdown') => {
        setIsExporting(true);
        setExportSuccess(null);
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            if (format === 'json') {
                const jsonContent = await ApiService.exportAsJSON();
                ApiService.downloadFile(jsonContent, `omi-export-${timestamp}.json`, 'application/json');
                setExportSuccess('JSON');
            } else {
                const mdContent = await ApiService.exportAsMarkdown();
                ApiService.downloadFile(mdContent, `omi-export-${timestamp}.md`, 'text/markdown');
                setExportSuccess('Markdown');
            }
            setTimeout(() => setExportSuccess(null), 2000);
        } catch (e) {
            console.error('Export failed:', e);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-md glass-panel bg-white dark:bg-[#1A1A1F] p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-900 dark:text-white">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Settings</h3>
                        <button onClick={onClose} className="opacity-40 hover:opacity-100"><Icons.Close className="w-5 h-5" /></button>
                    </div>

                    <div className="space-y-6">

                        {/* Theme Switcher */}
                        <div>
                            <label className="block text-xs font-bold opacity-50 mb-3">Appearance</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => onThemeChange('light')}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${currentTheme === 'light' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-gray-100 dark:bg-white/5 border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <Icons.Sun className="w-5 h-5" />
                                    <span className="font-medium">Light</span>
                                </button>
                                <button
                                    onClick={() => onThemeChange('dark')}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${currentTheme === 'dark' ? 'bg-blue-500/10 border-blue-500 text-blue-400' : 'bg-gray-100 dark:bg-white/5 border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <Icons.Moon className="w-5 h-5" />
                                    <span className="font-medium">Dark</span>
                                </button>
                            </div>
                        </div>

                        {/* API Token Section */}
                        <div>
                            <label className="block text-xs font-bold opacity-50 mb-2">Omi API Token</label>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="omi_dev_..."
                                className="w-full bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono"
                            />
                            <p className="mt-2 text-xs opacity-40">
                                Get your token at <a href="https://docs.omi.me/doc/developer/api#key-management" target="_blank" rel="noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline inline-flex items-center gap-1">docs.omi.me <Icons.ExternalLink className="w-3 h-3" /></a>
                            </p>
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className={`px-4 py-2 text-sm rounded-lg font-medium transition-all flex items-center gap-2 ${saved ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-white/10 text-black dark:text-white hover:bg-gray-300 dark:hover:bg-white/20'}`
                                    }
                                >
                                    {saved ? <><Icons.CheckCircle className="w-3 h-3" /> Saved</> : 'Save Token'}
                                </button>
                            </div>
                        </div>

                        {/* Timezone Section */}
                        <div>
                            <label className="block text-xs font-bold opacity-50 mb-2">Timezone</label>
                            <select
                                value={user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                                onChange={async (e) => {
                                    if (user.uid) await AuthService.updateTimezone(user.uid, e.target.value);
                                }}
                                className="w-full bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                            >
                                {[
                                    "UTC",
                                    "America/New_York",
                                    "America/Los_Angeles",
                                    "America/Chicago",
                                    "Europe/London",
                                    "Europe/Paris",
                                    "Europe/Berlin",
                                    "Asia/Tokyo",
                                    "Asia/Shanghai",
                                    "Australia/Sydney",
                                    "Pacific/Auckland",
                                    "Asia/Dubai",
                                    "Asia/Singapore",
                                    "America/Sao_Paulo"
                                ].map((tz) => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                            <p className="mt-2 text-xs opacity-40">
                                Used for syncing Memories correctly.
                            </p>
                        </div>

                        {/* Export Data */}
                        <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                            <label className="block text-xs font-bold opacity-50 mb-2">Export Data</label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Download all your data as an archive. JSON is machine-readable for importing into other apps. Markdown is human-readable.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleExport('json')}
                                    disabled={isExporting}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                                        exportSuccess === 'JSON'
                                            ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400'
                                            : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <Icons.FileJson className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {exportSuccess === 'JSON' ? 'Downloaded!' : isExporting ? '...' : 'JSON'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => handleExport('markdown')}
                                    disabled={isExporting}
                                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                                        exportSuccess === 'Markdown'
                                            ? 'bg-green-500/10 border-green-500 text-green-600 dark:text-green-400'
                                            : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <Icons.FileCode className="w-4 h-4" />
                                    <span className="text-sm font-medium">
                                        {exportSuccess === 'Markdown' ? 'Downloaded!' : isExporting ? '...' : 'Markdown'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Developer Tools */}
                        <div className="pt-4 border-t border-gray-200 dark:border-white/5">
                            <label className="block text-xs font-bold opacity-50 mb-3">Developer Tools</label>
                            <div className="space-y-2">
                                <button
                                    onClick={handleGenerateDummy}
                                    disabled={isGenerating}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-all"
                                >
                                    <Icons.Database className="w-4 h-4" />
                                    {isGenerating ? 'Generating...' : 'Generate Demo Data'}
                                </button>
                                <button
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to delete all conversations, memories, and tasks? This cannot be undone.')) {
                                            await ApiService.clearAllData();
                                            setSaved(true);
                                            setTimeout(() => setSaved(false), 1500);
                                            if (onRefreshData) onRefreshData();
                                        }
                                    }}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 transition-all"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                    Clear All Data
                                </button>
                            </div>
                        </div>


                    </div>
                </div>
            </div>


        </>
    );
};

// --- EDIT PROFILE MODAL ---

interface EditProfileModalProps {
    onClose: () => void;
    user: UserProfile;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose, user }) => {
    const [name, setName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) setName(user.displayName || '');
    }, [user]);

    const handleSave = async () => {
        await AuthService.updateProfile({ displayName: name });
        onClose();
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        setIsUploading(true);
        try {
            // Mock upload - just update photoURL to a local data URL for now or similar since we don't have backend storage
            // For this local version, we will just use a fake URL or not support it fully without backend.
            // But let's assume AuthService.updateProfile can handle it if we passed string.
            // Converting to Base64 to store in localStorage
            const reader = new FileReader();
            reader.onloadend = async () => {
                await AuthService.updateProfile({ photoURL: reader.result as string });
                setIsUploading(false);
            };
            reader.readAsDataURL(file);

        } catch (error: any) {
            console.error('Failed to upload photo:', error);
            alert('Failed to upload photo: ' + error.message);
            setIsUploading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await AuthService.deleteAccount(user.uid);
            // User will be logged out automatically after account deletion
        } catch (error: any) {
            console.error('Failed to delete account:', error);
            alert('Failed to delete account: ' + error.message);
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="relative w-full max-w-sm glass-panel bg-white dark:bg-[#1A1A1F] p-6 rounded-2xl animate-in fade-in zoom-in-95 duration-200 text-gray-900 dark:text-white">
                    <h3 className="text-lg font-semibold mb-6">Edit Profile</h3>

                    <div className="space-y-4">
                        {/* Profile Photo */}
                        <div className="flex flex-col items-center gap-3 mb-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-white dark:bg-[#1A1A1F] flex items-center justify-center overflow-hidden">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            <Icons.User className="w-10 h-10 opacity-50" />
                                        )}
                                    </div>
                                </div>
                                {isUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                        <Icons.Sync className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="text-sm text-blue-500 dark:text-blue-400 hover:underline disabled:opacity-50"
                            >
                                {isUploading ? 'Uploading...' : user.photoURL ? 'Change Photo' : 'Upload Photo'}
                            </button>
                        </div>

                        {/* Name Input */}
                        <div>
                            <label className="block text-xs font-bold opacity-50 mb-2">Display Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 flex justify-end gap-3">
                            <button onClick={onClose} className="opacity-50 hover:opacity-100 px-4 py-2">Cancel</button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                            >
                                Save
                            </button>
                        </div>

                        {/* Delete Account Section */}
                        <div className="pt-6 mt-6 border-t border-gray-200 dark:border-white/10">
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 dark:text-red-400 transition-colors text-sm font-medium"
                            >
                                <Icons.Trash className="w-4 h-4" />
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-red-200 dark:border-red-500/20 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-500/10">
                                <Icons.Alert className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Account?</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            This action cannot be undone. Your account and all associated data (conversations, memories, action items) will be permanently deleted from our servers.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 font-medium transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <Icons.Sync className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Forever'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};