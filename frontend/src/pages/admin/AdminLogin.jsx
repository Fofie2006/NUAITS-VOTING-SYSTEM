import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const data = await login(form.username, form.password);
      if (data.success) { toast.success('Welcome back'); navigate('/admin/dashboard'); }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.root}>
      <div style={s.dotGrid} />
      <div style={s.glow} />

      <div style={s.card}>
        <div style={s.cardTop}>
          <div style={s.shield}>🛡</div>
          <div style={s.cardTitle}>NUAITS Admin</div>
          <div style={s.cardSub}>Voting System Control Panel</div>
        </div>

        {error && <div style={s.error}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Username</label>
            <input
              type="text" required autoFocus value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="admin"
              style={s.input}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} required value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                style={{ ...s.input, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={s.eyeBtn}
              >{showPass ? '🙈' : '👁'}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={s.submitBtn}>
            {loading
              ? <><span style={s.spinner} /> Signing in…</>
              : 'Sign In →'}
          </button>
        </form>

        <div style={s.footer}>
          <Link to="/" style={{ color: '#374151', fontSize: 12, textDecoration: 'none' }}>
            ← Back to Voting Portal
          </Link>
        </div>
      </div>

      <div style={s.bottomNote}>Authorized personnel only · NUAITS Electoral Committee</div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder{color:#1F2937}
        input:focus{border-color:rgba(34,197,94,0.5)!important;outline:none}
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight:'100vh', background:'#060D1F',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    padding:24, fontFamily:'Inter,sans-serif', position:'relative', overflow:'hidden',
  },
  dotGrid: {
    position:'absolute', inset:0, pointerEvents:'none',
    backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize:'24px 24px',
  },
  glow: {
    position:'absolute', top:-120, left:'50%', transform:'translateX(-50%)',
    width:600, height:400, borderRadius:'50%', pointerEvents:'none',
    background:'radial-gradient(ellipse, rgba(29,78,216,0.15) 0%, transparent 70%)',
  },
  card: {
    width:'100%', maxWidth:380, background:'#0A1628',
    border:'1px solid rgba(255,255,255,0.07)',
    borderRadius:24, overflow:'hidden',
    boxShadow:'0 32px 80px rgba(0,0,0,0.7)',
    position:'relative', zIndex:10,
    animation:'fadeUp 0.4s ease both',
  },
  cardTop: {
    background:'linear-gradient(135deg,#0F1E38,#1A3A6E)',
    padding:'32px 28px', textAlign:'center',
    borderBottom:'1px solid rgba(255,255,255,0.06)',
  },
  shield: { fontSize:40, display:'block', marginBottom:12 },
  cardTitle: {
    fontFamily:"'Space Grotesk',sans-serif",
    fontWeight:800, fontSize:22, color:'#fff', marginBottom:4,
  },
  cardSub: { fontSize:13, color:'#374151' },
  error: {
    margin:'16px 28px 0',
    background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
    borderRadius:10, padding:'10px 14px', fontSize:13, color:'#FCA5A5',
  },
  form: { padding:'24px 28px', display:'flex', flexDirection:'column', gap:18 },
  field: { display:'flex', flexDirection:'column', gap:7 },
  label: { fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'1px' },
  input: {
    background:'#060D1F', border:'1px solid rgba(255,255,255,0.08)',
    borderRadius:11, padding:'13px 14px', color:'#fff',
    fontSize:14, fontFamily:'Inter,sans-serif', width:'100%', boxSizing:'border-box',
    transition:'border-color 0.2s',
  },
  eyeBtn: {
    position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
    background:'transparent', border:'none', cursor:'pointer', fontSize:16,
  },
  submitBtn: {
    background:'linear-gradient(135deg,#15803D,#16A34A)',
    border:'none', borderRadius:12, padding:14, color:'#fff',
    fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif',
    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
    boxShadow:'0 4px 20px rgba(22,163,74,0.25)',
  },
  spinner: {
    display:'inline-block', width:16, height:16,
    border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff',
    borderRadius:'50%', animation:'spin 0.7s linear infinite',
  },
  footer: {
    padding:'0 28px 24px', display:'flex', justifyContent:'center',
    borderTop:'1px solid rgba(255,255,255,0.04)', paddingTop:16,
  },
  bottomNote: {
    marginTop:20, fontSize:11, color:'#1F2937',
    fontWeight:500, letterSpacing:'0.5px', position:'relative', zIndex:10,
  },
};
