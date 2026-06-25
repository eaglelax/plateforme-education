import { useState, useEffect } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import {
  FiMail,
  FiLock,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiClock,
} from 'react-icons/fi';
import useAdminAuthStore from '../../stores/adminAuthStore';
import useThemeStore from '../../stores/themeStore';
import AnkaLogo from '../../components/common/AnkaLogo';
import ThemeToggle from '../../components/common/ThemeToggle';
import './AdminLogin.css';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, hasAccess } = useAdminAuthStore();
  const initTheme = useThemeStore((s) => s.init);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setInfo('Votre session a expiré, veuillez vous reconnecter.');
    }
  }, [searchParams]);

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

  return (
    <div className="admin-login-page">
      <div className="admin-login-theme-toggle">
        <ThemeToggle />
      </div>

      <div className="admin-login-container">
        <div className="admin-login-header">
          <div className="admin-logo" aria-hidden="true">
            <AnkaLogo size={48} />
          </div>
          <h1>Espace Professionnel</h1>
          <p className="anka-tagline">Nos cultures. Leur avenir.</p>
          <p className="admin-login-subtitle">
            Administrateurs · Validateurs · Gestionnaires
          </p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
          {info && !error && (
            <div className="info-alert" role="status" aria-live="polite">
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
                placeholder="admin@anka.education"
                disabled={loading}
                autoComplete="email"
                aria-required="true"
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
                onClick={() => setShowPassword(!showPassword)}
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
              <span className="btn-loading-text">Connexion en cours</span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="admin-login-footer">
          <span className="footer-brand">ANKA EdTech</span>
          <span className="footer-sep">·</span>
          <span>Ouagadougou</span>
        </div>
      </div>

      <aside className="admin-login-info" aria-label="ANKA">
        <div className="info-brand">
          <AnkaLogo size={120} className="info-brand-logo" />
          <span className="info-brand-name">ANKA</span>
          <span className="info-brand-tagline">Nos cultures. Leur avenir.</span>
        </div>
      </aside>
    </div>
  );
}

export default AdminLogin;
