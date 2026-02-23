import { useState, useEffect } from 'react';
import { suppliesAPI } from '../api';

const SupplyViewModal = ({ show, onClose, supply }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && supply) {
      console.log('Supply data:', supply);
      console.log('Supply items:', supply.items);
    }
  }, [show, supply]);

  if (!show || !supply) return null;

  const handleDownloadFile = async (fileId, fileName) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/supplies/${supply.id}/files/${fileId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка скачивания');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      alert('Ошибка скачивания: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <i className='bx bx-detail text-indigo-600 text-xl'></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Поставка №{supply.document_number}</h2>
              <p className="text-sm text-gray-500">от {new Date(supply.supply_date).toLocaleDateString('ru-RU')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <i className='bx bx-x text-2xl'></i>
          </button>
        </div>
        
        <div className="modal-body space-y-6">
          {/* Основная информация */}
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <i className='bx bx-buildings text-blue-600'></i>
                <span className="text-sm font-medium text-gray-500">Поставщик</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{supply.supplier}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <i className='bx bx-user text-indigo-600'></i>
                <span className="text-sm font-medium text-gray-500">Покупатель</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{supply.buyer}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <i className='bx bx-package text-emerald-600'></i>
                <span className="text-sm font-medium text-gray-500">Получатель</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{supply.receiver}</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <i className='bx bx-calendar text-amber-600'></i>
                <span className="text-sm font-medium text-gray-500">Дата поставки</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(supply.supply_date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Комментарий */}
          {supply.comment && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <i className='bx bx-comment text-amber-600'></i>
                <span className="text-sm font-medium text-amber-800">Комментарий</span>
              </div>
              <p className="text-gray-700">{supply.comment}</p>
            </div>
          )}

          {/* Позиции */}
          {supply.items && supply.items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <i className='bx bx-list-ul text-blue-600'></i>
                Позиции поставки
              </h3>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>№</th>
                      <th>Материал</th>
                      <th className="text-right">Количество</th>
                      <th className="text-right">Цена</th>
                      <th className="text-right">Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supply.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td className="text-gray-500">{index + 1}</td>
                        <td className="font-medium text-gray-900">{item.material_name}</td>
                        <td className="text-right">
                          <span className="text-gray-900">{item.quantity}</span>
                          <span className="text-gray-500 text-sm ml-1">{item.unit_short}</span>
                        </td>
                        <td className="text-right text-gray-700">
                          {parseFloat(item.price) > 0 ? `${parseFloat(item.price).toFixed(2)} ₽` : '-'}
                        </td>
                        <td className="text-right font-semibold text-gray-900">
                          {parseFloat(item.price) > 0 ? `${(parseFloat(item.quantity) * parseFloat(item.price)).toFixed(2)} ₽` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="text-right font-semibold text-gray-700">Итого:</td>
                      <td className="text-right font-bold text-blue-600 text-lg">
                        {supply.items.reduce((sum, item) => sum + (parseFloat(item.quantity) * (parseFloat(item.price) || 0)), 0).toFixed(2)} ₽
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Файлы */}
          {supply.files && supply.files.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <i className='bx bx-paperclip text-blue-600'></i>
                Прикрепленные файлы
              </h3>
              <div className="space-y-2">
                {supply.files.map((file, index) => (
                  <div
                    key={file.id || index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {file.file_type?.includes('pdf') ? (
                          <i className='bx bx-file text-red-600 text-xl'></i>
                        ) : file.file_type?.includes('image') ? (
                          <i className='bx bx-image text-green-600 text-xl'></i>
                        ) : file.file_type?.includes('sheet') || file.file_type?.includes('excel') ? (
                          <i className='bx bx-spreadsheet text-emerald-600 text-xl'></i>
                        ) : file.file_type?.includes('word') || file.file_type?.includes('document') ? (
                          <i className='bx bx-file-blank text-blue-600 text-xl'></i>
                        ) : (
                          <i className='bx bx-file text-gray-600 text-xl'></i>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{file.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.file_size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn-primary btn-sm flex items-center gap-2"
                      onClick={() => handleDownloadFile(file.id, file.file_name)}
                      disabled={loading}
                    >
                      <i className='bx bx-download'></i>
                      <span>Скачать</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Информация о создателе */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <i className='bx bx-user-circle text-lg'></i>
              <span>Создал: <strong className="text-gray-700">{supply.creator_name || supply.full_name || supply.username}</strong></span>
              <span className="mx-2">•</span>
              <i className='bx bx-time text-lg'></i>
              <span>
                {new Date(supply.created_at).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplyViewModal;
