import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI, profileAPI } from '../api';
import NotificationPanel from './NotificationPanel';

const Navbar = ({ onThemeChange, currentTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    loadNotifications();
    loadProfile();
    
    // Опрос каждые 30 секунд для новых уведомлений
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getUnread();
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const response = await profileAPI.getSettings();
      if (response.data.settings?.avatar_path) {
        setAvatar(response.data.settings.avatar_path);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    onThemeChange(newTheme);
  };

  const typeIcons = {
    supply: 'bx-detail text-blue-500',
    writeoff: 'bx-export text-amber-500',
    material: 'bx-package text-green-500',
    admin: 'bx-shield-quarter text-red-500',
    system: 'bx-bell text-purple-500'
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-logo">
          <i className='bx bx-package'></i>
          <span>Склад</span>
        </div>
      </div>

      <div className="navbar-right">
        {/* Переключатель темы */}
        <button 
          className="navbar-btn" 
          onClick={toggleTheme}
          title={currentTheme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          {currentTheme === 'light' ? (
            <i className='bx bx-moon'></i>
          ) : (
            <i className='bx bx-sun'></i>
          )}
        </button>

        {/* Уведомления */}
        <div className="relative">
          <button 
            className="navbar-btn notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <i className='bx bx-bell'></i>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <NotificationPanel 
              onClose={() => setShowNotifications(false)}
              onRefresh={loadNotifications}
            />
          )}
        </div>

        {/* Профиль */}
        <div className="relative">
          <button 
            className="navbar-profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {avatar ? (
              <img src={`/uploads/avatars/${avatar}`} alt="Аватар" className="navbar-avatar" />
            ) : (
              <div className="navbar-avatar-placeholder">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="navbar-username">{user?.full_name || 'Пользователь'}</span>
            <i className='bx bx-chevron-down'></i>
          </button>

          {showProfileMenu && (
            <div className="profile-menu">
              <button 
                className="profile-menu-item"
                onClick={() => {
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
              >
                <i className='bx bx-user'></i>
                Профиль
              </button>
              <button 
                className="profile-menu-item"
                onClick={() => {
                  navigate('/profile', { state: { tab: 'settings' } });
                  setShowProfileMenu(false);
                }}
              >
                <i className='bx bx-cog'></i>
                Настройки
              </button>
              <hr className="profile-menu-divider" />
              <button 
                className="profile-menu-item danger"
                onClick={handleLogout}
              >
                <i className='bx bx-log-out'></i>
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
