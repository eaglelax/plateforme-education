import { FiAlertCircle, FiWifiOff, FiRefreshCw } from 'react-icons/fi';
import './ErrorState.css';

function ErrorState({
  error,
  onRetry,
  title = 'Une erreur est survenue',
  showRetry = true
}) {
  const isNetworkError = error?.includes('connexion') || error?.includes('serveur');

  return (
    <div className="error-state">
      <div className="error-icon">
        {isNetworkError ? <FiWifiOff /> : <FiAlertCircle />}
      </div>
      <h3>{title}</h3>
      <p>{error || 'Veuillez reessayer plus tard'}</p>
      {showRetry && onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          <FiRefreshCw /> Reessayer
        </button>
      )}
    </div>
  );
}

export default ErrorState;
