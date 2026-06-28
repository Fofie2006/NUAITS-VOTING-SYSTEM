import React, { useEffect, useState } from 'react';
import { getLogs, getInvalidAttempts } from '../../utils/api';
import toast from 'react-hot-toast';

const ACTION_COLORS = {
  VOTE_SUBMITTED:          { bg:'rgba(34,197,94,0.1)',   color:'#22C55E' },
  ADMIN_LOGIN:             { bg:'rgba(59,130,246,0.1)',  color:'#3B82F6' },
  STUDENT_REGISTERED:      { bg:'rgba(168,85,247,0.1)', color:'#A855F7' },
  ELECTION_STARTED:        { bg:'rgba(34,197,94,0.1)',   color:'#22C55E' },
  ELECTION_ENDED:          { bg:'rgba(100,116,139,0.1)', color:'#64748B' },
  CANDIDATE_ADDED:         { bg:'rgba(59,130,246,0.1)',  color:'#3B82F6' },
  VOTE_INVALID_CODE:       { bg:'rgba(239,68,68,0.1)',   color:'#EF4444' },
  VOTE_CODE_REUSED:        { bg:'rgba(239,68,68,0.1)',   color:'#EF4444' },
  VOTE_INVALID_STUDENT_ID: { bg:'rgba(239,68,68,0.1)',   color:'#EF4444' },
  ADMIN_LOGIN_FAILED:      { bg:'rgba(239,68,68,0.1)',   color:'#EF4444' },
  default:                 { bg:'rgba(255,255,255,0.05)', color:'#64748B' },
};

