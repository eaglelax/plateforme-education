import { FiMoon, FiSun } from 'react-icons/fi';
import useThemeStore from '../../stores/themeStore';
import './ThemeToggle.css';

function ThemeToggle({ variant = 'icon' }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  if (variant === 'switch') {
    return (
      <button
        type="button"
        className={`theme-switch ${isDark ? 'is-dark' : 'is-light'}`}
        onClick={toggleTheme}
        aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
        title={isDark ? 'Thème sombre actif' : 'Thème clair actif'}
      >
        <span className="theme-switch-track">
          <span className="theme-switch-thumb">
            {isDark ? <FiMoon size={12} /> : <FiSun size={12} />}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Activer le thème clair' : 'Activer le thème sombre'}
      title={isDark ? 'Thème sombre actif — basculer en clair' : 'Thème clair actif — basculer en sombre'}
    >
      {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
    </button>
  );
}

export default ThemeToggle;
