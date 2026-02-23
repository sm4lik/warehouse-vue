import { useState, useEffect } from 'react';
import { notesAPI } from '../api';
import Layout from '../components/Layout';
import NoteModal from '../components/NoteModal';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPinned, setFilterPinned] = useState('all');

  const colorClasses = {
    default: 'bg-white border-gray-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    pink: 'bg-pink-50 border-pink-200',
    red: 'bg-red-50 border-red-200'
  };

  const categoryLabels = {
    general: 'Общее',
    work: 'Работа',
    important: 'Важное',
    ideas: 'Идеи',
    reminder: 'Напоминание'
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await notesAPI.getAll();
      setNotes(response.data.notes);
    } catch (error) {
      console.error('Ошибка загрузки заметок:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedNote(null);
    setShowModal(true);
  };

  const handleEdit = (note) => {
    setSelectedNote(note);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить заметку?')) return;

    try {
      await notesAPI.delete(id);
      loadNotes();
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleTogglePin = async (id, is_pinned) => {
    try {
      await notesAPI.togglePin(id, !is_pinned);
      loadNotes();
    } catch (error) {
      console.error('Ошибка закрепления:', error);
    }
  };

  const handleSave = async (data) => {
    try {
      if (selectedNote) {
        await notesAPI.update(selectedNote.id, data);
      } else {
        await notesAPI.create(data);
      }
      setShowModal(false);
      loadNotes();
    } catch (error) {
      alert('Ошибка сохранения: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedNote(null);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || note.category === filterCategory;
    const matchesPinned = filterPinned === 'all' || 
      (filterPinned === 'pinned' && note.is_pinned) ||
      (filterPinned === 'unpinned' && !note.is_pinned);

    return matchesSearch && matchesCategory && matchesPinned;
  });

  // Сортировка: закреплённые сверху
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

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
              <h1 className="page-title">Заметки</h1>
              <p className="text-gray-500 mt-1">Личные заметки и напоминания</p>
            </div>
            <button className="btn-primary flex items-center gap-2" onClick={handleCreate}>
              <i className='bx bx-plus-circle text-lg'></i>
              <span>Создать заметку</span>
            </button>
          </div>

          {/* Фильтры */}
          <div className="card mb-6">
            <div className="card-body py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="input-label">Поиск</label>
                  <div className="relative">
                    <i className='bx bx-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg'></i>
                    <input
                      type="text"
                      className="input-field pl-12"
                      placeholder="Поиск по заметкам..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="input-label">Категория</label>
                  <select
                    className="input-field"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="all">Все категории</option>
                    <option value="general">Общее</option>
                    <option value="work">Работа</option>
                    <option value="important">Важное</option>
                    <option value="ideas">Идеи</option>
                    <option value="reminder">Напоминание</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Статус</label>
                  <select
                    className="input-field"
                    value={filterPinned}
                    onChange={(e) => setFilterPinned(e.target.value)}
                  >
                    <option value="all">Все</option>
                    <option value="pinned">Закреплённые</option>
                    <option value="unpinned">Обычные</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Сетка заметок */}
          {sortedNotes.length === 0 ? (
            <div className="card">
              <div className="card-body py-16 text-center">
                <i className='bx bx-note text-6xl text-gray-300 mb-4'></i>
                <p className="text-gray-500 text-lg mb-4">
                  {searchTerm || filterCategory !== 'all' || filterPinned !== 'all'
                    ? 'По вашему запросу ничего не найдено'
                    : 'У вас пока нет заметок'}
                </p>
                {!searchTerm && filterCategory === 'all' && filterPinned === 'all' && (
                  <button className="btn-primary" onClick={handleCreate}>
                    <i className='bx bx-plus-circle mr-2'></i>
                    Создать первую заметку
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedNotes.map(note => (
                <div
                  key={note.id}
                  className={`card ${colorClasses[note.color]} transition-all duration-200 hover:shadow-lg relative group ${
                    note.is_pinned ? 'ring-2 ring-blue-400' : ''
                  }`}
                >
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">{note.title}</h3>
                          {note.is_pinned && (
                            <i className='bx bx-pin text-blue-500 text-sm'></i>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {categoryLabels[note.category]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className={`p-1.5 rounded-lg transition-colors ${
                            note.is_pinned
                              ? 'bg-blue-100 text-blue-600'
                              : 'hover:bg-gray-100 text-gray-400'
                          }`}
                          onClick={() => handleTogglePin(note.id, note.is_pinned)}
                          title={note.is_pinned ? 'Открепить' : 'Закрепить'}
                        >
                          <i className='bx bx-pin text-sm'></i>
                        </button>
                        <button
                          className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          onClick={() => handleEdit(note)}
                          title="Редактировать"
                        >
                          <i className='bx bx-edit-alt text-sm'></i>
                        </button>
                        <button
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                          onClick={() => handleDelete(note.id)}
                          title="Удалить"
                        >
                          <i className='bx bx-trash text-sm'></i>
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm whitespace-pre-line line-clamp-4 mb-3">
                      {note.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {new Date(note.created_at).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                      <span>
                        {new Date(note.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      <NoteModal
        show={showModal}
        onClose={handleModalClose}
        note={selectedNote}
        onSave={handleSave}
      />
    </Layout>
  );
};

export default Notes;
