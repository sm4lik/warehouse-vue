import { useState, useEffect } from 'react';
import { materialsAPI } from '../api';

const WriteoffModal = ({ show, onClose, material }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    recipient_name: '',
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      setFormData({
        quantity: '',
        recipient_name: '',
        comment: ''
      });
      setError('');
    }
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!material) return;
    
    if (parseFloat(formData.quantity) > material.quantity) {
      setError('Недостаточно материала на складе');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await materialsAPI.writeoff(material.id, formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка списания');
    } finally {
      setLoading(false);
    }
  };

  if (!material || !show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <i className='bx bx-export text-amber-600 text-xl'></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Списание материала</h2>
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

            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <i className='bx bx-package text-blue-600 text-xl flex-shrink-0 mt-0.5'></i>
                <div>
                  <p className="font-semibold text-gray-900">{material.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-600">
                      Доступно: <strong className="text-gray-900">{material.quantity} {material.unit_short}</strong>
                    </span>
                    <span className="text-gray-600">
                      После списания: <strong className="text-gray-900">{(material.quantity - parseFloat(formData.quantity || 0)).toFixed(3)} {material.unit_short}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="input-label">Количество для списания *</label>
              <div className="relative">
                <i className='bx bx-hash absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                <input
                  type="number"
                  className="input-field pl-12"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  step="0.001"
                  min="0.001"
                  max={material.quantity}
                  required
                  autoFocus
                  placeholder="0.000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Максимум: {material.quantity} {material.unit_short}
              </p>
            </div>

            <div>
              <label className="input-label">Получатель (ФИО) *</label>
              <div className="relative">
                <i className='bx bx-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                <input
                  type="text"
                  className="input-field pl-12"
                  name="recipient_name"
                  value={formData.recipient_name}
                  onChange={handleChange}
                  required
                  placeholder="Иванов Иван Иванович"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                <i className='bx bx-info-circle mr-1'></i>
                Укажите ФИО сотрудника, который получает материал
              </p>
            </div>

            <div>
              <label className="input-label">Комментарий</label>
              <textarea
                className="input-field"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows={3}
                placeholder="Причина списания, примечание..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-warning" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <i className='bx bx-loader-alt animate-spin'></i>
                  Списание...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <i className='bx bx-check'></i>
                  Списать
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteoffModal;
