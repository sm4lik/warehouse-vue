import { useState, useEffect } from 'react';

const NoteModal = ({ show, onClose, note, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: 'default',
    category: 'general',
    is_pinned: false
  });
  const [error, setError] = useState('');

  const colors = [
    { value: 'default', label: 'Белый', class: 'bg-white border-gray-300' },
    { value: 'yellow', label: 'Жёлтый', class: 'bg-yellow-100 border-yellow-300' },
    { value: 'green', label: 'Зелёный', class: 'bg-green-100 border-green-300' },
    { value: 'blue', label: 'Синий', class: 'bg-blue-100 border-blue-300' },
    { value: 'purple', label: 'Фиолетовый', class: 'bg-purple-100 border-purple-300' },
    { value: 'pink', label: 'Розовый', class: 'bg-pink-100 border-pink-300' },
    { value: 'red', label: 'Красный', class: 'bg-red-100 border-red-300' }
  ];

  const categories = [
    { value: 'general', label: 'Общее' },
    { value: 'work', label: 'Работа' },
    { value: 'important', label: 'Важное' },
    { value: 'ideas', label: 'Идеи' },
    { value: 'reminder', label: 'Напоминание' }
  ];

  useEffect(() => {
    if (show) {
      setFormData(note || {
        title: '',
        content: '',
        color: 'default',
        category: 'general',
        is_pinned: false
      });
      setError('');
    }
  }, [show, note]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Введите заголовок');
      return;
    }

    if (!formData.content.trim()) {
      setError('Введите содержание заметки');
      return;
    }

    onSave(formData);
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <i className='bx bx-note text-amber-600 text-xl'></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {note ? 'Редактировать заметку' : 'Новая заметка'}
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
              <label className="input-label">Заголовок *</label>
              <div className="relative">
                <i className='bx bx-heading absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                <input
                  type="text"
                  className="input-field pl-12"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  autoFocus
                  placeholder="Введите заголовок заметки"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Содержание *</label>
              <textarea
                className="input-field min-h-10"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                placeholder="Введите содержание заметки..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Категория</label>
                <select
                  className="input-field"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_pinned"
                    checked={formData.is_pinned}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Закрепить заметку</span>
                </label>
              </div>
            </div>

            <div>
              <label className="input-label mb-2 block">Цвет заметки</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${color.class} ${
                      formData.color === color.value
                        ? 'ring-2 ring-blue-500 ring-offset-2 scale-110'
                        : 'hover:scale-105'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    title={color.label}
                  >
                    {formData.color === color.value && (
                      <i className='bx bx-check text-blue-600 text-lg block mx-auto'></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary">
              {note ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteModal;
