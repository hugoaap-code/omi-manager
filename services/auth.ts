
export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    omiToken?: string;
    timezone?: string;
}

// Chave para armazenar configurações do usuário local
const LOCAL_USER_KEY = 'omi_local_user_settings';

export const AuthService = {
    // Retorna o usuário local atual ou cria um novo se não existir
    getCurrentUser: (): UserProfile => {
        const stored = localStorage.getItem(LOCAL_USER_KEY);
        if (stored) {
            return JSON.parse(stored);
        }

        // Criar usuário padrão inicial
        const defaultUser: UserProfile = {
            uid: 'local-owner', // ID fixo para app single-user
            email: 'local@omi.manager', // Placeholder visual
            displayName: 'My Omi',
            photoURL: null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(defaultUser));
        return defaultUser;
    },

    // Apenas para compatibilidade com hooks existentes, retorna o usuário imediatamente
    onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
        const user = AuthService.getCurrentUser();
        callback(user);
        return () => {}; // Unsubscribe mock
    },

    updateProfile: async (updates: Partial<UserProfile>): Promise<UserProfile> => {
        const currentUser = AuthService.getCurrentUser();
        const updated = { ...currentUser, ...updates };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));
        
        // Disparar evento de storage para atualizar em outras abas/componentes se necessário
        window.dispatchEvent(new Event('local-user-update'));
        return updated;
    },

    updateOmiToken: async (token: string): Promise<void> => {
        return await AuthService.updateProfile({ omiToken: token }) as any;
    },

    // Logout reseta para o estado padrão (opcional, mas útil para "limpar" configurações)
    logout: async (): Promise<void> => {
        // Em app local sem login, "logout" não faz muito sentido, 
        // mas podemos usar para recarregar a página
        window.location.reload();
    }
};
