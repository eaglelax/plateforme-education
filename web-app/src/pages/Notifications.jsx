import { useEffect, useState } from 'react';
import {
  FiBell,
  FiCheck,
  FiCreditCard,
  FiUser,
  FiAward,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
} from 'react-icons/fi';
import { notificationService } from '../services/api';
import { DEMO_DATA } from '../hooks/useApi';
import './Notifications.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('toutes');
  const [useDemoData, setUseDemoData] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getMesNotifications();
      setNotifications(response.data.data || response.data || []);
      setUseDemoData(false);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
      // Utiliser les donnees de demonstration
      setNotifications(DEMO_DATA.notifications);
      setUseDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.marquerLue(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lue: true } : n))
      );
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.lue).map((n) => n.id);
      await Promise.all(unreadIds.map((id) => notificationService.marquerLue(id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
    } catch (error) {
      console.error('Erreur:', error);
      // Marquer localement meme si erreur API
      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ABONNEMENT':
        return <FiCreditCard />;
      case 'BADGE':
        return <FiAward />;
      case 'PAIEMENT':
        return <FiCheckCircle />;
      case 'PROGRESSION':
        return <FiUser />;
      case 'ALERTE':
        return <FiAlertCircle />;
      default:
        return <FiBell />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'ABONNEMENT':
        return 'var(--warning)';
      case 'BADGE':
        return '#F2C94C';
      case 'PAIEMENT':
        return 'var(--success)';
      case 'PROGRESSION':
        return 'var(--primary)';
      case 'ALERTE':
        return 'var(--danger)';
      default:
        return 'var(--info)';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    return date.toLocaleDateString('fr-FR');
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'toutes') return true;
    if (filter === 'non-lues') return !n.lue;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.lue).length;

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      {useDemoData && (
        <div className="demo-banner">
          <FiAlertCircle />
          <span>Mode demonstration - Notifications fictives</span>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>
            <FiBell /> Notifications
          </h1>
          {unreadCount > 0 && (
            <p>{unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" onClick={handleMarkAllAsRead}>
            <FiCheck /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="filters-row">
        <button
          className={`filter-btn ${filter === 'toutes' ? 'active' : ''}`}
          onClick={() => setFilter('toutes')}
        >
          Toutes
        </button>
        <button
          className={`filter-btn ${filter === 'non-lues' ? 'active' : ''}`}
          onClick={() => setFilter('non-lues')}
        >
          Non lues {unreadCount > 0 && <span className="count">{unreadCount}</span>}
        </button>
        <button
          className={`filter-btn ${filter === 'ABONNEMENT' ? 'active' : ''}`}
          onClick={() => setFilter('ABONNEMENT')}
        >
          Abonnement
        </button>
        <button
          className={`filter-btn ${filter === 'BADGE' ? 'active' : ''}`}
          onClick={() => setFilter('BADGE')}
        >
          Badges
        </button>
        <button
          className={`filter-btn ${filter === 'PAIEMENT' ? 'active' : ''}`}
          onClick={() => setFilter('PAIEMENT')}
        >
          Paiements
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="empty-state card">
          <FiBell size={48} />
          <h3>Aucune notification</h3>
          <p>Vous n'avez pas de nouvelles notifications pour le moment</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.lue ? 'unread' : ''}`}
              onClick={() => !notification.lue && handleMarkAsRead(notification.id)}
            >
              <div
                className="notification-icon"
                style={{ backgroundColor: `${getNotificationColor(notification.type)}20`, color: getNotificationColor(notification.type) }}
              >
                {getNotificationIcon(notification.type)}
              </div>
              <div className="notification-content">
                <h4>{notification.titre}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">
                  <FiClock /> {formatDate(notification.dateCreation)}
                </span>
              </div>
              {!notification.lue && <div className="unread-dot"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
