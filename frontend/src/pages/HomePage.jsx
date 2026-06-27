import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveElection } from '../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [hover, setHover] = useState(null); // 'vote' | 'watch'

  useEffect(() => {
    getActiveElection().then(r => setElection(r.data.data)).catch(() => {});
  }, []);

  const isLive = election?.status === 'active' && election?.voting_enabled;

  return (
    <div style={s.root}>
      {/* Dot grid texture */}
      <div style={s.dotGrid} />

      {/* Ambient glows */}
      <div style={s.glowLeft} />
      <div style={s.glowRight} />

      {/* Scanline sweep */}
      <div style={s.scanline} />

      {/* Top bar */}
      <header style={s.header}>
        <div style={s.logoRow}>
          <div style={s.shieldIcon}>🛡</div>
          <div>
            <div style={s.logoName}>NUAITS</div>
            <div style={s.logoSub}>Njala University · IT Students</div>
          </div>
        </div>
        {isLive && (
          <div style={s.livePill}>
            <span style={s.liveDot} />
            <span style={s.liveText}>VOTING LIVE</span>
          </div>
        )}
        <button onClick={() => navigate('/admin/login')} style={s.adminBtn}>
          Admin ↗
        </button>
      </header>

      {/* Centre content */}
      <main style={s.main}>
        {/* Election year eyebrow */}
        <div style={s.eyebrow}>
          <span style={s.eyebrowLine} />
          <span style={s.eyebrowText}>GENERAL ELECTIONS 2026 / 2027 — NJALA CAMPUS</span>
          <span style={s.eyebrowLine} />
        </div>

        {/* Giant headline */}
        <h1 style={s.headline}>
          <span style={s.headLine1}>YOUR</span>
          <span style={s.headLine2}>VOICE.</span>
          <span style={s.headLine3}>YOUR VOTE.</span>
        </h1>

        {/* Giant ballot anchor — decorative */}
        <div style={s.ballotAnchor} aria-hidden="true">🗳</div>

        {/* The two choices */}
        <div style={s.choices}>
          {/* CAST VOTE */}
          <button
            onClick={() => navigate('/vote')}
            onMouseEnter={() => setHover('vote')}
            onMouseLeave={() => setHover(null)}
            style={{
              ...s.choiceBtn,
              ...(hover === 'vote' ? s.choiceBtnVoteHover : {}),
            }}
          >
            <span style={s.choiceBtnIcon}>🗳️</span>
            <span style={s.choiceBtnLabel}>Cast Your Vote</span>
            <span style={s.choiceBtnSub}>Enter your Student ID and voting code</span>
            <span style={{
              ...s.choiceBtnArrow,
              ...(hover === 'vote' ? { opacity: 1, transform: 'translateX(0)' } : {})
            }}>→</span>
          </button>

          {/* DIVIDER */}
          <div style={s.orDivider}>
            <div style={s.orLine} />
            <span style={s.orText}>OR</span>
            <div style={s.orLine} />
          </div>

          {/* WATCH ELECTION */}
          <button
            onClick={() => navigate('/results')}
            onMouseEnter={() => setHover('watch')}
            onMouseLeave={() => setHover(null)}
            style={{
              ...s.choiceBtn,
              ...s.choiceBtnWatch,
              ...(hover === 'watch' ? s.choiceBtnWatchHover : {}),
            }}
          >
            <span style={s.choiceBtnIcon}>📺</span>
            <span style={s.choiceBtnLabel}>Watch Election</span>
            <span style={s.choiceBtnSub}>Live results on the big screen</span>
            <span style={{
              ...s.choiceBtnArrow,
              ...(hover === 'watch' ? { opacity: 1, transform: 'translateX(0)' } : {})
            }}>→</span>
          </button>
        </div>

        {/* Status line */}
        <div style={s.statusLine}>
          {election ? (
            isLive
              ? <><span style={s.statusDotGreen} />Voting is open — cast your ballot now</>
              : <><span style={s.statusDotYellow} />{election.title} — voting not yet open</>
          ) : (
            <><span style={s.statusDotGray} />No active election at this time</>
          )}
        </div>
      </main>

      {/* Bottom strip */}
      <footer style={s.footer}>
        <span style={s.footerText}>Secure · Encrypted · Single-use codes</span>
        <span style={s.footerText}>Njala University — NUAITS 2026/2027</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@800&family=Inter:wght@400;500;600&display=swap');
        @keyframes scanline {
          0%   { top: -60px; }
          100% { top: 100vh; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%,100% { opacity:1; transform:scale(1); }
          50%     { opacity:0.4; transform:scale(0.7); }
        }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    background: '#060D1F',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'Inter, sans-serif',
  },
  dotGrid: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  glowLeft: {
    position: 'absolute', top: '-100px', left: '-120px',
    width: '500px', height: '500px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  glowRight: {
    position: 'absolute', bottom: '-80px', right: '-80px',
    width: '440px', height: '440px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  scanline: {
    position: 'absolute', left: 0, right: 0, height: '60px',
    background: 'linear-gradient(to bottom, transparent, rgba(34,197,94,0.02), transparent)',
    animation: 'scanline 8s linear infinite',
    pointerEvents: 'none',
  },
  header: {
    position: 'relative', zIndex: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 12 },
  shieldIcon: {
    width: 40, height: 40, borderRadius: 10,
    background: 'linear-gradient(135deg,#1e40af,#1d4ed8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, boxShadow: '0 4px 16px rgba(29,78,216,0.4)',
  },
  logoName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 17, color: '#fff', lineHeight: 1,
  },
  logoSub: { fontSize: 10, color: '#4B5563', fontWeight: 500, marginTop: 2, letterSpacing: '0.5px' },
  livePill: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 20, padding: '6px 14px',
  },
  liveDot: {
    width: 7, height: 7, background: '#22C55E', borderRadius: '50%',
    animation: 'pulseDot 2s infinite', display: 'inline-block',
  },
  liveText: { color: '#22C55E', fontSize: 11, fontWeight: 800, letterSpacing: '2px' },
  adminBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: '#4B5563', fontSize: 12, fontWeight: 600, padding: '7px 14px',
    borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    transition: 'color 0.2s, border-color 0.2s',
  },
  main: {
    flex: 1, position: 'relative', zIndex: 10,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '40px 24px',
  },
  eyebrow: {
    display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28,
    animation: 'fadeUp 0.6s ease both',
  },
  eyebrowLine: {
    display: 'inline-block', width: 28, height: 2,
    background: '#22C55E', borderRadius: 2,
  },
  eyebrowText: {
    color: '#22C55E', fontSize: 11, fontWeight: 800,
    letterSpacing: '3px', textTransform: 'uppercase',
  },
  headline: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, lineHeight: 0.9, textAlign: 'center',
    marginBottom: 48, animation: 'fadeUp 0.6s 0.1s ease both',
    position: 'relative', zIndex: 2,
  },
  headLine1: { display: 'block', fontSize: 'clamp(52px,10vw,96px)', color: '#fff' },
  headLine2: { display: 'block', fontSize: 'clamp(52px,10vw,96px)', color: '#fff' },
  headLine3: {
    display: 'block', fontSize: 'clamp(52px,10vw,96px)',
    background: 'linear-gradient(90deg, #22C55E, #4ADE80)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  },
  ballotAnchor: {
    position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)',
    fontSize: 'clamp(120px, 20vw, 220px)', opacity: 0.06,
    pointerEvents: 'none', userSelect: 'none', lineHeight: 1,
    filter: 'blur(1px)',
  },
  choices: {
    display: 'flex', alignItems: 'center', gap: 0,
    animation: 'fadeUp 0.6s 0.2s ease both', position: 'relative', zIndex: 2,
    flexWrap: 'wrap', justifyContent: 'center',
  },
  choiceBtn: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 4, padding: '28px 36px',
    background: 'rgba(10,22,40,0.9)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, cursor: 'pointer', minWidth: 260,
    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
    overflow: 'hidden',
  },
  choiceBtnVoteHover: {
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.4)',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(34,197,94,0.15)',
  },
  choiceBtnWatch: {
    background: 'rgba(10,22,40,0.9)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  choiceBtnWatchHover: {
    background: 'rgba(29,78,216,0.1)',
    border: '1px solid rgba(29,78,216,0.4)',
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(29,78,216,0.15)',
  },
  choiceBtnIcon: { fontSize: 28, marginBottom: 6 },
  choiceBtnLabel: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 22, color: '#fff',
    lineHeight: 1,
  },
  choiceBtnSub: { fontSize: 13, color: '#4B5563', fontWeight: 500, marginTop: 4 },
  choiceBtnArrow: {
    position: 'absolute', right: 20, top: '50%', transform: 'translateX(-8px) translateY(-50%)',
    color: '#22C55E', fontSize: 24, fontWeight: 700,
    opacity: 0, transition: 'all 0.2s ease',
  },
  orDivider: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, padding: '0 20px',
  },
  orLine: { width: 1, height: 36, background: 'rgba(255,255,255,0.08)' },
  orText: { color: '#374151', fontSize: 11, fontWeight: 700, letterSpacing: '2px' },
  statusLine: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 32,
    fontSize: 13, color: '#4B5563', fontWeight: 500,
    animation: 'fadeUp 0.6s 0.3s ease both',
  },
  statusDotGreen:  { display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#22C55E', animation:'pulseDot 2s infinite' },
  statusDotYellow: { display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#F59E0B' },
  statusDotGray:   { display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#374151' },
  footer: {
    position: 'relative', zIndex: 10,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 32px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  footerText: { fontSize: 11, color: '#1F2937', fontWeight: 500, letterSpacing: '0.5px' },
};