export default function LogsPage() {
  const [logs,    setLogs]    = useState([]);
  const [invalid, setInvalid] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('all');
  const [page,    setPage]    = useState(1);
  const [pagination, setPagination] = useState(null);

  const loadLogs = (p = 1) => {
    setLoading(true);
    getLogs({ page:p, limit:50 })
      .then(r => { setLogs(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false));
  };

  const loadInvalid = () => getInvalidAttempts().then(r => setInvalid(r.data.data)).catch(() => {});

  useEffect(() => { loadLogs(); loadInvalid(); }, []);

  const displayed = tab === 'invalid' ? invalid : logs;

  return (
    <div style={s.root}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Audit Logs</h1>
          <p style={s.pageSub}>Complete activity and security trail</p>
        </div>
        <button onClick={() => { loadLogs(page); loadInvalid(); }} style={s.btnGhost}>↺ Refresh</button>
      </div>

      {/* Tabs */}
      <div style={s.tabRow}>
        <button onClick={() => setTab('all')} style={{ ...s.tabBtn, ...(tab==='all'?s.tabBtnActive:{}) }}>
          All Activity
          {pagination && <span style={s.tabCount}>{pagination.total}</span>}
        </button>
        <button onClick={() => setTab('invalid')} style={{ ...s.tabBtn, ...(tab==='invalid'?s.tabBtnDanger:{}), display:'flex', alignItems:'center', gap:6 }}>
          ⚠️ Invalid Attempts
          {invalid.length > 0 && <span style={{ ...s.tabCount, background:'rgba(239,68,68,0.15)', color:'#EF4444' }}>{invalid.length}</span>}
        </button>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.loadingRow}><div style={spinnerEl} /></div>
        ) : displayed.length === 0 ? (
          <div style={s.emptyRow}>
            <span style={{ fontSize:40, opacity:0.15 }}>📋</span>
            <p style={{ color:'#374151', fontSize:14 }}>No log entries</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Timestamp','Action','ID / User','Description','IP','Status'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map(log => {
                  const ac = ACTION_COLORS[log.action] || ACTION_COLORS.default;
                  return (
                    <tr key={log.id} style={{ ...s.tr, background: log.success ? 'transparent' : 'rgba(239,68,68,0.03)' }}>
                      <td style={s.td}>
                        <span style={s.timestamp}>{new Date(log.timestamp).toLocaleString()}</span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.actionBadge, background:ac.bg, color:ac.color }}>
                          {log.action.replace(/_/g,' ')}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={s.mono}>{log.student_id || log.admin_user || '—'}</span>
                      </td>
                      <td style={s.td}>
                        <span style={s.desc}>{log.description || '—'}</span>
                      </td>
                      <td style={s.td}>
                        <span style={s.mono}>{log.ip_address || '—'}</span>
                      </td>
                      <td style={s.td}>
                        <span style={{
                          ...s.statusDot,
                          background: log.success ? '#22C55E' : '#EF4444',
                          boxShadow: log.success ? '0 0 6px rgba(34,197,94,0.4)' : '0 0 6px rgba(239,68,68,0.4)',
                        }} title={log.success ? 'Success' : 'Failed'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {tab === 'all' && pagination && pagination.pages > 1 && (
        <div style={s.paginationRow}>
          <span style={s.paginationInfo}>Page {pagination.page} of {pagination.pages} · {pagination.total} entries</span>
          <div style={s.paginationBtns}>
            <button
              onClick={() => { const p = Math.max(1, page-1); setPage(p); loadLogs(p); }}
              disabled={page === 1}
              style={{ ...s.pageBtn, ...(page===1?s.pageBtnDisabled:{}) }}
            >← Prev</button>
            <button
              onClick={() => { const p = Math.min(pagination.pages, page+1); setPage(p); loadLogs(p); }}
              disabled={page === pagination.pages}
              style={{ ...s.pageBtn, ...(page===pagination.pages?s.pageBtnDisabled:{}) }}
            >Next →</button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} tr:hover td{background:rgba(255,255,255,0.015)!important}`}</style>
    </div>
  );
}

const spinnerEl = { width:32, height:32, border:'3px solid rgba(34,197,94,0.2)', borderTopColor:'#22C55E', borderRadius:'50%', animation:'spin 0.8s linear infinite' };

const s = {
  root: { color:'#fff', fontFamily:'Inter,sans-serif' },
  pageHeader: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 },
  pageTitle:  { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:28, color:'#fff', margin:0 },
  pageSub:    { fontSize:13, color:'#374151', marginTop:4 },
  btnGhost:   { padding:'9px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' },

  tabRow:     { display:'flex', gap:6, marginBottom:20 },
  tabBtn:     { padding:'9px 18px', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', background:'transparent', color:'#374151', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:6, transition:'all 0.15s' },
  tabBtnActive:{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', color:'#22C55E' },
  tabBtnDanger:{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', color:'#EF4444' },
  tabCount:   { display:'inline-block', padding:'1px 7px', borderRadius:20, fontSize:10, fontWeight:700, background:'rgba(255,255,255,0.08)', color:'#64748B' },

  tableWrap:  { background:'#0A1628', border:'1px solid rgba(255,255,255,0.06)', borderRadius:18, overflow:'hidden' },
  loadingRow: { display:'flex', justifyContent:'center', padding:60 },
  emptyRow:   { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:60 },
  table:      { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:         { padding:'12px 14px', textAlign:'left', fontSize:9, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'1px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)', whiteSpace:'nowrap' },
  tr:         { borderBottom:'1px solid rgba(255,255,255,0.03)', transition:'background 0.1s' },
  td:         { padding:'11px 14px', verticalAlign:'middle' },

  timestamp:   { fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#374151', whiteSpace:'nowrap' },
  actionBadge: { display:'inline-block', padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700, whiteSpace:'nowrap' },
  mono:        { fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#3B82F6' },
  desc:        { fontSize:11, color:'#374151', maxWidth:240, display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  statusDot:   { display:'inline-block', width:8, height:8, borderRadius:'50%' },

  paginationRow:  { display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16, flexWrap:'wrap', gap:10 },
  paginationInfo: { fontSize:12, color:'#374151' },
  paginationBtns: { display:'flex', gap:8 },
  pageBtn:        { padding:'8px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, color:'#64748B', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  pageBtnDisabled:{ opacity:0.3, cursor:'not-allowed' },
};
