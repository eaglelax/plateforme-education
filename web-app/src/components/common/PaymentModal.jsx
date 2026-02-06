import { useState } from 'react';
import { FiX, FiPhone, FiCheck, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { paiementService } from '../../services/api';
import './PaymentModal.css';

const PAYMENT_PROVIDERS = [
  {
    id: 'ORANGE_MONEY',
    name: 'Orange Money',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/200px-Orange_logo.svg.png',
    color: '#FF6600',
    prefix: '07',
  },
  {
    id: 'MOOV_MONEY',
    name: 'Moov Money',
    logo: 'https://seeklogo.com/images/M/moov-money-logo-0592A0FD9C-seeklogo.com.png',
    color: '#0066CC',
    prefix: '06',
  },
  {
    id: 'WAVE',
    name: 'Wave',
    logo: 'https://www.wave.com/img/wave-logo.svg',
    color: '#1DC7EA',
    prefix: '05',
  },
];

function PaymentModal({ isOpen, onClose, subscription, enfantId, onSuccess }) {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState('provider'); // provider, phone, processing, success, error
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider);
    setPhoneNumber(provider.prefix);
    setStep('phone');
  };

  const handlePayment = async () => {
    if (phoneNumber.length < 8) {
      setError('Numero de telephone invalide');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      await paiementService.initier({
        typeAbonnementId: subscription.id,
        enfantId: enfantId,
        modePaiement: selectedProvider.id,
        telephone: phoneNumber,
        montant: subscription.prix,
      });

      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du paiement. Veuillez reessayer.');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('provider');
    setSelectedProvider(null);
    setPhoneNumber('');
    setError(null);
    onClose();
  };

  const handleBack = () => {
    if (step === 'phone') {
      setStep('provider');
      setSelectedProvider(null);
    } else if (step === 'error') {
      setStep('phone');
      setError(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
          <FiX />
        </button>

        {step === 'provider' && (
          <>
            <div className="modal-header">
              <h2>Choisir le mode de paiement</h2>
              <p>Selectionnez votre operateur Mobile Money</p>
            </div>

            <div className="subscription-summary">
              <div className="summary-row">
                <span>Abonnement</span>
                <strong>{subscription?.nom}</strong>
              </div>
              <div className="summary-row total">
                <span>Montant a payer</span>
                <strong>{subscription?.prix?.toLocaleString('fr-FR')} FCFA</strong>
              </div>
            </div>

            <div className="providers-grid">
              {PAYMENT_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  className="provider-btn"
                  onClick={() => handleProviderSelect(provider)}
                  style={{ '--provider-color': provider.color }}
                >
                  <img src={provider.logo} alt={provider.name} />
                  <span>{provider.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'phone' && (
          <>
            <div className="modal-header">
              <h2>Numero {selectedProvider?.name}</h2>
              <p>Entrez votre numero pour recevoir la demande de paiement</p>
            </div>

            <div className="provider-selected">
              <img src={selectedProvider?.logo} alt={selectedProvider?.name} />
              <span>{selectedProvider?.name}</span>
            </div>

            <div className="phone-input-group">
              <div className="phone-prefix">+226</div>
              <input
                type="tel"
                className="phone-input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="XX XX XX XX"
                maxLength={8}
              />
            </div>

            {error && (
              <div className="error-message">
                <FiAlertCircle /> {error}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleBack}>
                Retour
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePayment}
                disabled={phoneNumber.length < 8}
              >
                <FiPhone /> Payer {subscription?.prix?.toLocaleString('fr-FR')} FCFA
              </button>
            </div>

            <p className="payment-info">
              Vous recevrez une notification sur votre telephone pour confirmer le paiement.
            </p>
          </>
        )}

        {step === 'processing' && (
          <div className="processing-state">
            <div className="processing-icon">
              <FiLoader className="spin" />
            </div>
            <h2>Traitement en cours...</h2>
            <p>Veuillez valider la demande de paiement sur votre telephone</p>
            <div className="processing-steps">
              <div className="step completed">
                <FiCheck /> Demande envoyee
              </div>
              <div className="step active">
                <FiLoader className="spin" /> En attente de validation
              </div>
              <div className="step">
                <span>3</span> Confirmation
              </div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="success-state">
            <div className="success-icon">
              <FiCheck />
            </div>
            <h2>Paiement reussi !</h2>
            <p>Votre abonnement a ete active avec succes</p>
            <div className="success-details">
              <div className="detail-row">
                <span>Reference</span>
                <strong>#PAY{Date.now().toString().slice(-8)}</strong>
              </div>
              <div className="detail-row">
                <span>Montant</span>
                <strong>{subscription?.prix?.toLocaleString('fr-FR')} FCFA</strong>
              </div>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="error-state">
            <div className="error-icon">
              <FiAlertCircle />
            </div>
            <h2>Echec du paiement</h2>
            <p>{error || 'Une erreur est survenue lors du traitement'}</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleClose}>
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleBack}>
                Reessayer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentModal;
