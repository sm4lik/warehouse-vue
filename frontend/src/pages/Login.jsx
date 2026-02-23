import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
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
    setLoading(true);
    setError('');

    try {
      await login(formData);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className='bx bx-package text-white text-3xl'></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Система управления складом</h1>
            <p className="text-gray-500 mt-1">Вход в систему</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
              <i className='bx bx-error-circle text-xl flex-shrink-0'></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Логин</label>
              <div className="relative">
                <i className='bx bx-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                <input
                  type="text"
                  className="input-field pl-12"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoFocus
                  placeholder="Введите логин"
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
                  placeholder="Введите пароль"
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
                  Вход...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className='bx bx-log-in'></i>
                  Войти
                </span>
              )}
            </button>

            <div className="text-center">
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Нет аккаунта? Зарегистрироваться
              </Link>
            </div>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <i className='bx bx-info-circle text-blue-500'></i>
              Доступ по умолчанию:
            </p>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Логин:</span>
                <code className="bg-white px-2 py-0.5 rounded border border-gray-300">admin</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Пароль:</span>
                <code className="bg-white px-2 py-0.5 rounded border border-gray-300">admin123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
