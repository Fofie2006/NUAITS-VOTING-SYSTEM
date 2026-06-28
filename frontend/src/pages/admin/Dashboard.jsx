import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, updateElectionStatus } from '../../utils/api';
import toast from 'react-hot-toast';

const StatCard = ({ icon, label, value, sub, accent }) => (
  <div style={s.statCard}>
    <div style={{ ...s.statIcon, background: accent ? 'rgba(34,197,94,0.1)' : 'rgba(29,78,216,0.1)' }}>
      {icon}
    </div>
    <div style={{ ...s.statValue, color: accent ? '#22C55E' : '#fff' }}>{value}</div>
    <div style={s.statLabel}>{label}</div>
    {sub && <div style={{ ...s.statSub, color: accent ? '#16A34A' : '#374151' }}>{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(false);

  const load = () => {
    getDashboardStats()
      .then(r => setStats(r.data.data))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); const i = setInterval(load, 20000); return () => clearInterval(i); }, []);

  const toggleVoting = async () => {
    const el = stats?.currentElection;
    if (!el || el.status !== 'active') { toast.error('Start the election first'); return; }
    setActing(true);
    try {
      await updateElectionStatus(el.id, { voting_enabled: !el.voting_enabled });
      toast.success(el.voting_enabled ? 'Voting paused' : 'Voting is now LIVE');
      load();
    } catch { toast.error('Failed'); }
    finally { setActing(false); }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:300 }}>
      <div style={spinner} />
    </div>
  );

  const el = stats?.currentElection;
  const isLive = el?.status === 'active' && el?.voting_enabled;
  const turnout = stats?.turnoutPct ?? 0;

  return (
    <div style={s.root}>
      <div style={s.pageHeader}>
        <h1 style={s.pageTitle}>Dashboard</h1>
        <p style={s.pageSub}>NUAITS Election Control Centre</p>
      </div>

      {/* Election status card */}
      {el ? (
        <div style={{ ...s.electionCard, borderColor: isLive ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)' }}>
          <div style={s.electionCardLeft}>
            <div style={s.electionStatusRow}>
              {isLive ? (
                <span style={s.pillLive}><span style={s.liveDot} />VOTING LIVE</span>
              ) : el.status === 'active' ? (
                <span style={s.pillPaused}>⏸ Paused</span>
              ) : el.status === 'ended' ? (
                <span style={s.pillEnded}>🏁 Ended</span>
              ) : (
                <span style={s.pillPending}>⏳ Pending</span>
              )}
            </div>
            <div style={s.electionName}>{el.title}</div>
            {el.start_time && (
              <div style={s.electionMeta}>Started {new Date(el.start_time).toLocaleString()}</div>
            )}
          </div>
          {el.status === 'active' && (
            <button
              onClick={toggleVoting} disabled={acting}
              style={{ ...s.toggleBtn, background: isLive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', color: isLive ? '#EF4444' : '#22C55E', borderColor: isLive ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)' }}
            >
              {isLive ? '⏸ Pause Voting' : '▶ Enable Voting'}
            </button>
          )}
        </div>
      ) : (
        <div style={s.noElectionCard}>
          <span>⚠️</span>
          <span>No active election. <Link to="/admin/election" style={{ color:'#22C55E' }}>Create one →</Link></span>
        </div>
      )}

      {/* Turnout bar */}
      {el && (
        <div style={s.turnoutRow}>
          <span style={s.turnoutLabel}>Voter Turnout</span>
          <div style={s.turnoutTrack}>
            <div style={{ ...s.turnoutFill, width: `${turnout}%` }} />
          </div>
          <span style={s.turnoutPct}>{turnout}%</span>
        </div>
      )}

      {/* Stats */}
      <div style={s.statsGrid}>
        <StatCard icon="👥" label="Registered Students" value={stats?.totalStudents ?? 0} />
        <StatCard icon="✅" label="Votes Cast"          value={stats?.votedStudents ?? 0} sub={`${turnout}% turnout`} accent />
        <StatCard icon="🎓" label="Candidates"          value={stats?.totalCandidates ?? 0} />
        <StatCard icon="🗳️" label="Total Votes"         value={stats?.totalVotes ?? 0} />
      </div>

      {/* Quick links + recent logs */}
      <div style={s.bottomGrid}>
        <div style={s.panel}>
          <div style={s.panelTitle}>Quick Actions</div>
          {[
            { to:'/admin/students',   icon:'👥', label:'Manage Students',    sub:'Add, view, edit registered voters' },
            { to:'/admin/candidates', icon:'🎓', label:'Manage Candidates',  sub:'Add and edit election candidates' },
            { to:'/admin/election',   icon:'⚙️', label:'Election Controls',  sub:'Start, pause, or end election' },
            { to:'/admin/results',    icon:'📈', label:'View Results',        sub:'Live vote counts and charts' },
          ].map(a => (
            <Link key={a.to} to={a.to} style={s.actionRow}>
              <div style={s.actionIcon}>{a.icon}</div>
              <div>
                <div style={s.actionLabel}>{a.label}</div>
                <div style={s.actionSub}>{a.sub}</div>
              </div>
              <span style={s.actionArrow}>→</span>
            </Link>
          ))}
        </div>

        <div style={s.panel}>
          <div style={s.panelTitle}>Recent Activity</div>
          {stats?.recentLogs?.length > 0 ? stats.recentLogs.map(log => (
            <div key={log.id} style={s.logRow}>
              <span style={{ ...s.logDot, background: log.success ? '#22C55E' : '#EF4444' }} />
              <div style={s.logInfo}>
                <div style={s.logAction}>{log.action.replace(/_/g,' ')}</div>
                <div style={s.logMeta}>{new Date(log.timestamp).toLocaleString()} · {log.ip_address || '—'}</div>
              </div>
            </div>
          )) : (
            <div style={s.emptyLogs}>No activity yet</div>
          )}
        </div>
      </div>

      <style>{css}</style>
    </div>
  );
}

const css = `
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.7)}}
  a{text-decoration:none}
`;
const spinner = {
  width:36, height:36, border:'3px solid rgba(34,197,94,0.2)',
  borderTopColor:'#22C55E', borderRadius:'50%', animation:'spin 0.8s linear infinite',
};
const s = {
  root: { color:'#fff', fontFamily:'Inter,sans-serif' },
  pageHeader: { marginBottom:28 },
  pageTitle: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:28, color:'#fff', margin:0 },
  pageSub:   { fontSize:13, color:'#374151', marginTop:4 },

  electionCard: {
    background:'#0A1628', border:'1px solid', borderRadius:18,
    padding:'20px 24px', marginBottom:20,
    display:'flex', alignItems:'center', justifyContent:'space-between',
    flexWrap:'wrap', gap:16,
  },
  electionCardLeft: {},
  electionStatusRow: { marginBottom:8 },
  pillLive: {
    display:'inline-flex', alignItems:'center', gap:6,
    background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)',
    borderRadius:20, padding:'4px 12px', fontSize:11, fontWeight:800,
    color:'#22C55E', letterSpacing:'1.5px',
  },
  liveDot: {
    display:'inline-block', width:7, height:7, background:'#22C55E',
    borderRadius:'50%', animation:'pulseDot 1.5s infinite',
  },
  pillPaused: { display:'inline-block', padding:'4px 12px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:20, fontSize:11, fontWeight:700, color:'#F59E0B' },
  pillEnded:  { display:'inline-block', padding:'4px 12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, fontSize:11, fontWeight:700, color:'#64748B' },
  pillPending:{ display:'inline-block', padding:'4px 12px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:20, fontSize:11, fontWeight:700, color:'#3B82F6' },
  electionName: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:20, color:'#fff' },
  electionMeta: { fontSize:12, color:'#374151', marginTop:4 },
  toggleBtn: {
    padding:'10px 20px', border:'1px solid', borderRadius:12,
    fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif',
    transition:'all 0.2s', background:'transparent',
  },
  noElectionCard: {
    background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)',
    borderRadius:14, padding:'14px 20px', marginBottom:20,
    display:'flex', alignItems:'center', gap:10, fontSize:14, color:'#F59E0B',
  },

  turnoutRow: {
    display:'flex', alignItems:'center', gap:14, marginBottom:24,
    background:'#0A1628', border:'1px solid rgba(255,255,255,0.05)',
    borderRadius:14, padding:'14px 20px',
  },
  turnoutLabel: { fontSize:11, fontWeight:700, color:'#374151', letterSpacing:'1px', textTransform:'uppercase', whiteSpace:'nowrap' },
  turnoutTrack: { flex:1, height:6, background:'rgba(255,255,255,0.05)', borderRadius:99, overflow:'hidden' },
  turnoutFill:  { height:'100%', background:'linear-gradient(90deg,#1D4ED8,#22C55E)', borderRadius:99, transition:'width 1s ease' },
  turnoutPct:   { fontSize:14, fontWeight:800, color:'#22C55E', minWidth:44, textAlign:'right', fontFamily:"'Space Grotesk',sans-serif" },

  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12, marginBottom:24 },
  statCard:  { background:'#0A1628', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, padding:'20px 18px' },
  statIcon:  { width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:14 },
  statValue: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:28, marginBottom:4 },
  statLabel: { fontSize:11, fontWeight:600, color:'#374151', textTransform:'uppercase', letterSpacing:'0.8px' },
  statSub:   { fontSize:12, fontWeight:600, marginTop:4 },

  bottomGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  panel: { background:'#0A1628', border:'1px solid rgba(255,255,255,0.05)', borderRadius:18, padding:'20px' },
  panelTitle: { fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:16 },

  actionRow: { display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:12, marginBottom:4, transition:'background 0.15s', cursor:'pointer' },
  actionIcon: { width:36, height:36, background:'rgba(29,78,216,0.1)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 },
  actionLabel: { fontSize:13, fontWeight:600, color:'#fff' },
  actionSub:   { fontSize:11, color:'#374151', marginTop:1 },
  actionArrow: { marginLeft:'auto', color:'#1F2937', fontSize:16 },

  logRow:    { display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 },
  logDot:    { width:7, height:7, borderRadius:'50%', marginTop:5, flexShrink:0 },
  logInfo:   {},
  logAction: { fontSize:12, fontWeight:600, color:'#94A3B8' },
  logMeta:   { fontSize:11, color:'#374151', marginTop:1 },
  emptyLogs: { fontSize:13, color:'#1F2937', fontStyle:'italic' },
};
