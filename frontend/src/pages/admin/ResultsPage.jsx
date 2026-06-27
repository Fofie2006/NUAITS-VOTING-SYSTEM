import React, { useEffect, useState } from 'react';
import { getElections, getElectionResults } from '../../utils/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const COLORS = ['#22C55E','#3B82F6','#A855F7','#F59E0B','#EF4444','#14B8A6','#F97316','#EC4899'];

export default function ResultsPage() {
  const [elections,  setElections]  = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [results,    setResults]    = useState(null);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    getElections().then(r => {
      setElections(r.data.data);
      const active = r.data.data.find(e => e.status === 'active' || e.status === 'ended');
      if (active) setSelectedId(String(active.id));
    }).catch(() => toast.error('Failed to load elections'));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    getElectionResults(selectedId)
      .then(r => setResults(r.data.data))
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false));
  }, [selectedId]);

  // Auto-refresh for active elections
  useEffect(() => {
    const el = elections.find(e => String(e.id) === selectedId);
    if (!el || el.status !== 'active') return;
    const t = setInterval(() => {
      getElectionResults(selectedId).then(r => setResults(r.data.data)).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, [selectedId, elections]);

  const exportCSV = () => {
    if (!results) return;
    const rows = [['Position','Candidate','Votes','%']];
    results.results.forEach(pos => pos.candidates.forEach(c => rows.push([pos.position, c.fullname, c.vote_count, `${c.percentage}%`])));
    rows.push([], ['','','Total Voters', results.totalVoters], ['','','Registered', results.totalStudents], ['','','Turnout', `${results.turnout}%`]);
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`nuaits_results_${selectedId}.csv`; a.click();
  };

  return (
    <div style={s.root}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Results</h1>
          <p style={s.pageSub}>Live vote counts and analytics</p>
        </div>
        <div style={s.headerRight}>
          {results && <button onClick={exportCSV} style={s.btnGhost}>⬇ Export CSV</button>}
          {results?.election?.status === 'active' && (
            <span style={s.liveChip}><span style={s.liveDot} />LIVE · 15s refresh</span>
          )}
        </div>
      </div>

      {/* Election selector */}
      {elections.length > 0 && (
        <div style={s.selectorRow}>
          <label style={s.label}>Select Election</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={s.select}>
            <option value="">Choose election…</option>
            {elections.map(e => <option key={e.id} value={String(e.id)}>{e.title} ({e.status})</option>)}
          </select>
        </div>
      )}

      {!selectedId && (
        <div style={s.emptyState}>
          <span style={{ fontSize:48, opacity:0.15 }}>📈</span>
          <p style={{ color:'#374151', fontSize:14 }}>Select an election to view results</p>
        </div>
      )}

      {loading && <div style={s.loadingRow}><div style={spinnerEl} /></div>}

      {results && !loading && (
        <>
          {/* Summary */}
          <div style={s.summaryGrid}>
            {[
              { label:'Voters',     value:results.totalVoters,    color:'#22C55E' },
              { label:'Registered', value:results.totalStudents,  color:'#fff' },
              { label:'Turnout',    value:`${results.turnout}%`,  color:'#22C55E' },
              { label:'Positions',  value:results.results.length, color:'#3B82F6' },
            ].map(s2 => (
              <div key={s2.label} style={s.summaryCard}>
                <div style={{ ...s.summaryValue, color:s2.color }}>{s2.value}</div>
                <div style={s.summaryLabel}>{s2.label}</div>
              </div>
            ))}
          </div>

          {/* Turnout bar */}
          <div style={s.turnoutRow}>
            <span style={s.turnoutLabel}>Voter Turnout</span>
            <div style={s.turnoutTrack}>
              <div style={{ ...s.turnoutFill, width:`${results.turnout}%` }} />
            </div>
            <span style={s.turnoutPct}>{results.turnout}%</span>
          </div>

          {/* Position results */}
          {results.results.map(posResult => {
            const labels = posResult.candidates.map(c => c.fullname);
            const data   = posResult.candidates.map(c => c.vote_count);
            const bgColors = COLORS.slice(0, labels.length);
            const isEnded  = results.election?.status === 'ended';

            return (
              <div key={posResult.position} style={s.posCard}>
                {/* Header */}
                <div style={s.posCardHead}>
                  <span style={s.posName}>{posResult.position}</span>
                  {posResult.winner && posResult.winner.vote_count > 0 && (
                    <div style={s.winnerBadge}>
                      <span>{isEnded ? '👑 Winner:' : '🔝 Leading:'}</span>
                      <span style={{ color: isEnded ? '#F59E0B' : '#22C55E', fontWeight:700 }}>{posResult.winner.fullname}</span>
                    </div>
                  )}
                </div>

                {/* Vote bars */}
                <div style={s.voteBars}>
                  {posResult.candidates.map((c, ci) => (
                    <div key={c.id} style={s.voteBarRow}>
                      <div style={s.voteBarInfo}>
                        <div style={s.voteBarDot(COLORS[ci % COLORS.length])} />
                        <span style={s.voteBarName}>{c.fullname}</span>
                        {c.department && <span style={s.voteBarDept}>({c.department})</span>}
                      </div>
                      <div style={s.voteBarTrack}>
                        <div style={{
                          ...s.voteBarFill,
                          width:`${c.percentage}%`,
                          background: COLORS[ci % COLORS.length],
                        }} />
                      </div>
                      <span style={s.voteBarCount}>{c.vote_count} <span style={{ color:'#374151' }}>({c.percentage}%)</span></span>
                    </div>
                  ))}
                </div>

                {/* Chart */}
                {data.some(d => d > 0) && (
                  <div style={{ height:180, marginTop:16 }}>
                    <Bar
                      data={{
                        labels,
                        datasets: [{ label:'Votes', data, backgroundColor: bgColors, borderRadius:8, borderSkipped:false }],
                      }}
                      options={{
                        responsive:true, maintainAspectRatio:false,
                        plugins: {
                          legend: { display:false },
                          tooltip: { callbacks: { label: ctx => ` ${ctx.raw} votes` } },
                        },
                        scales: {
                          x: { ticks:{ color:'#374151', font:{ size:11 } }, grid:{ color:'rgba(255,255,255,0.03)' } },
                          y: { beginAtZero:true, ticks:{ color:'#374151', stepSize:1 }, grid:{ color:'rgba(255,255,255,0.04)' } },
                        },
                      }}
                    />
                  </div>
                )}

                <div style={s.posTotal}>Position total: <strong style={{ color:'#fff' }}>{posResult.totalVotes}</strong> votes</div>
              </div>
            );
          })}
        </>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.7)}} select:focus{outline:none;border-color:rgba(34,197,94,0.5)!important}`}</style>
    </div>
  );
}

const spinnerEl = { width:32, height:32, border:'3px solid rgba(34,197,94,0.2)', borderTopColor:'#22C55E', borderRadius:'50%', animation:'spin 0.8s linear infinite' };

const s = {
  root: { color:'#fff', fontFamily:'Inter,sans-serif' },
  pageHeader: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 },
  pageTitle:  { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:28, color:'#fff', margin:0 },
  pageSub:    { fontSize:13, color:'#374151', marginTop:4 },
  headerRight:{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' },
  btnGhost:   { padding:'9px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  liveChip:   { display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:10, fontSize:11, fontWeight:800, color:'#22C55E', letterSpacing:'1px' },
  liveDot:    { display:'inline-block', width:6, height:6, background:'#22C55E', borderRadius:'50%', animation:'pulseDot 1.5s infinite' },
  selectorRow:{ display:'flex', flexDirection:'column', gap:7, marginBottom:24, maxWidth:400 },
  label:      { fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'1px' },
  select:     { background:'#0A1628', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:14, fontFamily:'Inter,sans-serif', cursor:'pointer', transition:'border-color 0.2s' },
  emptyState: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:80, background:'#0A1628', borderRadius:18, border:'1px solid rgba(255,255,255,0.05)' },
  loadingRow: { display:'flex', justifyContent:'center', padding:60 },

  summaryGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12, marginBottom:20 },
  summaryCard: { background:'#0A1628', border:'1px solid rgba(255,255,255,0.05)', borderRadius:14, padding:'18px 16px' },
  summaryValue:{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:26, marginBottom:4 },
  summaryLabel:{ fontSize:10, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'1px' },

  turnoutRow:  { display:'flex', alignItems:'center', gap:14, marginBottom:24, background:'#0A1628', border:'1px solid rgba(255,255,255,0.05)', borderRadius:14, padding:'14px 18px' },
  turnoutLabel:{ fontSize:10, fontWeight:700, color:'#374151', letterSpacing:'1px', textTransform:'uppercase', whiteSpace:'nowrap' },
  turnoutTrack:{ flex:1, height:6, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' },
  turnoutFill: { height:'100%', background:'linear-gradient(90deg,#1D4ED8,#22C55E)', borderRadius:99, transition:'width 1s ease' },
  turnoutPct:  { fontSize:14, fontWeight:800, color:'#22C55E', minWidth:44, textAlign:'right', fontFamily:"'Space Grotesk',sans-serif" },

  posCard:     { background:'#0A1628', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'22px', marginBottom:18 },
  posCardHead: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 },
  posName:     { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18, color:'#fff' },
  winnerBadge: { display:'flex', alignItems:'center', gap:8, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10, padding:'6px 14px', fontSize:13 },

  voteBars:    { display:'flex', flexDirection:'column', gap:14 },
  voteBarRow:  { display:'grid', gridTemplateColumns:'1fr 1fr auto', alignItems:'center', gap:12 },
  voteBarInfo: { display:'flex', alignItems:'center', gap:8 },
  voteBarDot:  (c) => ({ width:10, height:10, borderRadius:3, background:c, flexShrink:0 }),
  voteBarName: { fontSize:13, fontWeight:600, color:'#fff' },
  voteBarDept: { fontSize:11, color:'#374151' },
  voteBarTrack:{ height:8, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' },
  voteBarFill: { height:'100%', borderRadius:99, transition:'width 0.8s ease' },
  voteBarCount:{ fontSize:13, fontFamily:"'JetBrains Mono',monospace", fontWeight:600, color:'#fff', whiteSpace:'nowrap', textAlign:'right' },
  posTotal:    { marginTop:16, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.05)', fontSize:12, color:'#374151', textAlign:'right' },
};
