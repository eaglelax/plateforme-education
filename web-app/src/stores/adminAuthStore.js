import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/api';

const ADMIN_ROLES = ['ADMIN', 'GESTIONNAIRE_CONTENU', 'VALIDATEUR'];

const useAdminAuthStore = create(
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
          const responseData = response.data;

          const token = responseData.data?.accessToken || responseData.data?.token || responseData.accessToken || responseData.token;
          const user = responseData.data?.utilisateur || responseData.utilisateur;

          // Normaliser le role (trim + uppercase)
          let role = typeof user?.role === 'object' ? user?.role?.libelle : user?.role;
          role = role ? String(role).trim().toUpperCase() : '';

          if (!ADMIN_ROLES.includes(role)) {
            set({ isLoading: false });
            return {
              success: false,
              error: 'Acces refuse. Ce portail est reserve aux administrateurs, gestionnaires et validateurs.'
            };
          }

          localStorage.setItem('admin-token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } catch (error) {
          let message = 'Erreur de connexion';
          if (error.response?.data?.message) {
            message = error.response.data.message;
          } else if (error.message === 'Network Error') {
            message = 'Impossible de se connecter au serveur. Verifiez votre connexion.';
          }
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: () => {
        localStorage.removeItem('admin-token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),

      getRole: () => {
        const user = get().user;
        const role = typeof user?.role === 'object' ? user?.role?.libelle : user?.role;
        return role ? String(role).trim().toUpperCase() : '';
      },

      isAdmin: () => {
        return get().getRole() === 'ADMIN';
      },

      hasAccess: () => {
        return ADMIN_ROLES.includes(get().getRole());
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAdminAuthStore;
