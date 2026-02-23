import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, hasRole, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <i className='bx bx-package text-white text-xl'></i>
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">Склад</h1>
            <p className="text-xs text-gray-400">Система управления</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-1">
        <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className='bx bx-grid-alt text-lg'></i>
          <span>Главная</span>
        </NavLink>
        <NavLink to="/materials" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className='bx bx-package text-lg'></i>
          <span>Материалы</span>
        </NavLink>
        <NavLink to="/supplies" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className='bx bx-detail text-lg'></i>
          <span>Поставки</span>
        </NavLink>
        {(hasRole('admin', 'manager')) && (
          <NavLink to="/transactions" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <i className='bx bx-receipt text-lg'></i>
            <span>Транзакции</span>
          </NavLink>
        )}
        <NavLink to="/notes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <i className='bx bx-note text-lg'></i>
          <span>Заметки</span>
        </NavLink>
        {hasRole('admin') && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <i className='bx bx-cog text-lg'></i>
            <span>Администрирование</span>
          </NavLink>
        )}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button 
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
          onClick={logout}
        >
          <i className='bx bx-log-out'></i>
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
