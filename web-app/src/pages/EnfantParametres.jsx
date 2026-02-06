import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiClock,
  FiCalendar,
  FiBookOpen,
  FiLock,
  FiSave,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
} from 'react-icons/fi';
import {
  enfantService,
  parametreParentalService,
  domaineAutoriseService,
  contenuService,
} from '../services/api';
import { DEMO_DATA } from '../hooks/useApi';
import './EnfantParametres.css';

function EnfantParametres() {
  const { id } = useParams();
  const [enfant, setEnfant] = useState(null);
  const [parametres, setParametres] = useState(null);
  const [domainesAutorises, setDomainesAutorises] = useState([]);
  const [tousLesDomaines, setTousLesDomaines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [message, setMessage] = useState(null);
  const [useDemoData, setUseDemoData] = useState(false);

  // Formulaire
  const [tempsMax, setTempsMax] = useState(60);
  const [heureDebut, setHeureDebut] = useState('08:00');
  const [heureFin, setHeureFin] = useState('20:00');
  const [pinParental, setPinParental] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [enfantRes, paramsRes, domainesAutorisesRes, tousDomainesRes] = await Promise.all([
        enfantService.getById(id),
        parametreParentalService.getParametres(id),
        domaineAutoriseService.getDomaines(id),
        contenuService.getDomaines(),
      ]);

      const enfantData = enfantRes.data.data || enfantRes.data;
      const paramsData = paramsRes.data.data || paramsRes.data || {};
      const domainesAutoData = domainesAutorisesRes.data.data || domainesAutorisesRes.data || [];
      const tousDomainesData = tousDomainesRes.data.data || tousDomainesRes.data || [];

      setEnfant(enfantData);
      setParametres(paramsData);
      setDomainesAutorises(domainesAutoData.map((d) => d.domaineId || d.id));
      setTousLesDomaines(tousDomainesData);

      // Initialiser les valeurs du formulaire
      setTempsMax(paramsData.tempsMaxJournalier || 60);
      setHeureDebut(paramsData.heureDebutAutorisee || '08:00');
      setHeureFin(paramsData.heureFinAutorisee || '20:00');
      setPinParental(paramsData.pinParental || '');
      setUseDemoData(false);
    } catch (error) {
      console.error('Erreur chargement:', error);
      // Utiliser les donnees de demonstration
      const demoEnfant = DEMO_DATA.enfants.find(e => e.id === parseInt(id)) || DEMO_DATA.enfants[0];
      setEnfant(demoEnfant);
      setTousLesDomaines(DEMO_DATA.domaines);
      setDomainesAutorises(DEMO_DATA.domaines.slice(0, 3).map(d => d.id));
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveParametres = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await parametreParentalService.updateParametres(id, {
        tempsMaxJournalier: tempsMax,
        heureDebutAutorisee: heureDebut,
        heureFinAutorisee: heureFin,
        pinParental: pinParental || undefined,
      });
      setMessage({ type: 'success', text: 'Parametres enregistres avec succes' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDomaine = async (domaineId) => {
    try {
      await domaineAutoriseService.toggleDomaine(id, domaineId);
      setDomainesAutorises((prev) =>
        prev.includes(domaineId)
          ? prev.filter((d) => d !== domaineId)
          : [...prev, domaineId]
      );
    } catch (error) {
      console.error('Erreur toggle domaine:', error);
    }
  };

  const handleRegenerateCredentials = async () => {
    if (!window.confirm('Regenerer les identifiants de connexion ? L\'enfant devra utiliser les nouveaux codes.')) {
      return;
    }
    try {
      const response = await enfantService.update(id, { regenererCredentials: true });
      const newData = response.data.data || response.data;
      setEnfant(newData);
      setMessage({ type: 'success', text: 'Identifiants regeneres avec succes' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la regeneration' });
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (!enfant) {
    return (
      <div className="parametres-page">
        <div className="empty-state card">
          <h3>Enfant non trouve</h3>
          <Link to="/enfants" className="btn btn-primary">Retour a la liste</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="parametres-page">
      {useDemoData && (
        <div className="demo-banner">
          <FiAlertCircle />
          <span>Mode demonstration - Les modifications ne seront pas enregistrees</span>
        </div>
      )}

      <div className="page-header">
        <Link to={`/enfants/${id}`} className="btn-back">
          <FiArrowLeft /> Retour
        </Link>
        <h1>Parametres de {enfant.nomPseudo}</h1>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'}`}>
          {message.text}
        </div>
      )}

      <div className="parametres-grid">
        {/* Identifiants de connexion */}
        <section className="parametres-section">
          <div className="section-header">
            <h2>
              <FiLock /> Identifiants de connexion
            </h2>
          </div>
          <div className="credentials-card">
            <div className="credential-item">
              <label>Code de connexion</label>
              <div className="credential-value">
                <span>{enfant.codeConnexion || 'Non defini'}</span>
              </div>
            </div>
            <div className="credential-item">
              <label>Mot de passe enfant</label>
              <div className="credential-value">
                <span>
                  {showPassword
                    ? enfant.motDePasseEnfant || '******'
                    : '******'}
                </span>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            {enfant.pinSimplifie && (
              <div className="credential-item">
                <label>PIN simplifie (pour les petits)</label>
                <div className="credential-value">
                  <span>{showPin ? enfant.pinSimplifie : '****'}</span>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            )}
            <button
              className="btn btn-outline btn-sm"
              onClick={handleRegenerateCredentials}
            >
              <FiRefreshCw /> Regenerer les identifiants
            </button>
          </div>
        </section>

        {/* Temps d'ecran */}
        <section className="parametres-section">
          <div className="section-header">
            <h2>
              <FiClock /> Temps d'ecran
            </h2>
          </div>
          <div className="form-content">
            <div className="form-group">
              <label className="form-label">Limite journaliere (minutes)</label>
              <div className="slider-container">
                <input
                  type="range"
                  min="15"
                  max="180"
                  step="15"
                  value={tempsMax}
                  onChange={(e) => setTempsMax(parseInt(e.target.value))}
                  className="slider"
                />
                <div className="slider-labels">
                  <span>15 min</span>
                  <span className="current-value">{tempsMax} min</span>
                  <span>3h</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Horaires autorises */}
        <section className="parametres-section">
          <div className="section-header">
            <h2>
              <FiCalendar /> Horaires autorises
            </h2>
          </div>
          <div className="form-content">
            <div className="horaires-row">
              <div className="form-group">
                <label className="form-label">Heure de debut</label>
                <input
                  type="time"
                  className="form-input"
                  value={heureDebut}
                  onChange={(e) => setHeureDebut(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Heure de fin</label>
                <input
                  type="time"
                  className="form-input"
                  value={heureFin}
                  onChange={(e) => setHeureFin(e.target.value)}
                />
              </div>
            </div>
            <p className="form-hint">
              L'enfant pourra utiliser l'application uniquement entre {heureDebut} et {heureFin}
            </p>
          </div>
        </section>

        {/* PIN Parental */}
        <section className="parametres-section">
          <div className="section-header">
            <h2>
              <FiLock /> PIN parental
            </h2>
          </div>
          <div className="form-content">
            <div className="form-group">
              <label className="form-label">Code PIN (4 chiffres)</label>
              <input
                type="password"
                className="form-input"
                placeholder="****"
                maxLength={4}
                value={pinParental}
                onChange={(e) => setPinParental(e.target.value.replace(/\D/g, ''))}
              />
              <p className="form-hint">
                Ce PIN sera demande pour acceder a l'espace parent depuis la tablette
              </p>
            </div>
          </div>
        </section>

        {/* Domaines autorises */}
        <section className="parametres-section section-full">
          <div className="section-header">
            <h2>
              <FiBookOpen /> Domaines educatifs autorises
            </h2>
          </div>
          <div className="domaines-grid">
            {tousLesDomaines.map((domaine) => (
              <div
                key={domaine.id}
                className={`domaine-toggle ${domainesAutorises.includes(domaine.id) ? 'active' : ''}`}
                onClick={() => handleToggleDomaine(domaine.id)}
              >
                <div className="domaine-icon">{domaine.icone || '📚'}</div>
                <div className="domaine-info">
                  <span className="domaine-nom">{domaine.nom}</span>
                  <span className="domaine-desc">{domaine.description}</span>
                </div>
                <div className="domaine-check">
                  {domainesAutorises.includes(domaine.id) ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="actions-footer">
        <Link to={`/enfants/${id}`} className="btn btn-secondary">
          Annuler
        </Link>
        <button
          className="btn btn-primary"
          onClick={handleSaveParametres}
          disabled={saving}
        >
          {saving ? (
            <span className="loader-small"></span>
          ) : (
            <>
              <FiSave /> Enregistrer les modifications
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default EnfantParametres;
