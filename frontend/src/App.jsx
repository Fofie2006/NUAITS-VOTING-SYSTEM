import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import HomePage        from './pages/HomePage';
import VotePage        from './pages/VotePage';
import LiveResultsPage from './pages/LiveResultsPage';

import AdminLogin      from './pages/admin/AdminLogin';
import AdminLayout     from './components/AdminLayout';
import Dashboard       from './pages/admin/Dashboard';
import StudentsPage    from './pages/admin/StudentsPage';
import CandidatesPage  from './pages/admin/CandidatesPage';
import ElectionPage    from './pages/admin/ElectionPage';
import ResultsPage     from './pages/admin/ResultsPage';
import LogsPage        from './pages/admin/LogsPage';

const Guard = ({ children }) => {
  const { admin, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#060D1F' }}>
      <div style={{ width:36, height:36, border:'3px solid #22C55E', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  return admin ? children : <Navigate to="/admin/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0F1E38',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: { iconTheme: { primary: '#22C55E', secondary: '#060D1F' } },
            error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/"        element={<HomePage />} />
          <Route path="/vote"    element={<VotePage />} />
          <Route path="/results" element={<LiveResultsPage />} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Guard><AdminLayout /></Guard>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard"  element={<Dashboard />} />
            <Route path="students"   element={<StudentsPage />} />
            <Route path="candidates" element={<CandidatesPage />} />
            <Route path="election"   element={<ElectionPage />} />
            <Route path="results"    element={<ResultsPage />} />
            <Route path="logs"       element={<LogsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
