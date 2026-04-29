import { useState, useEffect } from 'react';
import { useNavigate, Link, Navigate, useSearchParams } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiShield, FiEye, FiEyeOff, FiSettings, FiCheckCircle, FiEdit3, FiClock } from 'react-icons/fi';
import useAdminAuthStore from '../../stores/adminAuthStore';
import './AdminLogin.css';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, hasAccess } = useAdminAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Afficher message si session expirée
  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setInfo('Votre session a expiré, veuillez vous reconnecter.');
    }
  }, [searchParams]);

  // Si deja connecte en admin avec acces valide, rediriger
  if (isAuthenticated && hasAccess()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const result = await login({ identifiant: email, motDePasse: password });

      if (result.success) {
        navigate('/admin/dashboard');
      } else {
        setError(result.error || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-logo" aria-hidden="true">
            <FiShield size={42} />
          </div>
          <h1>Espace Professionnel</h1>
          <p>Administrateurs, Validateurs et Gestionnaires</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
          {info && !error && (
            <div className="info-alert" role="status" aria-live="polite" style={{
              padding: '0.75rem 1rem',
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 8,
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              <FiClock aria-hidden="true" />
              <span>{info}</span>
            </div>
          )}
          {error && (
            <div className="error-alert" role="alert" aria-live="polite">
              <FiAlertCircle aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email administrateur</label>
            <div className="input-with-icon">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@plateforme-educative.bf"
                disabled={loading}
                autoComplete="email"
                aria-required="true"
                aria-describedby={error ? 'login-error' : undefined}
              />
              <FiMail aria-hidden="true" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <div className="input-with-icon password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
                aria-required="true"
              />
              <FiLock aria-hidden="true" />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                disabled={loading}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-admin"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="btn-loading-text">Connexion en cours</span>
                <span className="visually-hidden">Veuillez patienter...</span>
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link to="/login" className="back-link">
            Retour au portail parent
          </Link>
        </div>
      </div>

      <div className="admin-login-info" aria-label="Informations sur les rôles">
        <h2>Portail Professionnel</h2>
        <p>Gérez efficacement votre plateforme éducative</p>

        <div className="role-section">
          <h3>
            <span className="role-icon"><FiSettings size={16} /></span>
            Administrateurs
          </h3>
          <ul>
            <li>Gestion complète de la plateforme</li>
            <li>Suivi des utilisateurs et abonnements</li>
            <li>Statistiques et rapports détaillés</li>
          </ul>
        </div>

        <div className="role-section">
          <h3>
            <span className="role-icon"><FiCheckCircle size={16} /></span>
            Validateurs
          </h3>
          <ul>
            <li>Validation des contenus éducatifs</li>
            <li>Contrôle qualité des ressources</li>
          </ul>
        </div>

        <div className="role-section">
          <h3>
            <span className="role-icon"><FiEdit3 size={16} /></span>
            Gestionnaires de contenu
          </h3>
          <ul>
            <li>Création et édition de contenus</li>
            <li>Organisation des ressources pédagogiques</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
