import { useState, useEffect } from 'react';
import { materialsAPI } from '../api';
import Layout from '../components/Layout';
import { exportTransactionsToExcel } from '../utils/excelExport';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const materialsRes = await materialsAPI.getAll();
      setMaterials(materialsRes.data.materials);
      
      const allTransactions = [];
      for (const material of materialsRes.data.materials) {
        try {
          const transRes = await materialsAPI.getTransactions(material.id);
          const transWithMaterial = transRes.data.transactions.map(t => ({
            ...t,
            material_name: material.name,
            unit_short: material.unit_short
          }));
          allTransactions.push(...transWithMaterial);
        } catch (error) {
          console.error(`Ошибка загрузки транзакций для ${material.id}:`, error);
        }
      }
      
      allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesMaterial = !selectedMaterial || t.material_id === parseInt(selectedMaterial);
    
    const matchesSearch = searchTerm === '' || 
      (t.material_name && t.material_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.full_name && t.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.username && t.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.recipient_name && t.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.document_number && t.document_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.comment && t.comment.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || t.transaction_type === filterType;

    return matchesMaterial && matchesSearch && matchesType;
  });

  const handleExport = () => {
    exportTransactionsToExcel(filteredTransactions);
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
              <h1 className="page-title">Транзакции</h1>
              <p className="text-gray-500 mt-1">История движения материалов</p>
            </div>
            <button className="btn-success flex items-center gap-2" onClick={handleExport}>
              <i className='bx bx-file-excel text-lg'></i>
              <span>Выгрузить в Excel</span>
            </button>
          </div>

          {/* Фильтр */}
          <div className="card mb-6">
            <div className="card-body py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Поиск */}
                <div>
                  <label className="input-label">Поиск</label>
                  <div className="relative">
                    <i className='bx bx-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                    <input
                      type="text"
                      className="input-field pl-12"
                      placeholder="По материалу, пользователю, получателю, документу..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Фильтр по материалу */}
                <div>
                  <label className="input-label">Фильтр по материалу</label>
                  <select
                    className="input-field"
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                  >
                    <option value="">Все материалы</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Фильтр по типу */}
                <div>
                  <label className="input-label">Тип операции</label>
                  <select
                    className="input-field"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">Все типы</option>
                    <option value="in">Приход</option>
                    <option value="out">Списание</option>
                  </select>
                </div>
              </div>
              
              {/* Кнопки сброса */}
              {(searchTerm || selectedMaterial || filterType !== 'all') && (
                <div className="mt-4 flex gap-2">
                  {searchTerm && (
                    <button
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className='bx bx-x mr-1'></i>
                      Сбросить поиск
                    </button>
                  )}
                  {selectedMaterial && (
                    <button
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => setSelectedMaterial('')}
                    >
                      <i className='bx bx-x mr-1'></i>
                      Сбросить материал
                    </button>
                  )}
                  {filterType !== 'all' && (
                    <button
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      onClick={() => setFilterType('all')}
                    >
                      <i className='bx bx-x mr-1'></i>
                      Сбросить тип
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Таблица транзакций */}
          <div className="card">
            <div className="card-body p-0">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Материал</th>
                      <th>Тип</th>
                      <th className="text-right">Количество</th>
                      <th>Пользователь</th>
                      <th>Получатель</th>
                      <th>Документ</th>
                      <th>Комментарий</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-gray-500 py-12">
                          <i className='bx bx-inbox text-5xl text-gray-300 mb-3'></i>
                          <p>Транзакций не найдено</p>
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(t => (
                        <tr key={t.id}>
                          <td className="text-gray-500 text-sm">
                            {new Date(t.created_at).toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="font-medium text-gray-900">{t.material_name}</td>
                          <td>
                            {t.transaction_type === 'in' ? (
                              <span className="badge badge-success">
                                <i className='bx bx-arrow-to-bottom mr-1'></i>
                                Приход
                              </span>
                            ) : (
                              <span className="badge badge-warning">
                                <i className='bx bx-arrow-from-top mr-1'></i>
                                Списание
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            <strong className="text-gray-900">{t.quantity}</strong>
                            <span className="text-gray-500 text-sm ml-1">{t.unit_short}</span>
                          </td>
                          <td className="text-gray-700">{t.full_name || t.username}</td>
                          <td className="text-gray-700">
                            {t.recipient_name || '-'}
                          </td>
                          <td className="text-gray-700">
                            {t.document_number ? (
                              <span className="text-blue-600 font-medium">{t.document_number}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td>
                            <span className="text-gray-500 text-sm truncate block max-w-xs">
                              {t.comment?.substring(0, 40) || '-'}
                              {t.comment?.length > 40 ? '...' : ''}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </div>
    </Layout>
  );
};

export default Transactions;
