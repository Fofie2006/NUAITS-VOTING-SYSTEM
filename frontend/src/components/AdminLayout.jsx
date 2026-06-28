import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/admin/students', icon: '👥', label: 'Students' },
  { to: '/admin/candidates', icon: '🎓', label: 'Candidates' },
  { to: '/admin/election', icon: '⚙️', label: 'Election Control' },
  { to: '/admin/results', icon: '📈', label: 'Results' },
  { to: '/admin/logs', icon: '📋', label: 'Audit Logs' },
];

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    background: '#060D1F',
    fontFamily: 'Inter, sans-serif',
  },

  sidebar: {
    width: 220,
    background: '#0A1628',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },

  sidebarTop: {
    flex: 1,
    padding: '20px 12px 12px',
  },

  sideLogoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '4px 8px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    marginBottom: 16,
  },

  sideShield: {
    width: 34,
    height: 34,
    background: 'linear-gradient(135deg,#1e40af,#1d4ed8)',
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sideName: {
    fontWeight: 800,
    fontSize: 15,
    color: '#fff',
  },

  sideSub: {
    fontSize: 10,
    color: '#9CA3AF',
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#9CA3AF',
    textDecoration: 'none',
  },

  navItemActive: {
    background: 'rgba(34,197,94,0.1)',
    color: '#22C55E',
  },

  navIcon: {
    width: 20,
    textAlign: 'center',
  },

  sideBottom: {
    padding: 12,
    borderTop: '1px solid rgba(255,255,255,0.05)',
  },

  adminRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  adminAvatar: {
    width: 32,
    height: 32,
    background: '#1D4ED8',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
  },

  adminName: {
    color: '#fff',
    fontSize: 13,
  },

  adminRole: {
    color: '#9CA3AF',
    fontSize: 10,
  },

  logoutBtn: {
    width: '100%',
    padding: 10,
    background: 'transparent',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 8,
    color: '#EF4444',
    cursor: 'pointer',
  },

  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },

  mobileTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: '#0A1628',
  },

  hamburger: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: 8,
    cursor: 'pointer',
  },

  mobileLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  content: {
    flex: 1,
    padding: 24,
  },

  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
  },

  overlayBg: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
  },

  mobileSidebar: {
    width: 240,
    background: '#0A1628',
    height: '100vh',
    position: 'relative',
    zIndex: 51,
  },

  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: 18,
    cursor: 'pointer',
  },
};

export default function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [wide, setWide] = useState(window.innerWidth >= 900);

  useEffect(() => {
    const resize = () => setWide(window.innerWidth >= 900);
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/admin/login');
  };

  const Sidebar = () => (
    <div style={styles.sidebar}>
      <div style={styles.sidebarTop}>
        <div style={styles.sideLogoRow}>
          <div style={styles.sideShield}>🛡</div>
          <div>
            <div style={styles.sideName}>NUAITS</div>
            <div style={styles.sideSub}>Admin Panel</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
              })}
            >
              <span style={styles.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div style={styles.sideBottom}>
        <div style={styles.adminRow}>
          <div style={styles.adminAvatar}>
            {admin?.username?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div style={styles.adminName}>
              {admin?.username || 'Admin'}
            </div>
            <div style={styles.adminRole}>Administrator</div>
          </div>
        </div>

        <button onClick={handleLogout} style={styles.logoutBtn}>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.root}>
      {wide && <Sidebar />}

      {!wide && open && (
        <div style={styles.overlay}>
          <div
            style={styles.overlayBg}
            onClick={() => setOpen(false)}
          />
          <div style={styles.mobileSidebar}>
            <button
              onClick={() => setOpen(false)}
              style={styles.closeBtn}
            >
              ✕
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      <div style={styles.main}>
        {!wide && (
          <div style={styles.mobileTop}>
            <button
              onClick={() => setOpen(true)}
              style={styles.hamburger}
            >
              ☰
            </button>

            <div style={styles.mobileLogo}>
              <div style={styles.sideShield}>🛡</div>
              <span style={styles.sideName}>NUAITS</span>
            </div>
          </div>
        )}

        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}