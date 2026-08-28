import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshRequest: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retry ||
        original?.url?.includes('/auth/refresh') || original?.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return Promise.reject(error);
    original._retry = true;
    try {
      refreshRequest ||= api.post('/auth/refresh', { refreshToken }).then((response) => {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return response.data.accessToken as string;
      }).finally(() => { refreshRequest = null; });
      const accessToken = await refreshRequest;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch (refreshError) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/';
      return Promise.reject(refreshError);
    }
  },
);

export default api;
