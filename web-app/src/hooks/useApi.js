import { useState, useCallback } from 'react';

/**
 * Hook personnalise pour gerer les appels API avec etats de chargement et erreurs
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiCall, options = {}) => {
    const { onSuccess, onError, showError = true } = options;

    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();
      const data = response.data?.data || response.data || [];

      if (onSuccess) {
        onSuccess(data);
      }

      return { success: true, data };
    } catch (err) {
      let message = 'Une erreur est survenue';

      if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message === 'Network Error') {
        message = 'Impossible de se connecter au serveur';
      } else if (err.response?.status === 401) {
        message = 'Session expiree. Veuillez vous reconnecter.';
      } else if (err.response?.status === 403) {
        message = 'Acces non autorise';
      } else if (err.response?.status === 404) {
        message = 'Ressource non trouvee';
      } else if (err.response?.status >= 500) {
        message = 'Erreur serveur. Veuillez reessayer plus tard.';
      }

      if (showError) {
        setError(message);
      }

      if (onError) {
        onError(message, err);
      }

      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, execute, clearError };
}

/**
 * Donnees de demonstration pour le mode hors-ligne ou erreurs API
 */
export const DEMO_DATA = {
  enfants: [
    {
      id: 'demo-1',
      nomPseudo: 'Amadou',
      age: 8,
      codeConnexion: 'ENF-DEMO01',
      trancheAgeMin: 6,
      trancheAgeMax: 8,
    },
    {
      id: 'demo-2',
      nomPseudo: 'Fatou',
      age: 6,
      codeConnexion: 'ENF-DEMO02',
      trancheAgeMin: 6,
      trancheAgeMax: 8,
    },
  ],

  abonnements: [
    {
      id: 'demo-abo-1',
      statut: 'ACTIF',
      dateDebut: new Date().toISOString(),
      dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      typeAbonnement: { nom: 'Standard', prix: 2000 },
    },
  ],

  typesAbonnement: [
    {
      id: 'type-1',
      nom: 'Decouverte',
      description: 'Acces limite pour decouvrir la plateforme',
      dureeJours: 30,
      prix: 500,
    },
    {
      id: 'type-2',
      nom: 'Standard',
      description: 'Acces complet a tous les domaines',
      dureeJours: 30,
      prix: 2000,
    },
    {
      id: 'type-3',
      nom: 'Premium Annuel',
      description: 'Abonnement annuel avec 2 mois offerts',
      dureeJours: 365,
      prix: 20000,
    },
  ],

  domaines: [
    { id: 'dom-1', nom: 'Lecture', description: 'Apprentissage de la lecture', icone: '📚' },
    { id: 'dom-2', nom: 'Mathematiques', description: 'Calcul et logique', icone: '🧮' },
    { id: 'dom-3', nom: 'Sciences', description: 'Decouverte du monde', icone: '🔬' },
    { id: 'dom-4', nom: 'Histoire-Geo', description: 'Culture du Burkina Faso', icone: '🗺️' },
    { id: 'dom-5', nom: 'Langues', description: 'Francais et langues locales', icone: '🗣️' },
    { id: 'dom-6', nom: 'Creativite', description: 'Arts et musique', icone: '🎨' },
  ],

  niveaux: [
    { id: 'niv-1', nom: 'Maternelle PS', libelle: 'Maternelle Petite Section' },
    { id: 'niv-2', nom: 'Maternelle MS', libelle: 'Maternelle Moyenne Section' },
    { id: 'niv-3', nom: 'Maternelle GS', libelle: 'Maternelle Grande Section' },
    { id: 'niv-4', nom: 'CP', libelle: 'CP' },
    { id: 'niv-5', nom: 'CE1', libelle: 'CE1' },
    { id: 'niv-6', nom: 'CE2', libelle: 'CE2' },
    { id: 'niv-7', nom: 'CM1', libelle: 'CM1' },
    { id: 'niv-8', nom: 'CM2', libelle: 'CM2' },
  ],

  contenus: [
    {
      id: 'cont-1',
      titre: 'Les royaumes Mossi',
      description: 'Decouvre l\'histoire des royaumes Mossi du Burkina Faso',
      type: 'VIDEO',
      dureeMinutes: 12,
      domaine: { nom: 'Histoire-Geo' },
      niveau: { nom: 'CE2' },
    },
    {
      id: 'cont-2',
      titre: 'Addition et soustraction',
      description: 'Apprends a additionner et soustraire avec des exercices',
      type: 'QUIZ',
      nombreQuestions: 10,
      domaine: { nom: 'Mathematiques' },
      niveau: { nom: 'CP' },
    },
    {
      id: 'cont-3',
      titre: 'Les animaux de la savane',
      description: 'Decouvre les animaux qui vivent dans la savane africaine',
      type: 'IMAGE',
      domaine: { nom: 'Sciences' },
      niveau: { nom: 'CE1' },
    },
    {
      id: 'cont-4',
      titre: 'Conte du lievre et de l\'hyene',
      description: 'Un conte traditionnel burkinabe',
      type: 'AUDIO',
      dureeMinutes: 8,
      domaine: { nom: 'Lecture' },
      niveau: { nom: 'CP' },
    },
    {
      id: 'cont-5',
      titre: 'Les regions du Burkina',
      description: 'Apprends les 13 regions du Burkina Faso',
      type: 'JEU_INTERACTIF',
      domaine: { nom: 'Histoire-Geo' },
      niveau: { nom: 'CM1' },
    },
    {
      id: 'cont-6',
      titre: 'Les bonnes manieres',
      description: 'Apprends les regles de politesse et de savoir-vivre',
      type: 'PDF',
      domaine: { nom: 'Civisme' },
      niveau: { nom: 'CE2' },
    },
  ],

  notifications: [
    {
      id: 'notif-1',
      type: 'ABONNEMENT',
      titre: 'Abonnement expire bientot',
      message: 'Votre abonnement expire dans 3 jours.',
      dateCreation: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lue: false,
    },
    {
      id: 'notif-2',
      type: 'BADGE',
      titre: 'Nouveau badge debloque !',
      message: 'Amadou a obtenu le badge "Explorateur".',
      dateCreation: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      lue: false,
    },
    {
      id: 'notif-3',
      type: 'PAIEMENT',
      titre: 'Paiement confirme',
      message: 'Votre paiement de 2 500 FCFA a ete confirme.',
      dateCreation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lue: true,
    },
  ],

  statistiques: {
    tempsTotal: 185,
    contenusVus: 24,
    badgesObtenus: 5,
    xpTotal: 450,
    progressionGlobale: 65,
    tempsParJour: [
      { jour: 'Lun', minutes: 30 },
      { jour: 'Mar', minutes: 45 },
      { jour: 'Mer', minutes: 25 },
      { jour: 'Jeu', minutes: 40 },
      { jour: 'Ven', minutes: 35 },
      { jour: 'Sam', minutes: 50 },
      { jour: 'Dim', minutes: 20 },
    ],
    progressionDomaines: [
      { nom: 'Lecture', progression: 75 },
      { nom: 'Mathematiques', progression: 60 },
      { nom: 'Sciences', progression: 45 },
      { nom: 'Histoire-Geo', progression: 80 },
      { nom: 'Civisme', progression: 30 },
    ],
  },

  historique: [
    {
      id: 'hist-1',
      contenu: { titre: 'Les royaumes Mossi', domaine: { nom: 'Histoire-Geo' } },
      dureeMinutes: 12,
      dateConsultation: new Date().toISOString(),
      scoreQuiz: null,
    },
    {
      id: 'hist-2',
      contenu: { titre: 'Addition et soustraction', domaine: { nom: 'Mathematiques' } },
      dureeMinutes: 15,
      dateConsultation: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      scoreQuiz: 85,
    },
  ],

  parametresParentaux: {
    tempsMaxJournalier: 60,
    heureDebutAutorisee: '08:00',
    heureFinAutorisee: '20:00',
    pinParental: '1234',
  },
};

export default useApi;
