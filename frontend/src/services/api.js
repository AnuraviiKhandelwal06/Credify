import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT Bearer token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('credify_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth Endpoints
export const registerApi = (data) => API.post('/auth/register', data);
export const loginApi = (data) => API.post('/auth/login', data);
export const getMeApi = () => API.get('/auth/me');

// Document Endpoints
export const uploadDocumentApi = (formData) => API.post('/documents/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getDocumentsApi = () => API.get('/documents');
export const getDocumentByIdApi = (id) => API.get(`/documents/${id}`);

// Analysis Endpoints
export const runAnalysisApi = (documentId) => API.post(`/analysis/${documentId}`);
export const getAnalysisByIdApi = (id) => API.get(`/analysis/${id}`);
export const getAnalysisHistoryApi = () => API.get('/analysis/history');

export default API;
