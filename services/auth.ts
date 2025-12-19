// services/auth.ts - Local-only authentication service

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    omiToken?: string;
    timezone?: string;
}

const LOCAL_USER_KEY = 'omi_local_user';

// Default local user
const DEFAULT_USER: UserProfile = {
    uid: 'local-owner',
    email: 'local@omi.manager',
    displayName: 'My Omi',
    photoURL: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

export const AuthService = {
    // Get current user from localStorage or create default
    getCurrentUser: (): UserProfile => {
        try {
            const stored = localStorage.getItem(LOCAL_USER_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.uid) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error("Error reading local user:", e);
            localStorage.removeItem(LOCAL_USER_KEY);
        }

        // Create and save default user
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(DEFAULT_USER));
        return DEFAULT_USER;
    },

    // Auth state change listener (for compatibility)
    onAuthStateChanged: (callback: (user: UserProfile | null) => void): (() => void) => {
        const user = AuthService.getCurrentUser();
        // Call immediately with current user
        setTimeout(() => callback(user), 0);
        return () => { }; // Return empty unsubscribe function
    },

    // Update user profile
    updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
        const current = AuthService.getCurrentUser();
        const updated = { ...current, ...updates };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('local-user-update'));
        return updated;
    },

    // Update Omi API token
    updateOmiToken: async (uid: string, token: string): Promise<void> => {
        await AuthService.updateProfile({ omiToken: token });
    },

    // Update timezone
    updateTimezone: async (uid: string, timezone: string): Promise<void> => {
        await AuthService.updateProfile({ timezone });
    },

    // Delete account (clears local data)
    deleteAccount: async (uid: string): Promise<void> => {
        localStorage.removeItem(LOCAL_USER_KEY);
        window.location.reload();
    },

    // Logout (just reloads the page for local app)
    logout: async (): Promise<void> => {
        window.location.reload();
    }
};
