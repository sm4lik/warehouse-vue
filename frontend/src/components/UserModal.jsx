import { useState, useEffect } from 'react';
import { usersAPI } from '../api';

const UserModal = ({ show, onClose, user, roles }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    role_id: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        confirm_password: '',
        full_name: user.full_name || '',
        role_id: user.role_id?.toString() || '',
        is_active: user.is_active ?? true
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        full_name: '',
        role_id: roles[0]?.id?.toString() || '',
        is_active: true
      });
    }
    setError('');
  }, [user, show, roles]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!user && formData.password !== formData.confirm_password) {
      setError('Пароли не совпадают');
      return;
    }

    if (!user && formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      const { confirm_password, password, ...data } = formData;
      
      if (password) {
        data.password = password;
      }
      
      data.role_id = parseInt(data.role_id);

      if (user) {
        await usersAPI.update(user.id, data);
      } else {
        await usersAPI.create(data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className='bx bx-user text-blue-600 text-xl'></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {user ? 'Редактировать пользователя' : 'Новый пользователь'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <i className='bx bx-x text-2xl'></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                <i className='bx bx-error-circle text-xl flex-shrink-0'></i>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="input-label">ФИО *</label>
              <div className="relative">
                <i className='bx bx-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                <input
                  type="text"
                  className="input-field pl-12"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  autoFocus
                  placeholder="Иванов Иван Иванович"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Логин *</label>
                <input
                  type="text"
                  className="input-field"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="username"
                />
              </div>

              <div>
                <label className="input-label">Email *</label>
                <div className="relative">
                  <i className='bx bx-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                  <input
                    type="email"
                    className="input-field pl-12"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            {!user && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Пароль *</label>
                    <div className="relative">
                      <i className='bx bx-lock-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                      <input
                        type="password"
                        className="input-field pl-12"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        placeholder="Минимум 6 символов"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Подтверждение пароля *</label>
                    <div className="relative">
                      <i className='bx bx-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                      <input
                        type="password"
                        className="input-field pl-12"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        required
                        placeholder="Повторите пароль"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {user && (
              <div>
                <label className="input-label">Новый пароль (оставьте пустым, чтобы не менять)</label>
                <div className="relative">
                  <i className='bx bx-lock-alt absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                  <input
                    type="password"
                    className="input-field pl-12"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    placeholder="Новый пароль"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="input-label">Роль *</label>
              <select
                className="input-field"
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                required
              >
                <option value="">Выберите роль</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name === 'admin' ? 'Администратор' :
                     role.name === 'manager' ? 'Менеджер' : 'Пользователь'}
                  </option>
                ))}
              </select>
            </div>

            {user && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  name="is_active"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Активен (пользователь может входить в систему)
                </label>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <i className='bx bx-loader-alt animate-spin'></i>
                  Сохранение...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <i className='bx bx-check'></i>
                  Сохранить
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
