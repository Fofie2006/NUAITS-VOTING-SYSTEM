import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveElection, getElectionResults } from '../utils/api';

const REFRESH_MS = 10000; // 10-second live refresh
const CANDIDATE_COLORS = ['#22C55E','#3B82F6','#A855F7','#F59E0B','#EF4444','#14B8A6','#F97316','#EC4899'];

export default function LiveResultsPage() {
  const navigate = useNavigate();
  const [election, setElection]   = useState(null);
  const [results,  setResults]    = useState(null);
  const [loading,  setLoading]    = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activePos, setActivePos] = useState(0); // for auto-rotating position focus
  const [fullscreen, setFullscreen] = useState(false);

  const load = useCallback(async () => {
    try {
      const el = await getActiveElection();
      const elData = el.data.data;
      if (!elData) { setLoading(false); return; }
      setElection(elData);
      const res = await getElectionResults(elData.id);
      setResults(res.data.data);
      setLastUpdate(new Date());
    } catch (e) {
      // silent — keep old data visible
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  // Auto-rotate through positions every 12s (big screen mode)
  useEffect(() => {
    if (!results?.results?.length) return;
    const t = setInterval(() => {
      setActivePos(p => (p + 1) % results.results.length);
    }, 12000);
    return () => clearInterval(t);
  }, [results]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(f => !f);
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#060D1F', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
      <div style={{ width:48, height:48, border:'3px solid rgba(34,197,94,0.3)', borderTopColor:'#22C55E', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <div style={{ color:'#374151', fontSize:14, fontFamily:'Inter,sans-serif' }}>Loading results…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── No election ── */
  if (!election || !results) return (
    <div style={{ minHeight:'100vh', background:'#060D1F', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, fontFamily:'Inter,sans-serif' }}>
      <div style={{ fontSize:64, opacity:0.3 }}>📊</div>
      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:22, color:'rgba(255,255,255,0.3)' }}>No Results Available</div>
      <div style={{ color:'#374151', fontSize:14 }}>No active election found.</div>
      <button onClick={() => navigate('/')} style={{ marginTop:16, padding:'10px 22px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:10, color:'#4B5563', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>← Home</button>
    </div>
  );

  const isLive    = election.status === 'active';
  const posResults = results.results || [];
  const focusPos  = posResults[activePos];

  return (
    <div style={s.root}>
      <div style={s.dotGrid} />
      <div style={s.glowBL} />
      <div style={s.glowTR} />

      {/* ── Top bar ── */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.shield}>🛡</div>
          <div>
            <div style={s.electionTitle}>{election.title}</div>
            <div style={s.electionSub}>Njala Campus · NUAITS 2026/2027</div>
          </div>
        </div>
        <div style={s.headerMid}>
          {isLive ? (
            <div style={s.livePill}>
              <span style={s.liveDot} />
              <span style={s.liveLabel}>LIVE</span>
              <span style={s.liveSep} />
              <span style={s.liveRefresh}>Updates every 10s</span>
            </div>
          ) : (
            <div style={s.endedPill}>🏁 Election Ended</div>
          )}
        </div>
        <div style={s.headerRight}>
          <button onClick={toggleFullscreen} style={s.iconBtn} title="Fullscreen">⛶</button>
          <button onClick={() => navigate('/')} style={s.iconBtn}>← Home</button>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div style={s.statsBar}>
        {[
          { label: 'TOTAL VOTERS', value: results.totalVoters },
          { label: 'REGISTERED', value: results.totalStudents },
          { label: 'TURNOUT', value: `${results.turnout}%`, accent: true },
          { label: 'POSITIONS', value: posResults.length },
          { label: 'LAST UPDATE', value: lastUpdate ? lastUpdate.toLocaleTimeString() : '—', small: true },
        ].map((stat, i) => (
          <div key={i} style={s.statItem}>
            <div style={{ ...s.statValue, ...(stat.accent ? s.statValueAccent : {}), ...(stat.small ? s.statValueSmall : {}) }}>
              {stat.value}
            </div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Turnout bar ── */}
      <div style={s.turnoutWrap}>
        <div style={s.turnoutTrack}>
          <div style={{
            ...s.turnoutFill,
            width: `${results.turnout}%`,
          }} />
        </div>
        <div style={s.turnoutPct}>{results.turnout}% TURNOUT</div>
      </div>

      {/* ── Main results grid ── */}
      <div style={s.body}>

        {/* Position tabs */}
        <div style={s.posTabs}>
          {posResults.map((pos, i) => (
            <button
              key={pos.position}
              onClick={() => setActivePos(i)}
              style={{
                ...s.posTab,
                ...(i === activePos ? s.posTabActive : {}),
              }}
            >
              {pos.position}
              {i === activePos && <span style={s.posTabDot} />}
            </button>
          ))}
        </div>

        {/* Focus position — big screen display */}
        {focusPos && (
          <div style={s.focusBlock} key={activePos}>
            <div style={s.focusHeader}>
              <div style={s.focusPosition}>{focusPos.position}</div>
              {!isLive && focusPos.winner && focusPos.winner.vote_count > 0 && (
                <div style={s.winnerBadge}>
                  <span style={s.crown}>👑</span>
                  <span style={s.winnerName}>{focusPos.winner.fullname}</span>
                </div>
              )}
              {isLive && focusPos.winner && focusPos.winner.vote_count > 0 && (
                <div style={{ ...s.winnerBadge, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <span>🔝</span>
                  <span style={{ ...s.winnerName, color: '#22C55E' }}>Leading: {focusPos.winner.fullname}</span>
                </div>
              )}
            </div>

            {/* Candidate cards */}
            <div style={s.candidateResults}>
              {focusPos.candidates.map((c, ci) => {
                const color = CANDIDATE_COLORS[ci % CANDIDATE_COLORS.length];
                const isWinner = !isLive && c.id === focusPos.winner?.id && c.vote_count > 0;
                return (
                  <div key={c.id} style={{ ...s.resultCard, ...(isWinner ? s.resultCardWinner : {}) }}>
                    {/* Rank */}
                    <div style={{ ...s.rank, color }}>#{ci + 1}</div>

                    {/* Avatar */}
                    <div style={{ ...s.resultAvatar, background: `${color}18`, border: `2px solid ${color}40` }}>
                      {c.photo
                        ? <img src={c.photo} alt={c.fullname} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:28, color }}>{c.fullname[0]}</span>
                      }
                    </div>

                    {/* Info */}
                    <div style={s.resultInfo}>
                      <div style={s.resultName}>{c.fullname}</div>
                      {c.department && <div style={s.resultDept}>{c.department}</div>}

                      {/* Bar */}
                      <div style={s.barTrack}>
                        <div style={{
                          ...s.barFill,
                          '--w': `${c.percentage}%`,
                          width: `${c.percentage}%`,
                          background: isWinner
                            ? `linear-gradient(90deg, ${color}, #22C55E)`
                            : color,
                          boxShadow: isWinner ? `0 0 20px ${color}60` : 'none',
                          animation: 'barGrow 1s ease both',
                        }} />
                      </div>
                    </div>

                    {/* Vote count */}
                    <div style={s.resultVotes}>
                      <div style={{ ...s.voteCount, color }}>{c.vote_count}</div>
                      <div style={s.votePct}>{c.percentage}%</div>
                      {isWinner && <div style={s.winnerCrown}>👑</div>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={s.posTotal}>
              Total votes for this position: <strong style={{ color: '#fff' }}>{focusPos.totalVotes}</strong>
            </div>
          </div>
        )}

        {/* All positions summary grid */}
        <div style={s.summaryGrid}>
          <div style={s.summaryLabel}>All Positions Summary</div>
          <div style={s.summaryCards}>
            {posResults.map((pos, pi) => {
              const leader = pos.candidates[0];
              return (
                <button
                  key={pos.position}
                  onClick={() => setActivePos(pi)}
                  style={{ ...s.summaryCard, ...(pi === activePos ? s.summaryCardActive : {}) }}
                >
                  <div style={s.summaryPos}>{pos.position}</div>
                  {leader && leader.vote_count > 0 ? (
                    <>
                      <div style={s.summaryLeader}>{leader.fullname}</div>
                      <div style={s.summaryVotes}>{leader.vote_count} votes · {leader.percentage}%</div>
                      <div style={{ ...s.summaryBar, width: `${leader.percentage}%` }} />
                    </>
                  ) : (
                    <div style={s.summaryEmpty}>No votes yet</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes barGrow { from{width:0%} to{width:var(--w)} }
        @keyframes crownPop { 0%{transform:scale(0) rotate(-20deg);opacity:0} 70%{transform:scale(1.3) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh', background: '#060D1F',
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden',
    fontFamily: 'Inter, sans-serif', color: '#fff',
  },
  dotGrid: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
    backgroundSize: '26px 26px',
  },
  glowBL: {
    position: 'absolute', bottom: -100, left: -80, width: 500, height: 500,
    borderRadius: '50%', pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(29,78,216,0.12) 0%, transparent 70%)',
  },
  glowTR: {
    position: 'absolute', top: -80, right: -60, width: 400, height: 400,
    borderRadius: '50%', pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
  },

  /* Header */
  header: {
    position: 'relative', zIndex: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 28px', gap: 16, flexWrap: 'wrap',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(6,13,31,0.8)', backdropFilter: 'blur(10px)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  shield: {
    width: 38, height: 38, background: 'linear-gradient(135deg,#1e40af,#1d4ed8)',
    borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 17, boxShadow: '0 4px 14px rgba(29,78,216,0.35)',
  },
  electionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 16, color: '#fff', lineHeight: 1,
  },
  electionSub: { fontSize: 11, color: '#374151', marginTop: 3 },
  headerMid: { flex: 1, display: 'flex', justifyContent: 'center' },
  livePill: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 20, padding: '6px 16px',
  },
  liveDot: {
    width: 8, height: 8, background: '#22C55E', borderRadius: '50%',
    animation: 'pulseDot 1.5s infinite', display: 'inline-block',
  },
  liveLabel: { color: '#22C55E', fontWeight: 800, fontSize: 13, letterSpacing: '2px' },
  liveSep: { width: 1, height: 14, background: 'rgba(34,197,94,0.3)' },
  liveRefresh: { color: '#374151', fontSize: 11 },
  endedPill: {
    padding: '6px 16px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
    fontSize: 13, fontWeight: 600, color: '#64748B',
  },
  headerRight: { display: 'flex', gap: 8, alignItems: 'center' },
  iconBtn: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '7px 14px', color: '#4B5563',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
  },

  /* Stats bar */
  statsBar: {
    display: 'flex', justifyContent: 'center', gap: 0,
    padding: '0 28px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(10,22,40,0.5)',
    position: 'relative', zIndex: 10, flexWrap: 'wrap',
  },
  statItem: {
    padding: '14px 32px', textAlign: 'center',
    borderRight: '1px solid rgba(255,255,255,0.05)',
  },
  statValue: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 26, color: '#fff', lineHeight: 1,
  },
  statValueAccent: { color: '#22C55E' },
  statValueSmall: { fontSize: 16 },
  statLabel: {
    fontSize: 9, fontWeight: 700, color: '#374151',
    letterSpacing: '2px', textTransform: 'uppercase', marginTop: 4,
  },

  /* Turnout bar */
  turnoutWrap: {
    position: 'relative', zIndex: 10,
    padding: '0 28px',
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'rgba(6,13,31,0.6)',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  turnoutTrack: {
    flex: 1, height: 4,
    background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden',
  },
  turnoutFill: {
    height: '100%', borderRadius: 99,
    background: 'linear-gradient(90deg, #1D4ED8, #22C55E)',
    boxShadow: '0 0 12px rgba(34,197,94,0.4)',
    transition: 'width 1s ease',
  },
  turnoutPct: {
    fontSize: 10, fontWeight: 800, color: '#22C55E',
    letterSpacing: '2px', whiteSpace: 'nowrap', padding: '8px 0',
  },

  /* Body */
  body: {
    flex: 1, position: 'relative', zIndex: 10,
    padding: '24px 28px 40px', overflow: 'auto',
  },

  /* Position tabs */
  posTabs: {
    display: 'flex', gap: 6, marginBottom: 24,
    overflowX: 'auto', paddingBottom: 4, flexWrap: 'wrap',
  },
  posTab: {
    padding: '8px 18px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
    color: '#4B5563', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'Inter,sans-serif', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: 6, position: 'relative',
    whiteSpace: 'nowrap',
  },
  posTabActive: {
    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)',
    color: '#22C55E',
  },
  posTabDot: {
    width: 6, height: 6, background: '#22C55E', borderRadius: '50%',
    animation: 'pulseDot 2s infinite',
  },

  /* Focus block */
  focusBlock: {
    background: '#0A1628', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20, padding: '24px', marginBottom: 32,
    animation: 'fadeSlide 0.4s ease both',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
  },
  focusHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, flexWrap: 'wrap', gap: 12,
  },
  focusPosition: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 26, color: '#fff',
  },
  winnerBadge: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
    borderRadius: 12, padding: '8px 16px',
  },
  crown: { fontSize: 18, animation: 'crownPop 0.5s ease both' },
  winnerName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700, fontSize: 15, color: '#F59E0B',
  },
  candidateResults: { display: 'flex', flexDirection: 'column', gap: 12 },
  resultCard: {
    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 16, transition: 'all 0.2s',
  },
  resultCardWinner: {
    background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)',
    boxShadow: '0 4px 20px rgba(34,197,94,0.08)',
  },
  rank: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 18, minWidth: 32, textAlign: 'center',
  },
  resultAvatar: {
    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  resultInfo: { flex: 1, minWidth: 0 },
  resultName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 2,
  },
  resultDept: { fontSize: 12, color: '#374151', marginBottom: 10 },
  barTrack: {
    height: 8, background: 'rgba(255,255,255,0.05)',
    borderRadius: 99, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 99, transition: 'width 1s ease' },
  resultVotes: { textAlign: 'right', flexShrink: 0, minWidth: 80 },
  voteCount: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700, fontSize: 28, lineHeight: 1,
  },
  votePct: { fontSize: 12, color: '#374151', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" },
  winnerCrown: { fontSize: 18, marginTop: 4, animation: 'crownPop 0.5s 0.2s ease both' },
  posTotal: {
    marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)',
    fontSize: 12, color: '#374151', textAlign: 'right',
  },

  /* Summary grid */
  summaryGrid: { marginTop: 8 },
  summaryLabel: {
    fontSize: 10, fontWeight: 700, color: '#1F2937',
    letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12,
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 10,
  },
  summaryCard: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'Inter,sans-serif', transition: 'all 0.2s',
    position: 'relative', overflow: 'hidden',
  },
  summaryCardActive: {
    border: '1px solid rgba(34,197,94,0.25)',
    background: 'rgba(34,197,94,0.04)',
  },
  summaryPos: {
    fontSize: 11, fontWeight: 700, color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6,
  },
  summaryLeader: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 3,
  },
  summaryVotes: { fontSize: 11, color: '#4B5563', marginBottom: 8 },
  summaryBar: {
    position: 'absolute', bottom: 0, left: 0, height: 2,
    background: 'linear-gradient(90deg, #1D4ED8, #22C55E)',
    transition: 'width 1s ease',
  },
  summaryEmpty: { fontSize: 12, color: '#1F2937', fontStyle: 'italic' },
};
