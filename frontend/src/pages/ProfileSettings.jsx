import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI, notificationsAPI } from '../api';
import Layout from '../components/Layout';

const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');

  // Профиль
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    full_name: ''
  });
  
  // Настройки
  const [settings, setSettings] = useState({
    theme: 'light',
    notify_supply: true,
    notify_writeoff: true,
    notify_material: true,
    notify_admin: true
  });
  
  // Пароль
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Аватар
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  
  // Уведомления для админа
  const [users, setUsers] = useState([]);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'admin',
    user_id: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
    
    const stateTab = location.state?.tab;
    if (stateTab) {
      setActiveTab(stateTab);
    }
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, settingsRes] = await Promise.all([
        profileAPI.getProfile(),
        profileAPI.getSettings()
      ]);
      
      setProfileData({
        username: profileRes.data.user.username,
        email: profileRes.data.user.email,
        full_name: profileRes.data.user.full_name
      });
      
      setSettings({
        theme: settingsRes.data.settings?.theme || 'light',
        notify_supply: settingsRes.data.settings?.notify_supply ?? true,
        notify_writeoff: settingsRes.data.settings?.notify_writeoff ?? true,
        notify_material: settingsRes.data.settings?.notify_material ?? true,
        notify_admin: settingsRes.data.settings?.notify_admin ?? true
      });

      if (settingsRes.data.settings?.avatar_path) {
        setAvatarPreview(`/uploads/avatars/${settingsRes.data.settings.avatar_path}`);
      }
      
      // Загрузка пользователей для админа
      if (user?.role === 'admin') {
        const usersRes = await notificationsAPI.getUsersList();
        setUsers(usersRes.data.users);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      setMessage({ type: 'error', text: 'Ошибка загрузки данных' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await profileAPI.updateProfile(profileData);
      setMessage({ type: 'success', text: 'Профиль обновлён' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Ошибка обновления' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await profileAPI.updateSettings(settings);
      
      // Обновление темы в Navbar
      document.documentElement.setAttribute('data-theme', settings.theme);
      localStorage.setItem('theme', settings.theme);
      
      setMessage({ type: 'success', text: 'Настройки сохранены' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: 'Пароль должен быть не менее 6 символов' });
      return;
    }
    
    setSaving(true);
    try {
      await profileAPI.updatePassword(passwordData);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setMessage({ type: 'success', text: 'Пароль изменён' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Ошибка изменения пароля' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Файл больше 5MB' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        handleUploadAvatar(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async (file) => {
    setSaving(true);
    try {
      const response = await profileAPI.uploadAvatar(file);
      setAvatarPreview(response.data.avatar_path);
      setMessage({ type: 'success', text: 'Аватар загружен' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Ошибка загрузки' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await profileAPI.deleteAvatar();
      setAvatarPreview(null);
      setMessage({ type: 'success', text: 'Аватар удалён' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка удаления' });
    }
  };

  const handleSendNotification = async () => {
    setSaving(true);
    try {
      await notificationsAPI.send(notificationData);
      setNotificationData({ title: '', message: '', type: 'admin', user_id: '' });
      setMessage({ type: 'success', text: 'Уведомление отправлено' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Ошибка отправки' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <i className='bx bx-loader-alt animate-spin text-5xl text-blue-600'></i>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-8">
            <h1 className="page-title mb-6">Настройки профиля</h1>
            
            {message.text && (
              <div className={`alert alert-${message.type} mb-6`}>
                {message.text}
              </div>
            )}
            
            {/* Табы */}
            <div className="tabs mb-6">
              <button 
                className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className='bx bx-user'></i>
                Профиль
              </button>
              <button 
                className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <i className='bx bx-cog'></i>
                Настройки
              </button>
              <button 
                className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className='bx bx-lock-alt'></i>
                Безопасность
              </button>
              {user?.role === 'admin' && (
                <button 
                  className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <i className='bx bx-bell'></i>
                  Уведомления
                </button>
              )}
            </div>
            
            {/* Контент табов */}
            <div className="card">
              <div className="card-body">
                {/* Профиль */}
                {activeTab === 'profile' && (
                  <div className="profile-tab">
                    <div className="avatar-section mb-6">
                      <div className="avatar-preview">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Аватар" />
                        ) : (
                          <div className="avatar-placeholder">
                            {user?.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="avatar-actions mt-4">
                        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                          <i className='bx bx-upload'></i>
                          Загрузить
                        </button>
                        {avatarPreview && (
                          <button className="btn-danger ml-2" onClick={handleDeleteAvatar}>
                            <i className='bx bx-trash'></i>
                            Удалить
                          </button>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="input-label">ФИО</label>
                        <input
                          type="text"
                          className="input-field"
                          name="full_name"
                          value={profileData.full_name}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <label className="input-label">Логин</label>
                        <input
                          type="text"
                          className="input-field"
                          name="username"
                          value={profileData.username}
                          onChange={handleProfileChange}
                        />
                      </div>
                      <div>
                        <label className="input-label">Email</label>
                        <input
                          type="email"
                          className="input-field"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                    
                    <button 
                      className="btn-primary mt-6" 
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? 'Сохранение...' : 'Сохранить изменения'}
                    </button>
                  </div>
                )}
                
                {/* Настройки */}
                {activeTab === 'settings' && (
                  <div className="settings-tab">
                    <h3 className="text-lg font-semibold mb-4">Тема оформления</h3>
                    <div className="flex gap-4 mb-6">
                      <label className="theme-option">
                        <input
                          type="radio"
                          name="theme"
                          value="light"
                          checked={settings.theme === 'light'}
                          onChange={handleSettingsChange}
                        />
                        <div className="theme-preview light">
                          <i className='bx bx-sun'></i>
                          Светлая
                        </div>
                      </label>
                      <label className="theme-option">
                        <input
                          type="radio"
                          name="theme"
                          value="dark"
                          checked={settings.theme === 'dark'}
                          onChange={handleSettingsChange}
                        />
                        <div className="theme-preview dark">
                          <i className='bx bx-moon'></i>
                          Тёмная
                        </div>
                      </label>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-4">Уведомления</h3>
                    <div className="space-y-3">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="notify_supply"
                          checked={settings.notify_supply}
                          onChange={handleSettingsChange}
                        />
                        <span>О поставках</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="notify_writeoff"
                          checked={settings.notify_writeoff}
                          onChange={handleSettingsChange}
                        />
                        <span>О списаниях</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="notify_material"
                          checked={settings.notify_material}
                          onChange={handleSettingsChange}
                        />
                        <span>О добавлении материалов</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="notify_admin"
                          checked={settings.notify_admin}
                          onChange={handleSettingsChange}
                        />
                        <span>От администратора</span>
                      </label>
                    </div>
                    
                    <button 
                      className="btn-primary mt-6" 
                      onClick={handleSaveSettings}
                      disabled={saving}
                    >
                      {saving ? 'Сохранение...' : 'Сохранить настройки'}
                    </button>
                  </div>
                )}
                
                {/* Безопасность */}
                {activeTab === 'security' && (
                  <div className="security-tab">
                    <h3 className="text-lg font-semibold mb-4">Смена пароля</h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="input-label">Текущий пароль</label>
                        <input
                          type="password"
                          className="input-field"
                          name="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div>
                        <label className="input-label">Новый пароль</label>
                        <input
                          type="password"
                          className="input-field"
                          name="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div>
                        <label className="input-label">Подтверждение пароля</label>
                        <input
                          type="password"
                          className="input-field"
                          name="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                        />
                      </div>
                    </div>
                    
                    <button 
                      className="btn-primary mt-6" 
                      onClick={handleSavePassword}
                      disabled={saving}
                    >
                      {saving ? 'Сохранение...' : 'Изменить пароль'}
                    </button>
                  </div>
                )}
                
                {/* Уведомления (админ) */}
                {activeTab === 'notifications' && user?.role === 'admin' && (
                  <div className="notifications-tab">
                    <h3 className="text-lg font-semibold mb-4">Отправить уведомление</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="input-label">Получатель</label>
                        <select
                          className="input-field"
                          value={notificationData.user_id}
                          onChange={(e) => setNotificationData(prev => ({ 
                            ...prev, 
                            user_id: e.target.value ? parseInt(e.target.value) : '' 
                          }))}
                        >
                          <option value="">Всем пользователям</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.full_name} ({u.username})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Тип уведомления</label>
                        <select
                          className="input-field"
                          value={notificationData.type}
                          onChange={(e) => setNotificationData(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="admin">От администратора</option>
                          <option value="system">Системное</option>
                          <option value="supply">Поставка</option>
                          <option value="writeoff">Списание</option>
                          <option value="material">Материал</option>
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Заголовок</label>
                        <input
                          type="text"
                          className="input-field"
                          value={notificationData.title}
                          onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Введите заголовок"
                        />
                      </div>
                      <div>
                        <label className="input-label">Сообщение</label>
                        <textarea
                          className="input-field min-h-24"
                          value={notificationData.message}
                          onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                          placeholder="Введите сообщение"
                          rows={4}
                        />
                      </div>
                    </div>
                    
                    <button 
                      className="btn-primary mt-6" 
                      onClick={handleSendNotification}
                      disabled={saving}
                    >
                      {saving ? 'Отправка...' : 'Отправить уведомление'}
                    </button>
                  </div>
                )}
              </div>
            </div>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
