import { useState, useEffect } from 'react';
import { materialsAPI, unitsAPI } from '../api';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import MaterialModal from '../components/MaterialModal';
import WriteoffModal from '../components/WriteoffModal';
import TransactionHistoryModal from '../components/TransactionHistoryModal';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showWriteoffModal, setShowWriteoffModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasRole } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materialsRes, unitsRes] = await Promise.all([
        materialsAPI.getAll(),
        unitsAPI.getAll()
      ]);
      setMaterials(materialsRes.data.materials);
      setUnits(unitsRes.data.units);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedMaterial(null);
    setShowModal(true);
  };

  const handleEdit = (material) => {
    setSelectedMaterial(material);
    setShowModal(true);
  };

  const handleWriteoff = (material) => {
    setSelectedMaterial(material);
    setShowWriteoffModal(true);
  };

  const handleViewHistory = (material) => {
    setSelectedMaterial(material);
    setShowHistoryModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить материал?')) return;

    try {
      await materialsAPI.delete(id);
      loadData();
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedMaterial(null);
    loadData();
  };

  const handleWriteoffClose = () => {
    setShowWriteoffModal(false);
    setSelectedMaterial(null);
    loadData();
  };

  const handleHistoryClose = () => {
    setShowHistoryModal(false);
    setSelectedMaterial(null);
  };

  const filteredMaterials = materials.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
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
              <h1 className="page-title">Материалы</h1>
              <p className="text-gray-500 mt-1">Управление складскими материалами</p>
            </div>
            {hasRole('admin', 'manager') && (
              <button className="btn-primary flex items-center gap-2" onClick={handleCreate}>
                <i className='bx bx-plus-circle text-lg'></i>
                <span>Добавить материал</span>
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
                  placeholder="Поиск материала..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Таблица материалов */}
          <div className="card">
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Наименование</th>
                      <th>Количество</th>
                      <th>Ед. изм.</th>
                      <th>Мин. остаток</th>
                      <th>Комментарий</th>
                      {hasRole('admin', 'manager') && <th className="text-right">Действия</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.map(material => (
                      <tr key={material.id}>
                        <td className="font-medium text-gray-900">{material.name}</td>
                        <td>
                          {material.quantity <= material.min_quantity && material.min_quantity > 0 ? (
                            <span className="badge badge-danger">{material.quantity}</span>
                          ) : (
                            <span className="text-gray-900">{material.quantity}</span>
                          )}
                        </td>
                        <td className="text-gray-500">{material.unit_short}</td>
                        <td className="text-gray-500">{material.min_quantity || '-'}</td>
                        <td>
                          <span className="text-gray-500 text-sm truncate max-w-xs block">
                            {material.comment?.substring(0, 50) || '-'}
                            {material.comment?.length > 50 ? '...' : ''}
                          </span>
                        </td>
                        {hasRole('admin', 'manager') && (
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                                onClick={() => handleEdit(material)}
                                title="Редактировать"
                              >
                                <i className='bx bx-edit-alt text-lg'></i>
                              </button>
                              <button
                                className="p-2 hover:bg-amber-50 rounded-lg transition-colors text-amber-600"
                                onClick={() => handleWriteoff(material)}
                                title="Списать"
                              >
                                <i className='bx bx-export text-lg'></i>
                              </button>
                              <button
                                className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600"
                                onClick={() => handleViewHistory(material)}
                                title="Просмотреть списания"
                              >
                                <i className='bx bx-history text-lg'></i>
                              </button>
                              <button
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                                onClick={() => handleDelete(material.id)}
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

      <MaterialModal
        show={showModal}
        onClose={handleModalClose}
        material={selectedMaterial}
        units={units}
      />

      <WriteoffModal
        show={showWriteoffModal}
        onClose={handleWriteoffClose}
        material={selectedMaterial}
      />

      <TransactionHistoryModal
        show={showHistoryModal}
        onClose={handleHistoryClose}
        material={selectedMaterial}
      />
    </Layout>
  );
};

export default Materials;
