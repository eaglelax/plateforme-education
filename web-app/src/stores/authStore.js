import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/api';

// Roles qui ne peuvent PAS se connecter via /login (doivent utiliser /admin/login)
const ADMIN_ROLES = ['ADMIN', 'GESTIONNAIRE_CONTENU', 'VALIDATEUR'];

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          const { data } = response.data;

          const token = data?.accessToken;
          const user = data?.utilisateur;

          if (!token) {
            throw new Error('Token non recu');
          }

          // Extraire et normaliser le role
          let role = typeof user?.role === 'object' ? user?.role?.libelle : user?.role;
          role = role ? String(role).trim().toUpperCase() : '';

          // Verifier que ce n'est PAS un compte admin/validateur/gestionnaire
          if (ADMIN_ROLES.includes(role)) {
            set({ isLoading: false });
            return {
              success: false,
              error: 'Ce compte est reserve a l\'administration. Veuillez utiliser la page de connexion administrateur (/admin/login).'
            };
          }

          // Sauvegarder immediatement dans localStorage
          localStorage.setItem('token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          let message = 'Erreur de connexion';
          if (!error.response) {
            message = 'Impossible de se connecter au serveur. Verifiez votre connexion.';
          } else {
            message = error.response?.data?.message || error.response?.data?.error || 'Identifiants incorrects';
          }
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          const { data: responseData } = response.data;

          const token = responseData?.accessToken;
          const user = responseData?.utilisateur;

          localStorage.setItem('token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erreur d\'inscription';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Synchroniser le token avec localStorage apres rehydratation
        if (state?.token) {
          localStorage.setItem('token', state.token);
        }
      },
    }
  )
);

export default useAuthStore;
