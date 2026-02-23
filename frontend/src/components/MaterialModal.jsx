import { useState, useEffect } from 'react';
import { materialsAPI } from '../api';

const MaterialModal = ({ show, onClose, material, units }) => {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit_id: '',
    min_quantity: 0,
    comment: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        quantity: material.quantity || 0,
        unit_id: material.unit_id || '',
        min_quantity: material.min_quantity || 0,
        comment: material.comment || ''
      });
    } else {
      setFormData({
        name: '',
        quantity: 0,
        unit_id: units[0]?.id || '',
        min_quantity: 0,
        comment: ''
      });
    }
  }, [material, show, units]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'unit_id' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (material) {
        await materialsAPI.update(material.id, formData);
      } else {
        await materialsAPI.create(formData);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className='bx bx-package text-blue-600 text-xl'></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {material ? 'Редактировать материал' : 'Новый материал'}
            </h2>
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

            <div>
              <label className="input-label">Наименование *</label>
              <input
                type="text"
                className="input-field"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
                placeholder="Введите наименование материала"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Единица измерения *</label>
                <select
                  className="input-field"
                  name="unit_id"
                  value={formData.unit_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Выберите единицу</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.short_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label">Количество</label>
                <input
                  type="number"
                  className="input-field"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  step="0.001"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Минимальный остаток</label>
              <input
                type="number"
                className="input-field"
                name="min_quantity"
                value={formData.min_quantity}
                onChange={handleChange}
                step="0.001"
                min="0"
                placeholder="Для уведомлений"
              />
              <p className="text-xs text-gray-500 mt-1">
                <i className='bx bx-info-circle mr-1'></i>
                При достижении этого значения материал будет помечен как заканчивающийся
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
                placeholder="Дополнительная информация о материале..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <i className='bx bx-loader-alt animate-spin'></i>
                  Сохранение...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <i className='bx bx-check'></i>
                  Сохранить
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialModal;
