import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiArrowLeft, FiUser, FiCalendar, FiSave, FiAlertCircle } from 'react-icons/fi';
import { enfantService } from '../services/api';
import { DEMO_DATA } from '../hooks/useApi';
import './ModifierEnfant.css';

function ModifierEnfant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enfant, setEnfant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [useDemoData, setUseDemoData] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const age = watch('age');

  useEffect(() => {
    fetchEnfant();
  }, [id]);

  const fetchEnfant = async () => {
    try {
      const response = await enfantService.getById(id);
      const data = response.data.data || response.data;
      setEnfant(data);
      reset({
        nomPseudo: data.nomPseudo,
        age: data.age,
      });
      setUseDemoData(false);
    } catch (err) {
      // Utiliser les donnees de demonstration
      const demoEnfant = DEMO_DATA.enfants.find(e => e.id === parseInt(id)) || DEMO_DATA.enfants[0];
      setEnfant(demoEnfant);
      reset({
        nomPseudo: demoEnfant.nomPseudo,
        age: demoEnfant.age,
      });
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const getTrancheAge = (age) => {
    if (age >= 3 && age <= 5) return { min: 3, max: 5 };
    if (age >= 6 && age <= 8) return { min: 6, max: 8 };
    if (age >= 9 && age <= 12) return { min: 9, max: 12 };
    return { min: 3, max: 12 };
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setError(null);

    const tranche = getTrancheAge(parseInt(data.age));

    try {
      await enfantService.update(id, {
        nomPseudo: data.nomPseudo,
        age: parseInt(data.age),
        trancheAgeMin: tranche.min,
        trancheAgeMax: tranche.max,
      });
      navigate(`/enfants/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setSaving(false);
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
      <div className="modifier-enfant-page">
        <div className="empty-state card">
          <h3>Enfant non trouve</h3>
          <Link to="/enfants" className="btn btn-primary">Retour a la liste</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="modifier-enfant-page">
      {useDemoData && (
        <div className="demo-banner">
          <FiAlertCircle />
          <span>Mode demonstration - Les modifications ne seront pas enregistrees</span>
        </div>
      )}

      <Link to={`/enfants/${id}`} className="btn-back">
        <FiArrowLeft /> Retour
      </Link>

      <div className="form-card">
        <div className="form-header">
          <div className="avatar-preview">
            {enfant.nomPseudo?.charAt(0).toUpperCase()}
          </div>
          <h1>Modifier le profil</h1>
          <p>Modifiez les informations de {enfant.nomPseudo}</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Pseudo / Prenom</label>
            <div className="input-icon">
              <FiUser className="icon" />
              <input
                type="text"
                className={`form-input ${errors.nomPseudo ? 'error' : ''}`}
                placeholder="Ex: Fatou, Moussa..."
                {...register('nomPseudo', {
                  required: 'Le pseudo est requis',
                  minLength: { value: 2, message: 'Minimum 2 caracteres' },
                  maxLength: { value: 30, message: 'Maximum 30 caracteres' },
                })}
              />
            </div>
            {errors.nomPseudo && (
              <span className="form-error">{errors.nomPseudo.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Age</label>
            <div className="input-icon">
              <FiCalendar className="icon" />
              <select
                className={`form-input ${errors.age ? 'error' : ''}`}
                {...register('age', { required: 'L\'age est requis' })}
              >
                <option value="">Selectionnez l'age</option>
                {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((a) => (
                  <option key={a} value={a}>
                    {a} ans
                  </option>
                ))}
              </select>
            </div>
            {errors.age && <span className="form-error">{errors.age.message}</span>}
          </div>

          {age && (
            <div className="tranche-info">
              <span>Tranche d'age: </span>
              <strong>{getTrancheAge(parseInt(age)).min} - {getTrancheAge(parseInt(age)).max} ans</strong>
            </div>
          )}

          <div className="info-box">
            <h4>Code de connexion</h4>
            <p className="code-display">{enfant.codeConnexion}</p>
            <p className="info-text">
              Le code de connexion ne peut pas etre modifie. Vous pouvez regenerer
              les identifiants depuis les parametres.
            </p>
          </div>

          <div className="form-actions">
            <Link to={`/enfants/${id}`} className="btn btn-secondary">
              Annuler
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <span className="loader-small"></span>
              ) : (
                <>
                  <FiSave /> Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModifierEnfant;
