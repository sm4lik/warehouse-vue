import { useState, useEffect } from 'react';
import { suppliesAPI } from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import SupplyModal from '../components/SupplyModal';
import SupplyViewModal from '../components/SupplyViewModal';

const Supplies = () => {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasRole } = useAuth();

  useEffect(() => {
    loadSupplies();
  }, []);

  const loadSupplies = async () => {
    try {
      const response = await suppliesAPI.getAll();
      setSupplies(response.data.supplies);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedSupply(null);
    setShowModal(true);
  };

  const handleEdit = async (supply) => {
    try {
      // Загружаем полную информацию о поставке с позициями
      const response = await suppliesAPI.getById(supply.id);
      setSelectedSupply(response.data.supply);
      setShowModal(true);
    } catch (error) {
      alert('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleView = async (supply) => {
    try {
      const response = await suppliesAPI.getById(supply.id);
      setSelectedSupply(response.data.supply);
      setShowViewModal(true);
    } catch (error) {
      alert('Ошибка загрузки: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить поставку?')) return;

    try {
      await suppliesAPI.delete(id);
      loadSupplies();
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSupply(null);
    loadSupplies();
  };

  const handleViewModalClose = () => {
    setShowViewModal(false);
    setSelectedSupply(null);
  };

  const filteredSupplies = supplies.filter(s =>
    s.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.buyer.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="page-title">Поставки</h1>
              <p className="text-gray-500 mt-1">Управление поставками товаров</p>
            </div>
            {hasRole('admin', 'manager') && (
              <button className="btn-primary flex items-center gap-2" onClick={handleCreate}>
                <i className='bx bx-plus-circle text-lg'></i>
                <span>Добавить поставку</span>
              </button>
            )}
          </div>

          {/* Поиск */}
          <div className="card mb-6">
            <div className="card-body py-4">
              <div className="relative">
                <i className='bx bx-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl'></i>
                <input
                  type="text"
                  className="input-field pl-12"
                  placeholder="Поиск по документу, поставщику или покупателю..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Таблица поставок */}
          <div className="card">
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Документ</th>
                      <th>Поставщик</th>
                      <th>Покупатель</th>
                      <th>Получатель</th>
                      <th>Дата</th>
                      <th>Файлы</th>
                      {hasRole('admin', 'manager') && <th className="text-right">Действия</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSupplies.map(supply => (
                      <tr key={supply.id}>
                        <td>
                          <span className="font-semibold text-blue-600">{supply.document_number}</span>
                        </td>
                        <td className="text-gray-700">{supply.supplier}</td>
                        <td className="text-gray-700">{supply.buyer}</td>
                        <td className="text-gray-700">{supply.receiver}</td>
                        <td className="text-gray-500">
                          {new Date(supply.supply_date).toLocaleDateString('ru-RU')}
                        </td>
                        <td>
                          {supply.files && supply.files.length > 0 ? (
                            <span className="badge badge-info">
                              <i className='bx bx-paperclip mr-1'></i>
                              {supply.files.length}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        {hasRole('admin', 'manager') && (
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                                onClick={() => handleView(supply)}
                                title="Просмотр"
                              >
                                <i className='bx bx-show text-lg'></i>
                              </button>
                              <button
                                className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-600"
                                onClick={() => handleEdit(supply)}
                                title="Редактировать"
                              >
                                <i className='bx bx-edit-alt text-lg'></i>
                              </button>
                              <button
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                onClick={() => handleDelete(supply.id)}
                                title="Удалить"
                              >
                                <i className='bx bx-trash text-lg'></i>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </div>

      <SupplyModal
        show={showModal}
        onClose={handleModalClose}
        supply={selectedSupply}
      />

      <SupplyViewModal
        show={showViewModal}
        onClose={handleViewModalClose}
        supply={selectedSupply}
      />
    </Layout>
  );
};

export default Supplies;
