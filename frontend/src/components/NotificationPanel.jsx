import { useState, useEffect, useRef } from 'react';
import { notificationsAPI } from '../api';

const NotificationPanel = ({ onClose, onRefresh }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data.notifications.slice(0, 10));
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      onRefresh();
    } catch (error) {
      console.error('Ошибка отметки уведомления:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      onRefresh();
    } catch (error) {
      console.error('Ошибка отметки всех уведомлений:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
      onRefresh();
    } catch (error) {
      console.error('Ошибка удаления уведомления:', error);
    }
  };

  const handleClearRead = async () => {
    try {
      await notificationsAPI.clearRead();
      setNotifications(notifications.filter(n => !n.is_read));
      onRefresh();
    } catch (error) {
      console.error('Ошибка очистки уведомлений:', error);
    }
  };

  const typeLabels = {
    supply: { label: 'Поставка', icon: 'bx-detail' },
    writeoff: { label: 'Списание', icon: 'bx-export' },
    material: { label: 'Материал', icon: 'bx-package' },
    admin: { label: 'Администратор', icon: 'bx-shield-quarter' },
    system: { label: 'Системное', icon: 'bx-bell' }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <div className="notification-panel" ref={panelRef}>
      <div className="notification-panel-header">
        <h3>Уведомления</h3>
        <div className="notification-panel-actions">
          <button 
            onClick={handleMarkAllAsRead} 
            className="notification-icon-btn"
            title="Прочитать все"
          >
            <i className='bx bx-check-double'></i>
          </button>
          <button 
            onClick={handleClearRead} 
            className="notification-icon-btn"
            title="Очистить прочитанные"
          >
            <i className='bx bx-trash'></i>
          </button>
          <button 
            onClick={onClose} 
            className="notification-icon-btn"
            title="Закрыть"
          >
            <i className='bx bx-x'></i>
          </button>
        </div>
      </div>

      <div className="notification-panel-content">
        {loading ? (
          <div className="notification-loading">
            <i className='bx bx-loader-alt animate-spin'></i>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <i className='bx bx-bell-off'></i>
            <p>Нет уведомлений</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-icon">
                <i className={`bx ${typeLabels[notification.type]?.icon || 'bx-bell'}`}></i>
              </div>
              <div className="notification-body">
                <div className="notification-header">
                  <span className="notification-type">
                    {typeLabels[notification.type]?.label || notification.type}
                  </span>
                  <span className="notification-time">
                    {getTimeAgo(notification.created_at)}
                  </span>
                </div>
                <p className="notification-title">{notification.title}</p>
                <p className="notification-message">{notification.message}</p>
                {notification.sender_name && (
                  <p className="notification-sender">От: {notification.sender_name}</p>
                )}
              </div>
              <div className="notification-actions">
                {!notification.is_read && (
                  <button 
                    className="notification-action-btn"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Отметить как прочитанное"
                  >
                    <i className='bx bx-check'></i>
                  </button>
                )}
                <button 
                  className="notification-action-btn"
                  onClick={() => handleDelete(notification.id)}
                  title="Удалить"
                >
                  <i className='bx bx-trash'></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
