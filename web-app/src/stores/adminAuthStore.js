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

          console.log('=== Admin Login Debug ===');
          console.log('Response:', response);
          console.log('ResponseData:', responseData);

          const token = responseData.data?.accessToken || responseData.data?.token || responseData.accessToken || responseData.token;
          const user = responseData.data?.utilisateur || responseData.utilisateur;

          console.log('Token:', token ? 'OK' : 'MISSING');
          console.log('User:', user);

          // Verifier que c'est un admin
          let role = typeof user?.role === 'object' ? user?.role?.libelle : user?.role;
          // Normaliser le role (trim + uppercase)
          role = role ? String(role).trim().toUpperCase() : '';

          console.log('Role extrait:', role);
          console.log('ADMIN_ROLES:', ADMIN_ROLES);
          console.log('Role inclus?:', ADMIN_ROLES.includes(role));

          if (!ADMIN_ROLES.includes(role)) {
            console.log('ACCES REFUSE - role non reconnu');
            set({ isLoading: false });
            return {
              success: false,
              error: 'Acces refuse. Ce portail est reserve aux administrateurs.'
            };
          }

          console.log('ACCES AUTORISE');

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
        return typeof user?.role === 'object' ? user?.role?.libelle : user?.role;
      },

      isAdmin: () => {
        const role = get().getRole();
        return role === 'ADMIN';
      },

      hasAccess: () => {
        const role = get().getRole();
        return ADMIN_ROLES.includes(role);
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
