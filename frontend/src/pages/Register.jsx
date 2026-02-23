import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    role_id: 3
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      const { confirm_password, ...data } = formData;
      await register(data);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className='bx bx-package text-white text-3xl'></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
            <p className="text-gray-500 mt-1">Создание нового аккаунта</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
              <i className='bx bx-error-circle text-xl flex-shrink-0'></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">ФИО</label>
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

            <div>
              <label className="input-label">Логин</label>
              <div className="relative">
                <i className='bx bx-at absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                <input
                  type="text"
                  className="input-field pl-12"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="Придумайте логин"
                />
              </div>
            </div>
            
            <div>
              <label className="input-label">Email</label>
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

            <div>
              <label className="input-label">Пароль</label>
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
              <label className="input-label">Подтверждение пароля</label>
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

            <button 
              type="submit" 
              className="btn-primary w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className='bx bx-loader-alt animate-spin'></i>
                  Регистрация...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className='bx bx-user-plus'></i>
                  Зарегистрироваться
                </span>
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Уже есть аккаунт? Войти
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
