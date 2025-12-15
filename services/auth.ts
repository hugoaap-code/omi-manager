
export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    omiToken?: string;
    timezone?: string;
}

const listeners: ((user: UserProfile | null) => void)[] = [];

const notifyListeners = (user: UserProfile | null) => {
    listeners.forEach(callback => callback(user));
};

export const AuthService = {
    onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
        const storedUser = localStorage.getItem('local_user');
        if (storedUser) {
            callback(JSON.parse(storedUser));
        } else {
            callback(null);
        }

        listeners.push(callback);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) listeners.splice(index, 1);
        };
    },

    login: async (email: string, password: string): Promise<UserProfile> => {
        if (!email || !password) throw new Error("Email and password required");

        const user: UserProfile = {
            uid: 'local-user-' + email,
            email: email,
            displayName: email.split('@')[0],
            photoURL: null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        localStorage.setItem('local_user', JSON.stringify(user));
        notifyListeners(user);
        return user;
    },

    signup: async (name: string, email: string, password: string): Promise<UserProfile> => {
        if (!email || !password) throw new Error("Email and password required");
        const user: UserProfile = {
            uid: 'local-user-' + email,
            email: email,
            displayName: name,
            photoURL: null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        localStorage.setItem('local_user', JSON.stringify(user));
        notifyListeners(user);
        return user;
    },

    recoverPassword: async (email: string): Promise<void> => {
        // Mock recovery
        return;
    },

    logout: async (): Promise<void> => {
        localStorage.removeItem('local_user');
        notifyListeners(null);
        window.location.reload();
    },

    updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
        const stored = localStorage.getItem('local_user');
        if (stored) {
            const user = JSON.parse(stored);
            const updated = { ...user, ...updates };
            localStorage.setItem('local_user', JSON.stringify(updated));
            notifyListeners(updated);
            return updated;
        }
        throw new Error("No user logged in");
    },

    updateOmiToken: async (uid: string, token: string): Promise<void> => {
        const stored = localStorage.getItem('local_user');
        if (stored) {
            const user = JSON.parse(stored);
            const updated = { ...user, omiToken: token };
            localStorage.setItem('local_user', JSON.stringify(updated));
            notifyListeners(updated);
        }
    },

    updateTimezone: async (uid: string, timezone: string): Promise<void> => {
        const stored = localStorage.getItem('local_user');
        if (stored) {
            const user = JSON.parse(stored);
            const updated = { ...user, timezone };
            localStorage.setItem('local_user', JSON.stringify(updated));
            notifyListeners(updated);
        }
    },

    deleteAccount: async (uid: string): Promise<void> => {
        localStorage.removeItem('local_user');
        notifyListeners(null);
        window.location.reload();
    }
};
