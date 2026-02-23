import { useState, useEffect, useRef } from 'react';
import { suppliesAPI, materialsAPI } from '../api';

const SupplyModal = ({ show, onClose, supply }) => {
  const [formData, setFormData] = useState({
    document_number: '',
    supplier: '',
    buyer: '',
    receiver: '',
    supply_date: new Date().toISOString().split('T')[0],
    comment: '',
    items: []
  });
  const [materials, setMaterials] = useState([]);
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      loadMaterials();
      if (supply) {
        // Преобразуем items в правильный формат
        const formattedItems = (supply.items || []).map(item => ({
          material_id: parseInt(item.material_id),
          quantity: parseFloat(item.quantity) || 0,
          price: parseFloat(item.price) || 0
        }));
        
        setFormData({
          document_number: supply.document_number || '',
          supplier: supply.supplier || '',
          buyer: supply.buyer || '',
          receiver: supply.receiver || '',
          supply_date: supply.supply_date?.split('T')[0] || new Date().toISOString().split('T')[0],
          comment: supply.comment || '',
          items: formattedItems
        });
        setExistingFiles(supply.files || []);
      } else {
        setFormData({
          document_number: '',
          supplier: '',
          buyer: '',
          receiver: '',
          supply_date: new Date().toISOString().split('T')[0],
          comment: '',
          items: []
        });
        setExistingFiles([]);
      }
      setFiles([]);
      setError('');
    }
  }, [show, supply]);

  const loadMaterials = async () => {
    try {
      const response = await materialsAPI.getAll();
      setMaterials(response.data.materials);
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { material_id: '', quantity: 1, price: 0 }]
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === 'material_id') {
      newItems[index][field] = parseInt(value) || 0;
    } else if (field === 'quantity' || field === 'price') {
      newItems[index][field] = parseFloat(value) || 0;
    } else {
      newItems[index][field] = value;
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleRemoveFile = async (fileId) => {
    if (!supply) return;
    
    try {
      await suppliesAPI.deleteFile(supply.id, fileId);
      setExistingFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      alert('Ошибка удаления файла: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (supply) {
        await suppliesAPI.update(supply.id, formData);
      } else {
        const response = await suppliesAPI.create(formData);
        
        if (files.length > 0 && response.data.supply_id) {
          await suppliesAPI.uploadFiles(response.data.supply_id, files);
        }
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
      <div className="modal-content max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <i className='bx bx-detail text-indigo-600 text-xl'></i>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {supply ? 'Редактировать поставку' : 'Новая поставка'}
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Номер документа (УПД) *</label>
                <input
                  type="text"
                  className="input-field"
                  name="document_number"
                  value={formData.document_number}
                  onChange={handleChange}
                  required
                  placeholder="№ 123-АБ"
                />
              </div>

              <div>
                <label className="input-label">Дата поставки *</label>
                <input
                  type="date"
                  className="input-field"
                  name="supply_date"
                  value={formData.supply_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Поставщик *</label>
              <input
                type="text"
                className="input-field"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                required
                placeholder="Наименование поставщика"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">Покупатель *</label>
                <input
                  type="text"
                  className="input-field"
                  name="buyer"
                  value={formData.buyer}
                  onChange={handleChange}
                  required
                  placeholder="Наименование покупателя"
                />
              </div>

              <div>
                <label className="input-label">Получатель *</label>
                <input
                  type="text"
                  className="input-field"
                  name="receiver"
                  value={formData.receiver}
                  onChange={handleChange}
                  required
                  placeholder="Наименование получателя"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Комментарий</label>
              <textarea
                className="input-field"
                name="comment"
                value={formData.comment}
                onChange={handleChange}
                rows={2}
                placeholder="Дополнительная информация..."
              />
            </div>

            {/* Позиции поставки */}
            <div className="card border border-gray-200">
              <div className="card-header flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className='bx bx-package text-blue-500'></i>
                  <span className="font-semibold text-gray-900">Позиции (материалы)</span>
                </div>
                <button type="button" className="btn-sm btn-outline flex items-center gap-1" onClick={handleAddItem}>
                  <i className='bx bx-plus-circle'></i>
                  <span>Добавить</span>
                </button>
              </div>
              <div className="card-body">
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className='bx bx-inbox text-4xl text-gray-300 mb-2'></i>
                    <p>Позиции не добавлены</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={item.id || `item-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <select
                            className="input-field text-sm py-2"
                            value={item.material_id}
                            onChange={(e) => handleItemChange(index, 'material_id', e.target.value)}
                          >
                            <option value="">Выберите материал</option>
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.unit_short}) - ост: {m.quantity}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            className="input-field text-sm py-2"
                            placeholder="Количество"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            step="0.001"
                            min="0"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            className="input-field text-sm py-2"
                            placeholder="Цена"
                            value={item.price}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            step="0.01"
                            min="0"
                          />
                        </div>
                        <button
                          type="button"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <i className='bx bx-x-circle text-xl'></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Загрузка файлов */}
            <div>
              <label className="input-label">Прикрепленные файлы</label>
              
              {existingFiles.length > 0 && (
                <div className="space-y-2 mb-3">
                  {existingFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <i className='bx bx-file text-blue-500 text-xl'></i>
                        <span className="text-sm text-gray-700">{file.file_name}</span>
                        <span className="text-xs text-gray-400">({(file.file_size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleRemoveFile(file.id)}
                      >
                        <i className='bx bx-trash'></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                className="file-upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx,.doc,.docx,.txt,.zip"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <i className='bx bx-cloud-upload text-4xl text-gray-400 mb-2'></i>
                <p className="text-gray-600 font-medium">Нажмите для выбора файлов</p>
                <p className="text-sm text-gray-500 mt-1">
                  PDF, JPG, PNG, Excel, Word (макс. 10MB)
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Выбрано файлов: {files.length}</p>
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <i className='bx bx-file text-gray-400'></i>
                      {f.name}
                    </div>
                  ))}
                </div>
              )}
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

export default SupplyModal;
