import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('nuaits_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('nuaits_admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export const adminLogin            = (d) => API.post('/auth/login', d);
export const getDashboardStats     = ()  => API.get('/admin/dashboard');
export const getStudents           = ()  => API.get('/admin/students');
export const createStudent         = (d) => API.post('/admin/students', d);
export const updateStudent         = (id,d) => API.put(`/admin/students/${id}`, d);
export const deleteStudent         = (id)   => API.delete(`/admin/students/${id}`);
export const resendStudentEmail    = (id)   => API.post(`/admin/students/${id}/resend-email`);
export const getCandidates         = ()  => API.get('/candidates');
export const getAdminCandidates    = ()  => API.get('/admin/candidates');
export const createCandidate       = (d) => API.post('/admin/candidates', d);
export const updateCandidate       = (id,d) => API.put(`/admin/candidates/${id}`, d);
export const deleteCandidate       = (id)   => API.delete(`/admin/candidates/${id}`);
export const getElections          = ()  => API.get('/admin/elections');
export const getActiveElection     = ()  => API.get('/election/active');
export const createElection        = (d) => API.post('/admin/elections', d);
export const updateElectionStatus  = (id,d) => API.put(`/admin/elections/${id}/status`, d);
export const getElectionResults    = (id)   => API.get(`/admin/elections/${id}/results`);
export const validateVoteCredentials = (d) => API.post('/vote/validate', d);
export const submitVotes           = (d) => API.post('/vote/submit', d);
export const getLogs               = (p) => API.get('/admin/logs', { params: p });
export const getInvalidAttempts    = ()  => API.get('/admin/logs/invalid-attempts');
export default API;
