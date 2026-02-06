import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import useAuthStore from '../stores/authStore';
import './Auth.css';

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('motDePasse');

  const onSubmit = async (data) => {
    clearError();
    const { confirmPassword, ...userData } = data;
    const result = await registerUser(userData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span>E</span>
          </div>
          <h1>Plateforme Educative</h1>
          <p>Burkina Faso</p>
        </div>

        <div className="auth-card">
          <h2>Creer un compte</h2>
          <p className="auth-subtitle">Inscrivez-vous pour acceder a la plateforme</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nom</label>
                <div className="input-icon">
                  <FiUser className="icon" />
                  <input
                    type="text"
                    className={`form-input ${errors.nom ? 'error' : ''}`}
                    placeholder="Votre nom"
                    {...register('nom', {
                      required: 'Le nom est requis',
                      minLength: { value: 2, message: 'Minimum 2 caracteres' },
                    })}
                  />
                </div>
                {errors.nom && <span className="form-error">{errors.nom.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Prenom</label>
                <div className="input-icon">
                  <FiUser className="icon" />
                  <input
                    type="text"
                    className={`form-input ${errors.prenom ? 'error' : ''}`}
                    placeholder="Votre prenom"
                    {...register('prenom', {
                      required: 'Le prenom est requis',
                      minLength: { value: 2, message: 'Minimum 2 caracteres' },
                    })}
                  />
                </div>
                {errors.prenom && <span className="form-error">{errors.prenom.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Numero de telephone</label>
              <div className="input-icon">
                <FiPhone className="icon" />
                <input
                  type="tel"
                  className={`form-input ${errors.telephone ? 'error' : ''}`}
                  placeholder="22670123456"
                  {...register('telephone', {
                    required: 'Le numero de telephone est requis',
                    pattern: {
                      value: /^[0-9]{8,15}$/,
                      message: 'Numero de telephone invalide',
                    },
                  })}
                />
              </div>
              {errors.telephone && <span className="form-error">{errors.telephone.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Adresse email (optionnel)</label>
              <div className="input-icon">
                <FiMail className="icon" />
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="exemple@email.com"
                  {...register('email', {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Email invalide',
                    },
                  })}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="input-icon">
                <FiLock className="icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.motDePasse ? 'error' : ''}`}
                  placeholder="Minimum 8 caracteres"
                  {...register('motDePasse', {
                    required: 'Le mot de passe est requis',
                    minLength: { value: 8, message: 'Minimum 8 caracteres' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Doit contenir une majuscule, une minuscule et un chiffre',
                    },
                  })}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.motDePasse && <span className="form-error">{errors.motDePasse.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe</label>
              <div className="input-icon">
                <FiLock className="icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirmez votre mot de passe"
                  {...register('confirmPassword', {
                    required: 'Veuillez confirmer le mot de passe',
                    validate: (value) =>
                      value === password || 'Les mots de passe ne correspondent pas',
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <span className="form-error">{errors.confirmPassword.message}</span>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? <span className="loader-small"></span> : 'Creer mon compte'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Deja inscrit ?{' '}
              <Link to="/login">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
