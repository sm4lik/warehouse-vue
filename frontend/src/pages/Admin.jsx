import { useState, useEffect } from 'react';
import { usersAPI } from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import UserModal from '../components/UserModal';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getRoles()
      ]);
      setUsers(usersRes.data.users);
      setRoles(rolesRes.data.roles);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      alert('Нельзя удалить самого себя');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите удалить пользователя?')) return;

    try {
      await usersAPI.delete(id);
      loadData();
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await usersAPI.update(user.id, { is_active: !user.is_active });
      loadData();
    } catch (error) {
      alert('Ошибка: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedUser(null);
    loadData();
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
          <div className="page-header">
            <div>
              <h1 className="page-title">Администрирование</h1>
              <p className="text-gray-500 mt-1">Управление пользователями и ролями</p>
            </div>
            <button className="btn-primary flex items-center gap-2" onClick={handleCreate}>
              <i className='bx bx-user-plus text-lg'></i>
              <span>Добавить пользователя</span>
            </button>
          </div>

          {/* Таблица пользователей */}
          <div className="card">
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Пользователь</th>
                      <th>Email</th>
                      <th>Роль</th>
                      <th>Статус</th>
                      <th>Дата регистрации</th>
                      <th className="text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="text-gray-500">#{u.id}</td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {u.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{u.full_name}</p>
                              <p className="text-sm text-gray-500">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-gray-700">{u.email}</td>
                        <td>
                          {u.role_name === 'admin' ? (
                            <span className="badge badge-danger">
                              <i className='bx bx-shield-quarter mr-1'></i>
                              Администратор
                            </span>
                          ) : u.role_name === 'manager' ? (
                            <span className="badge badge-primary">
                              <i className='bx bx-briefcase mr-1'></i>
                              Менеджер
                            </span>
                          ) : (
                            <span className="badge badge-secondary bg-gray-100 text-gray-700">
                              <i className='bx bx-user mr-1'></i>
                              Пользователь
                            </span>
                          )}
                        </td>
                        <td>
                          {u.is_active ? (
                            <span className="badge badge-success">
                              <i className='bx bx-check-circle mr-1'></i>
                              Активен
                            </span>
                          ) : (
                            <span className="badge badge-danger">
                              <i className='bx bx-block mr-1'></i>
                              Заблокирован
                            </span>
                          )}
                        </td>
                        <td className="text-gray-500 text-sm">
                          {new Date(u.created_at).toLocaleDateString('ru-RU')}
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                              onClick={() => handleEdit(u)}
                              title="Редактировать"
                            >
                              <i className='bx bx-edit-alt text-lg'></i>
                            </button>
                            <button
                              className={`p-2 hover:bg-amber-50 rounded-lg transition-colors ${
                                u.is_active ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                              onClick={() => handleToggleActive(u)}
                              title={u.is_active ? 'Заблокировать' : 'Разблокировать'}
                              disabled={u.id === currentUser?.id}
                            >
                              {u.is_active ? (
                                <i className='bx bx-lock-alt text-lg'></i>
                              ) : (
                                <i className='bx bx-lock-open text-lg'></i>
                              )}
                            </button>
                            <button
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                              onClick={() => handleDelete(u.id)}
                              title="Удалить"
                              disabled={u.id === currentUser?.id}
                            >
                              <i className='bx bx-trash text-lg'></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Информация о ролях */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {roles.map(role => (
              <div key={role.id} className="card">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      role.name === 'admin' ? 'bg-red-100' :
                      role.name === 'manager' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {role.name === 'admin' ? (
                        <i className='bx bx-shield-quarter text-2xl text-red-600'></i>
                      ) : role.name === 'manager' ? (
                        <i className='bx bx-briefcase text-2xl text-blue-600'></i>
                      ) : (
                        <i className='bx bx-user text-2xl text-gray-600'></i>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {role.name === 'admin' ? 'Администратор' :
                         role.name === 'manager' ? 'Менеджер' : 'Пользователь'}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {role.id}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{role.description || 'Описание отсутствует'}</p>
                </div>
              </div>
            ))}
          </div>
      </div>

      <UserModal
        show={showModal}
        onClose={handleModalClose}
        user={selectedUser}
        roles={roles}
      />
    </Layout>
  );
};

export default Admin;
