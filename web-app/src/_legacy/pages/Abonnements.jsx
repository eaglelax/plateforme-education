import { useEffect, useState } from 'react';
import { FiCheck, FiClock, FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import { abonnementService, enfantService } from '../services/api';
import PaymentModal from '../components/common/PaymentModal';
import './Abonnements.css';

function Abonnements() {
  const [types, setTypes] = useState([]);
  const [mesAbonnements, setMesAbonnements] = useState([]);
  const [enfants, setEnfants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEnfant, setSelectedEnfant] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [typesRes, abosRes, enfantsRes] = await Promise.all([
        abonnementService.getTypes(),
        abonnementService.getMesAbonnements(),
        enfantService.getMesEnfants(),
      ]);

      const typesData = typesRes?.data?.data || [];
      const abosData = abosRes?.data?.data || [];
      const enfantsData = enfantsRes?.data?.data || [];

      setTypes(Array.isArray(typesData) ? typesData : []);
      setMesAbonnements(Array.isArray(abosData) ? abosData : []);
      setEnfants(Array.isArray(enfantsData) ? enfantsData : []);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Impossible de charger les donnees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSouscrire = (type) => {
    if (enfants.length === 0) {
      alert('Veuillez d\'abord ajouter un enfant avant de souscrire a un abonnement');
      return;
    }
    setSelectedType(type);
    if (enfants.length === 1) {
      setSelectedEnfant(enfants[0].id);
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  const abonnementsActifs = Array.isArray(mesAbonnements)
    ? mesAbonnements.filter((a) => a?.statut === 'ACTIF' || a?.statut === 'actif')
    : [];

  return (
    <div className="abonnements-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Abonnements</h1>
          <p>Choisissez l'offre adaptee a vos besoins</p>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={fetchData} className="btn-retry">Reessayer</button>
        </div>
      )}

      {abonnementsActifs.length > 0 && (
        <section className="current-section">
          <h2>Votre abonnement actuel</h2>
          {abonnementsActifs.map((abo) => (
            <div key={abo.id} className="current-card">
              <div className="current-info">
                <div className="current-badge">
                  <FiCreditCard />
                  <span>{abo.typeAbonnement?.nom || abo.type?.nom || 'Abonnement'}</span>
                </div>
                <div className="current-expire">
                  <FiClock />
                  <span>Expire le {new Date(abo.dateFin).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
              </div>
              <span className="status-badge active">Actif</span>
            </div>
          ))}
        </section>
      )}

      <section className="plans-section">
        <h2>Nos offres</h2>
        {types.length === 0 ? (
          <div className="empty-plans">
            <p>Aucune offre disponible pour le moment</p>
          </div>
        ) : (
          <div className="plans-grid">
            {types.map((type) => (
              <div
                key={type.id}
                className={`plan-card ${type.nom === 'Standard' ? 'popular' : ''}`}
              >
                {type.nom === 'Standard' && (
                  <div className="popular-badge">Le plus populaire</div>
                )}
                <h3>{type.nom}</h3>
                <div className="plan-price">
                  <span className="price">{type.prix?.toLocaleString('fr-FR')}</span>
                  <span className="currency">FCFA</span>
                  <span className="period">/{type.dureeJours >= 365 ? 'an' : 'mois'}</span>
                </div>
                <p className="plan-description">{type.description}</p>
                <ul className="plan-features">
                  <li><FiCheck /> Acces aux contenus educatifs</li>
                  <li><FiCheck /> Suivi de progression</li>
                  <li><FiCheck /> Mode kiosque securise</li>
                  {type.nom !== 'Decouverte' && (
                    <li><FiCheck /> Tous les domaines educatifs</li>
                  )}
                  {type.nom === 'Premium Annuel' && (
                    <>
                      <li><FiCheck /> Telechargement offline</li>
                      <li><FiCheck /> 2 mois offerts</li>
                    </>
                  )}
                </ul>
                <button
                  className={`btn-plan ${type.nom === 'Standard' ? 'primary' : ''}`}
                  onClick={() => handleSouscrire(type)}
                >
                  Souscrire
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="payment-section">
        <h3>Moyens de paiement acceptes</h3>
        <div className="payment-methods">
          <div className="payment-method">
            <div className="payment-icon orange">OM</div>
            <span>Orange Money</span>
          </div>
          <div className="payment-method">
            <div className="payment-icon blue">MM</div>
            <span>Moov Money</span>
          </div>
          <div className="payment-method">
            <div className="payment-icon wave">W</div>
            <span>Wave</span>
          </div>
        </div>
      </section>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedType(null);
          setSelectedEnfant(null);
        }}
        subscription={selectedType}
        enfantId={selectedEnfant || enfants[0]?.id}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export default Abonnements;
