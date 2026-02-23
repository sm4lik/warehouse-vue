import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Добавление токена к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getRoles: () => api.get('/users/roles'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

// Materials API
export const materialsAPI = {
  getAll: () => api.get('/materials'),
  getById: (id) => api.get(`/materials/${id}`),
  create: (data) => api.post('/materials', data),
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
  writeoff: (id, data) => api.post(`/materials/${id}/writeoff`, data),
  add: (id, data) => api.post(`/materials/${id}/add`, data),
  getTransactions: (id) => api.get(`/materials/${id}/transactions`)
};

// Supplies API
export const suppliesAPI = {
  getAll: () => api.get('/supplies'),
  getById: (id) => api.get(`/supplies/${id}`),
  create: (data) => api.post('/supplies', data),
  update: (id, data) => api.put(`/supplies/${id}`, data),
  delete: (id) => api.delete(`/supplies/${id}`),
  uploadFiles: (id, files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post(`/supplies/${id}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteFile: (supplyId, fileId) => api.delete(`/supplies/${supplyId}/files/${fileId}`),
  downloadFile: (supplyId, fileId) => api.get(`/supplies/${supplyId}/files/${fileId}/download`, {
    responseType: 'blob'
  })
};

// Units API
export const unitsAPI = {
  getAll: () => api.get('/units')
};

// Notes API
export const notesAPI = {
  getAll: () => api.get('/notes'),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
  togglePin: (id, is_pinned) => api.patch(`/notes/${id}/pin`, { is_pinned })
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnread: () => api.get('/notifications/unread'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
  clearRead: () => api.delete('/notifications/read/clear'),
  send: (data) => api.post('/notifications/send', data),
  getUsersList: () => api.get('/notifications/users/list')
};

// Profile API
export const profileAPI = {
  getProfile: () => api.get('/profile/me'),
  updateProfile: (data) => api.put('/profile/me', data),
  updatePassword: (data) => api.put('/profile/me/password', data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/profile/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteAvatar: () => api.delete('/profile/me/avatar'),
  getSettings: () => api.get('/profile/me/settings'),
  updateSettings: (data) => api.put('/profile/me/settings', data)
};

export default api;
