import { useState, useEffect } from 'react';
import { materialsAPI } from '../api';

const TransactionHistoryModal = ({ show, onClose, material }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (show && material) {
      loadTransactions();
    }
  }, [show, material]);

  const loadTransactions = async () => {
    if (!material) return;

    setLoading(true);
    try {
      const response = await materialsAPI.getTransactions(material.id);
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Ошибка загрузки транзакций:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = searchTerm === '' || 
      (t.full_name && t.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.username && t.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.recipient_name && t.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.document_number && t.document_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.comment && t.comment.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || t.transaction_type === filterType;

    return matchesSearch && matchesType;
  });

  if (!material || !show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className='bx bx-history text-blue-600 text-xl'></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">История транзакций</h2>
              <p className="text-sm text-gray-500">{material.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <i className='bx bx-x text-2xl'></i>
          </button>
        </div>

        <div className="modal-body">
          {/* Фильтры */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <i className='bx bx-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
              <input
                type="text"
                className="input-field pl-12"
                placeholder="Поиск по пользователю, получателю, документу, комментарию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="input-label text-xs">Тип</label>
              <select
                className="input-field"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Все</option>
                <option value="in">Приход</option>
                <option value="out">Списание</option>
              </select>
            </div>
          </div>

          {/* Таблица транзакций */}
          <div className="table-container" style={{ maxHeight: '400px', overflow: 'auto' }}>
            <table className="table">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th>Дата</th>
                  <th>Тип</th>
                  <th className="text-right">Количество</th>
                  <th>Пользователь</th>
                  <th>Получатель</th>
                  <th>Документ</th>
                  <th>Комментарий</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8">
                      <i className='bx bx-loader-alt animate-spin text-3xl text-blue-600'></i>
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-gray-500 py-8">
                      <i className='bx bx-inbox text-4xl text-gray-300 mb-2'></i>
                      <p>Транзакций не найдено</p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map(t => (
                    <tr key={t.id}>
                      <td className="text-gray-500 text-sm whitespace-nowrap">
                        {new Date(t.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
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
                      <td className="text-gray-700">{t.recipient_name || '-'}</td>
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

          {/* Итого */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <i className='bx bx-arrow-to-bottom text-green-600'></i>
                <span className="text-gray-600">Всего приход:</span>
                <strong className="text-gray-900">
                  {filteredTransactions
                    .filter(t => t.transaction_type === 'in')
                    .reduce((sum, t) => sum + parseFloat(t.quantity), 0)
                    .toFixed(3)} {material.unit_short}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <i className='bx bx-arrow-from-top text-amber-600'></i>
                <span className="text-gray-600">Всего списано:</span>
                <strong className="text-gray-900">
                  {filteredTransactions
                    .filter(t => t.transaction_type === 'out')
                    .reduce((sum, t) => sum + parseFloat(t.quantity), 0)
                    .toFixed(3)} {material.unit_short}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryModal;
