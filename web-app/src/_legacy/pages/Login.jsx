import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import useAuthStore from '../stores/authStore';
import './Auth.css';

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Si deja connecte, rediriger vers dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    clearError();
    const identifiant = loginMethod === 'telephone' ? data.telephone : data.email;
    const result = await login({ identifiant, motDePasse: data.motDePasse });

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
          <h2>Connexion</h2>
          <p className="auth-subtitle">Connectez-vous a votre compte parent</p>

          <div className="login-method-toggle">
            <button
              type="button"
              className={`toggle-btn ${loginMethod === 'email' ? 'active' : ''}`}
              onClick={() => setLoginMethod('email')}
            >
              <FiMail /> Email
            </button>
            <button
              type="button"
              className={`toggle-btn ${loginMethod === 'telephone' ? 'active' : ''}`}
              onClick={() => setLoginMethod('telephone')}
            >
              <FiPhone /> Telephone
            </button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit(onSubmit)}>
            {loginMethod === 'email' ? (
              <div className="form-group">
                <label className="form-label">Adresse email</label>
                <div className="input-icon">
                  <FiMail className="icon" />
                  <input
                    type="email"
                    className={`form-input ${errors.email ? 'error' : ''}`}
                    placeholder="exemple@email.com"
                    {...register('email', {
                      required: 'L\'email est requis',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Email invalide',
                      },
                    })}
                  />
                </div>
                {errors.email && (
                  <span className="form-error">{errors.email.message}</span>
                )}
              </div>
            ) : (
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
                {errors.telephone && (
                  <span className="form-error">{errors.telephone.message}</span>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="input-icon">
                <FiLock className="icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.motDePasse ? 'error' : ''}`}
                  placeholder="Votre mot de passe"
                  {...register('motDePasse', {
                    required: 'Le mot de passe est requis',
                    minLength: {
                      value: 6,
                      message: 'Le mot de passe doit contenir au moins 6 caracteres',
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
              {errors.motDePasse && (
                <span className="form-error">{errors.motDePasse.message}</span>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? <span className="loader-small"></span> : 'Se connecter'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Pas encore de compte ?{' '}
              <Link to="/register">Creer un compte</Link>
            </p>
            <p className="admin-link">
              <Link to="/admin/login">Acces administrateur</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
