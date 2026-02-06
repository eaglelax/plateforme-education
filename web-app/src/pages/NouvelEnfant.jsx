import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiUser, FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { enfantService } from '../services/api';
import './NouvelEnfant.css';

function NouvelEnfant() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const age = watch('age');

  const getTrancheAge = (age) => {
    if (age >= 3 && age <= 5) return { min: 3, max: 5 };
    if (age >= 6 && age <= 8) return { min: 6, max: 8 };
    if (age >= 9 && age <= 12) return { min: 9, max: 12 };
    return { min: 3, max: 12 };
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);

    const tranche = getTrancheAge(parseInt(data.age));

    try {
      await enfantService.create({
        nomPseudo: data.nomPseudo,
        age: parseInt(data.age),
        trancheAgeMin: tranche.min,
        trancheAgeMax: tranche.max,
      });
      navigate('/enfants');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la creation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nouvel-enfant-page">
      <button className="btn-back" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Retour
      </button>

      <div className="form-card">
        <div className="form-header">
          <h1>Ajouter un enfant</h1>
          <p>Creez un profil pour votre enfant</p>
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
            <h4>Informations de connexion</h4>
            <p>
              Un code de connexion unique et un mot de passe seront generes
              automatiquement. Vous pourrez les consulter et les modifier dans
              les parametres du profil de l'enfant.
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loader-small"></span> : 'Creer le profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NouvelEnfant;
