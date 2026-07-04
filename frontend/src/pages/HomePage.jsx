import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveElection, getCandidates } from '../utils/api';

const COLORS = ['#22C55E','#3B82F6','#A855F7','#F59E0B','#EF4444','#14B8A6','#F97316','#EC4899'];

export default function HomePage() {
  const navigate  = useNavigate();
  const [election,   setElection]   = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [hover,      setHover]      = useState(null);
  const [activePos,  setActivePos]  = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    getActiveElection().then(r => setElection(r.data.data)).catch(() => {});
    getCandidates().then(r => setCandidates(r.data.data)).catch(() => {});
  }, []);

  // Group candidates by position
  const byPosition = candidates.reduce((acc, c) => {
    if (!acc[c.position]) acc[c.position] = [];
    acc[c.position].push(c);
    return acc;
  }, {});
  const positions = Object.keys(byPosition);

  // Auto-cycle positions tab
  useEffect(() => {
    if (positions.length < 2) return;
    const t = setInterval(() => setActivePos(p => (p + 1) % positions.length), 5000);
    return () => clearInterval(t);
  }, [positions.length]);

  const isLive = election?.status === 'active' && election?.voting_enabled;
  const currentPosition = positions[activePos];
  const currentCandidates = byPosition[currentPosition] || [];

  return (
    <div style={s.root}>
      {/* Background layers */}
      <div style={s.dotGrid} />
      <div style={s.glowLeft} />
      <div style={s.glowRight} />
      <div style={s.scanline} />

      {/* ── HEADER ── */}
      <header style={s.header}>
        <div style={s.logoRow}>
          <div style={s.shield}>🛡</div>
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
        <button onClick={() => navigate('/admin/login')} style={s.adminBtn}>Admin ↗</button>
      </header>

      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.eyebrow}>
          <span style={s.eyebrowLine} />
          <span style={s.eyebrowText}>GENERAL ELECTIONS 2026 / 2027 — NJALA CAMPUS</span>
          <span style={s.eyebrowLine} />
        </div>

        <h1 style={s.headline}>
          <span style={s.hl1}>YOUR</span>
          <span style={s.hl2}>VOICE.</span>
          <span style={s.hl3}>YOUR VOTE.</span>
        </h1>

        {/* Giant ballot anchor */}
        <div style={s.ballotAnchor} aria-hidden="true">🗳</div>

        {/* Two CTA buttons */}
        <div style={s.ctaRow}>
          <button
            onClick={() => navigate('/vote')}
            onMouseEnter={() => setHover('vote')}
            onMouseLeave={() => setHover(null)}
            style={{ ...s.ctaBtn, ...(hover==='vote' ? s.ctaBtnVoteHover : {}) }}
          >
            <span style={s.ctaIcon}>🗳️</span>
            <div>
              <div style={s.ctaLabel}>Cast Your Vote</div>
              <div style={s.ctaSub}>Enter Student ID & voting code</div>
            </div>
            <span style={{ ...s.ctaArrow, opacity: hover==='vote'?1:0 }}>→</span>
          </button>

          <div style={s.orDiv}>
            <div style={s.orLine} /><span style={s.orText}>OR</span><div style={s.orLine} />
          </div>

          <button
            onClick={() => navigate('/results')}
            onMouseEnter={() => setHover('watch')}
            onMouseLeave={() => setHover(null)}
            style={{ ...s.ctaBtn, ...(hover==='watch' ? s.ctaBtnWatchHover : {}) }}
          >
            <span style={s.ctaIcon}>📺</span>
            <div>
              <div style={s.ctaLabel}>Watch Election</div>
              <div style={s.ctaSub}>Live results on big screen</div>
            </div>
            <span style={{ ...s.ctaArrow, opacity: hover==='watch'?1:0 }}>→</span>
          </button>
        </div>

        {/* Status */}
        <div style={s.statusLine}>
          {election ? (
            isLive
              ? <><span style={s.dotGreen} />Voting is open — cast your ballot now</>
              : <><span style={s.dotYellow} />{election.title} — voting not yet open</>
          ) : (
            <><span style={s.dotGray} />No active election at this time</>
          )}
        </div>
      </section>

      {/* ── CANDIDATES SHOWCASE ── */}
      {candidates.length > 0 && (
        <section style={s.candidatesSection}>
          {/* Section header */}
          <div style={s.sectionHead}>
            <div style={s.sectionEyebrow}>
              <span style={s.sectionLine} />
              <span style={s.sectionEyebrowText}>MEET THE CANDIDATES</span>
              <span style={s.sectionLine} />
            </div>
            {election && (
              <div style={s.sectionElectionName}>{election.title}</div>
            )}
          </div>

          {/* Position tabs */}
          {positions.length > 1 && (
            <div style={s.posTabs} ref={scrollRef}>
              {positions.map((pos, i) => (
                <button
                  key={pos}
                  onClick={() => setActivePos(i)}
                  style={{
                    ...s.posTab,
                    ...(i === activePos ? s.posTabActive : {}),
                  }}
                >
                  {pos}
                  {i === activePos && <span style={s.posTabDot} />}
                </button>
              ))}
            </div>
          )}

          {/* Candidate cards for active position */}
          <div style={s.candidateGrid}>
            {currentCandidates.map((c, ci) => {
              const color   = COLORS[ci % COLORS.length];
              const isHover = hoveredCard === c.id;
              return (
                <div
                  key={c.id}
                  style={{
                    ...s.candCard,
                    ...(isHover ? s.candCardHover : {}),
                    borderColor: isHover ? `${color}50` : 'rgba(255,255,255,0.07)',
                  }}
                  onMouseEnter={() => setHoveredCard(c.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Photo */}
                  <div style={{ ...s.candPhoto, background:`${color}14` }}>
                    {c.photo ? (
                      <img
                        src={c.photo}
                        alt={c.fullname}
                        style={s.candPhotoImg}
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.parentElement.querySelector('.fallback').style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="fallback"
                      style={{
                        ...s.candInitialWrap,
                        display: c.photo ? 'none' : 'flex',
                      }}
                    >
                      <span style={{ ...s.candInitial, color }}>{c.fullname[0]}</span>
                    </div>

                    {/* Color accent bar at bottom */}
                    <div style={{ ...s.candAccentBar, background: color, opacity: isHover ? 1 : 0.4 }} />
                  </div>

                  {/* Info */}
                  <div style={s.candBody}>
                    <div style={{ ...s.candPosition, color }}>{currentPosition}</div>
                    <div style={s.candName}>{c.fullname}</div>
                    {c.department && (
                      <div style={s.candDept}>{c.department}</div>
                    )}
                    {c.manifesto && (
                      <div style={s.candManifesto}>{c.manifesto}</div>
                    )}
                  </div>

                  {/* Vote now CTA (only if voting is live) */}
                  {isLive && (
                    <div style={s.candFooter}>
                      <button
                        onClick={() => navigate('/vote')}
                        style={{ ...s.candVoteBtn, borderColor:`${color}40`, color }}
                      >
                        Vote for this candidate →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Position indicator dots */}
          {positions.length > 1 && (
            <div style={s.dotRow}>
              {positions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActivePos(i)}
                  style={{
                    ...s.dotBtn,
                    background: i === activePos ? '#22C55E' : 'rgba(255,255,255,0.1)',
                    width: i === activePos ? 24 : 8,
                  }}
                />
              ))}
            </div>
          )}

          {/* All candidates count */}
          <div style={s.allCandidatesNote}>
            {candidates.length} candidates competing across {positions.length} position{positions.length !== 1 ? 's' : ''}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <span style={s.footerText}>Secure · Encrypted · Single-use codes</span>
        <span style={s.footerText}>Njala University — NUAITS 2026/2027</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes scanline { 0% { top: -60px; } 100% { top: 100vh; } }
        @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes slideIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

const s = {
  root: { minHeight:'100vh', background:'#060D1F', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', fontFamily:'Inter,sans-serif' },
  dotGrid:    { position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'24px 24px' },
  glowLeft:   { position:'absolute', top:-100, left:-120, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(29,78,216,0.18) 0%, transparent 70%)', pointerEvents:'none' },
  glowRight:  { position:'absolute', bottom:-80, right:-80, width:440, height:440, borderRadius:'50%', background:'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)', pointerEvents:'none' },
  scanline:   { position:'absolute', left:0, right:0, height:60, background:'linear-gradient(to bottom, transparent, rgba(34,197,94,0.018), transparent)', animation:'scanline 8s linear infinite', pointerEvents:'none' },

  // Header
  header:   { position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 28px', borderBottom:'1px solid rgba(255,255,255,0.05)' },
  logoRow:  { display:'flex', alignItems:'center', gap:12 },
  shield:   { width:38, height:38, background:'linear-gradient(135deg,#1e40af,#1d4ed8)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, boxShadow:'0 4px 14px rgba(29,78,216,0.35)' },
  logoName: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:16, color:'#fff', lineHeight:1 },
  logoSub:  { fontSize:10, color:'#374151', marginTop:2 },
  livePill: { display:'flex', alignItems:'center', gap:7, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:20, padding:'6px 14px' },
  liveDot:  { width:7, height:7, background:'#22C55E', borderRadius:'50%', animation:'pulseDot 1.5s infinite', display:'inline-block' },
  liveText: { color:'#22C55E', fontSize:11, fontWeight:800, letterSpacing:'2px' },
  adminBtn: { background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#374151', fontSize:12, fontWeight:600, padding:'7px 14px', borderRadius:8, cursor:'pointer', fontFamily:'Inter,sans-serif' },

  // Hero
  hero:       { flex:'none', position:'relative', zIndex:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'52px 24px 48px' },
  eyebrow:    { display:'flex', alignItems:'center', gap:14, marginBottom:24, animation:'fadeUp 0.5s ease both' },
  eyebrowLine:{ display:'inline-block', width:24, height:2, background:'#22C55E', borderRadius:2 },
  eyebrowText:{ color:'#22C55E', fontSize:11, fontWeight:800, letterSpacing:'3px', textTransform:'uppercase' },
  headline:   { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, lineHeight:0.9, textAlign:'center', marginBottom:44, animation:'fadeUp 0.5s 0.1s ease both', position:'relative', zIndex:2 },
  hl1: { display:'block', fontSize:'clamp(48px,9vw,88px)', color:'#fff' },
  hl2: { display:'block', fontSize:'clamp(48px,9vw,88px)', color:'#fff' },
  hl3: { display:'block', fontSize:'clamp(48px,9vw,88px)', background:'linear-gradient(90deg,#22C55E,#4ADE80)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' },
  ballotAnchor: { position:'absolute', right:'7%', top:'50%', transform:'translateY(-55%)', fontSize:'clamp(100px,18vw,200px)', opacity:0.055, pointerEvents:'none', userSelect:'none', lineHeight:1, filter:'blur(1px)' },

  // CTA
  ctaRow: { display:'flex', alignItems:'center', gap:0, animation:'fadeUp 0.5s 0.15s ease both', position:'relative', zIndex:2, flexWrap:'wrap', justifyContent:'center' },
  ctaBtn: { position:'relative', display:'flex', alignItems:'center', gap:16, padding:'22px 28px', background:'rgba(10,22,40,0.9)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:18, cursor:'pointer', minWidth:250, transition:'all 0.22s cubic-bezier(0.4,0,0.2,1)', overflow:'hidden', fontFamily:'Inter,sans-serif' },
  ctaBtnVoteHover:  { background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.38)', transform:'translateY(-2px)', boxShadow:'0 12px 40px rgba(34,197,94,0.14)' },
  ctaBtnWatchHover: { background:'rgba(29,78,216,0.1)',  border:'1px solid rgba(29,78,216,0.38)', transform:'translateY(-2px)', boxShadow:'0 12px 40px rgba(29,78,216,0.14)' },
  ctaIcon:  { fontSize:28, flexShrink:0 },
  ctaLabel: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:20, color:'#fff', lineHeight:1 },
  ctaSub:   { fontSize:12, color:'#374151', marginTop:4 },
  ctaArrow: { position:'absolute', right:18, color:'#22C55E', fontSize:22, fontWeight:700, transition:'opacity 0.2s' },
  orDiv:    { display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'0 18px' },
  orLine:   { width:1, height:32, background:'rgba(255,255,255,0.07)' },
  orText:   { color:'#1F2937', fontSize:11, fontWeight:700, letterSpacing:'2px' },
  statusLine:{ display:'flex', alignItems:'center', gap:8, marginTop:28, fontSize:13, color:'#374151', fontWeight:500, animation:'fadeUp 0.5s 0.25s ease both' },
  dotGreen:  { display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#22C55E', animation:'pulseDot 2s infinite', flexShrink:0 },
  dotYellow: { display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#F59E0B', flexShrink:0 },
  dotGray:   { display:'inline-block', width:7, height:7, borderRadius:'50%', background:'#374151', flexShrink:0 },

  // Candidates section
  candidatesSection: { position:'relative', zIndex:10, padding:'0 24px 60px', maxWidth:1100, margin:'0 auto', width:'100%' },

  sectionHead:       { textAlign:'center', marginBottom:32 },
  sectionEyebrow:    { display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:10 },
  sectionLine:       { flex:1, maxWidth:60, height:1, background:'rgba(255,255,255,0.08)' },
  sectionEyebrowText:{ color:'#374151', fontSize:10, fontWeight:800, letterSpacing:'3px', textTransform:'uppercase' },
  sectionElectionName:{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:20, color:'#fff' },

  // Position tabs
  posTabs: { display:'flex', gap:6, marginBottom:28, overflowX:'auto', paddingBottom:4, justifyContent:'center', flexWrap:'wrap' },
  posTab:  { padding:'8px 18px', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', background:'transparent', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' },
  posTabActive: { background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', color:'#22C55E' },
  posTabDot:    { width:6, height:6, background:'#22C55E', borderRadius:'50%', animation:'pulseDot 2s infinite' },

  // Candidate cards
  candidateGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16, marginBottom:24 },
  candCard:      { background:'#0A1628', border:'1px solid', borderRadius:20, overflow:'hidden', transition:'all 0.22s', cursor:'default' },
  candCardHover: { transform:'translateY(-4px)', boxShadow:'0 16px 48px rgba(0,0,0,0.5)' },
  candPhoto:     { height:200, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' },
  candPhotoImg:  { width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top', transition:'transform 0.3s' },
  candInitialWrap:{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' },
  candInitial:   { fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:72 },
  candAccentBar: { position:'absolute', bottom:0, left:0, right:0, height:3, transition:'opacity 0.2s' },
  candBody:      { padding:'16px 18px' },
  candPosition:  { fontSize:10, fontWeight:800, letterSpacing:'2px', textTransform:'uppercase', marginBottom:6 },
  candName:      { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:18, color:'#fff', marginBottom:4, lineHeight:1.2 },
  candDept:      { fontSize:12, color:'#374151', marginBottom:8 },
  candManifesto: { fontSize:12, color:'#1F2937', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' },
  candFooter:    { padding:'0 18px 16px' },
  candVoteBtn:   { width:'100%', padding:'9px', background:'transparent', border:'1px solid', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'background 0.15s' },

  // Dots and note
  dotRow:             { display:'flex', justifyContent:'center', gap:6, marginBottom:16 },
  dotBtn:             { height:8, borderRadius:99, border:'none', cursor:'pointer', background:'rgba(255,255,255,0.1)', transition:'all 0.3s', padding:0 },
  allCandidatesNote:  { textAlign:'center', fontSize:12, color:'#1F2937' },

  // Footer
  footer:     { position:'relative', zIndex:10, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 28px', borderTop:'1px solid rgba(255,255,255,0.04)' },
  footerText: { fontSize:11, color:'#1F2937', fontWeight:500 },
};
