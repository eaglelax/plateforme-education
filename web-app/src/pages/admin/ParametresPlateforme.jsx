import { useState, useEffect } from 'react';
import { FiSettings, FiSave, FiAlertCircle, FiCheck, FiShield, FiClock, FiLock } from 'react-icons/fi';
import './AdminPages.css';

function ParametresPlateforme() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [params, setParams] = useState({
    dureeAbonnementDefaut: 30,
    periodeGraceJours: 7,
    ageMinEnfant: 4,
    ageMaxEnfant: 16,
    maxEnfantsParParent: 5,
    maxAppareilsParAbonnement: 3,
    tentativesConnexionMax: 5,
    dureeBlocageMinutes: 15,
    verificationOfflineHeures: 48,
    scoreMinimumQuiz: 60,
    xpParContenuDefaut: 10,
    telechargementWifiUniquement: true,
    renouvellementAutoDefaut: false,
    modeMaintenanceActif: false,
  });

  const handleChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      // Save to localStorage for now (can be connected to API later)
      localStorage.setItem('plateforme-params', JSON.stringify(params));
      setSuccess('Parametres sauvegardes avec succes');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('plateforme-params');
    if (saved) {
      try { setParams(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div className="header-content">
          <FiSettings className="header-icon" />
          <div>
            <h1>Parametres de la plateforme</h1>
            <p>Configuration generale des regles d'acces et de securite</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            <FiSave /> {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {error && <div className="error-alert"><FiAlertCircle /><span>{error}</span></div>}
      {success && <div className="success-alert"><FiCheck /><span>{success}</span></div>}

      {/* Section: Abonnements */}
      <div className="form-card">
        <h3><FiClock style={{ marginRight: 8 }} />Regles d'abonnement</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Duree par defaut (jours)</label>
            <input type="number" className="form-input" value={params.dureeAbonnementDefaut} onChange={(e) => handleChange('dureeAbonnementDefaut', parseInt(e.target.value))} min={1} />
          </div>
          <div className="form-group">
            <label>Periode de grace (jours)</label>
            <input type="number" className="form-input" value={params.periodeGraceJours} onChange={(e) => handleChange('periodeGraceJours', parseInt(e.target.value))} min={0} />
          </div>
          <div className="form-group">
            <label>Max appareils par abonnement</label>
            <input type="number" className="form-input" value={params.maxAppareilsParAbonnement} onChange={(e) => handleChange('maxAppareilsParAbonnement', parseInt(e.target.value))} min={1} max={10} />
          </div>
        </div>
        <div className="form-row checkboxes">
          <label className="checkbox-label">
            <input type="checkbox" checked={params.renouvellementAutoDefaut} onChange={(e) => handleChange('renouvellementAutoDefaut', e.target.checked)} />
            <span>Renouvellement automatique par defaut</span>
          </label>
        </div>
      </div>

      {/* Section: Enfants */}
      <div className="form-card">
        <h3><FiShield style={{ marginRight: 8 }} />Regles enfants</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Age minimum</label>
            <input type="number" className="form-input" value={params.ageMinEnfant} onChange={(e) => handleChange('ageMinEnfant', parseInt(e.target.value))} min={3} max={18} />
          </div>
          <div className="form-group">
            <label>Age maximum</label>
            <input type="number" className="form-input" value={params.ageMaxEnfant} onChange={(e) => handleChange('ageMaxEnfant', parseInt(e.target.value))} min={3} max={18} />
          </div>
          <div className="form-group">
            <label>Max enfants par parent</label>
            <input type="number" className="form-input" value={params.maxEnfantsParParent} onChange={(e) => handleChange('maxEnfantsParParent', parseInt(e.target.value))} min={1} max={20} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Score minimum quiz (%)</label>
            <input type="number" className="form-input" value={params.scoreMinimumQuiz} onChange={(e) => handleChange('scoreMinimumQuiz', parseInt(e.target.value))} min={0} max={100} />
          </div>
          <div className="form-group">
            <label>XP par contenu (defaut)</label>
            <input type="number" className="form-input" value={params.xpParContenuDefaut} onChange={(e) => handleChange('xpParContenuDefaut', parseInt(e.target.value))} min={1} />
          </div>
          <div className="form-group">
            <label>Verification offline (heures)</label>
            <input type="number" className="form-input" value={params.verificationOfflineHeures} onChange={(e) => handleChange('verificationOfflineHeures', parseInt(e.target.value))} min={12} max={168} />
          </div>
        </div>
        <div className="form-row checkboxes">
          <label className="checkbox-label">
            <input type="checkbox" checked={params.telechargementWifiUniquement} onChange={(e) => handleChange('telechargementWifiUniquement', e.target.checked)} />
            <span>Telechargement en WiFi uniquement</span>
          </label>
        </div>
      </div>

      {/* Section: Securite */}
      <div className="form-card">
        <h3><FiLock style={{ marginRight: 8 }} />Securite</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Tentatives de connexion max</label>
            <input type="number" className="form-input" value={params.tentativesConnexionMax} onChange={(e) => handleChange('tentativesConnexionMax', parseInt(e.target.value))} min={3} max={20} />
          </div>
          <div className="form-group">
            <label>Duree blocage (minutes)</label>
            <input type="number" className="form-input" value={params.dureeBlocageMinutes} onChange={(e) => handleChange('dureeBlocageMinutes', parseInt(e.target.value))} min={5} max={60} />
          </div>
        </div>
        <div className="form-row checkboxes">
          <label className="checkbox-label">
            <input type="checkbox" checked={params.modeMaintenanceActif} onChange={(e) => handleChange('modeMaintenanceActif', e.target.checked)} />
            <span>Mode maintenance actif (bloque l'acces a la plateforme)</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default ParametresPlateforme;
