import React, { useEffect, useState } from 'react';
import { getElections, createElection, updateElectionStatus } from '../../utils/api';
import toast from 'react-hot-toast';

export default function ElectionPage() {
  const [elections, setElections] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showCreate,setShowCreate]= useState(false);
  const [form,      setForm]      = useState({ title:'', description:'' });
  const [saving,    setSaving]    = useState(false);
  const [acting,    setActing]    = useState(false);

  const load = () => getElections().then(r => setElections(r.data.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const activeElection  = elections.find(e => e.status === 'active');
  const pendingElection = elections.find(e => e.status === 'pending');
  const blocked = !!(activeElection || pendingElection);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createElection(form); toast.success('Election created'); setShowCreate(false); setForm({ title:'', description:'' }); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const doAction = async (id, updates, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setActing(true);
    try { await updateElectionStatus(id, updates); toast.success('Election updated'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(false); }
  };

  const statusMeta = {
    pending: { label:'Pending',  color:'#3B82F6', bg:'rgba(59,130,246,0.1)',  border:'rgba(59,130,246,0.2)' },
    active:  { label:'Active',   color:'#22C55E', bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.2)'  },
    ended:   { label:'Ended',    color:'#64748B', bg:'rgba(255,255,255,0.05)', border:'rgba(255,255,255,0.1)' },
  };

  return (
    <div style={s.root}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Election Control</h1>
          <p style={s.pageSub}>Create and manage elections</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          disabled={blocked}
          style={{ ...s.btnGreen, ...(blocked ? s.btnDisabled : {}) }}
        >
          + New Election
        </button>
      </div>

      {blocked && (
        <div style={s.infoBox}>
          ℹ️ Only one election can be active or pending at a time. End the current one before creating a new election.
        </div>
      )}

      {loading ? (
        <div style={s.loadingRow}><div style={spinnerEl} /></div>
      ) : elections.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize:48, opacity:0.15 }}>⚙️</span>
          <p style={{ color:'#374151', fontSize:14 }}>No elections created yet</p>
          <button onClick={() => setShowCreate(true)} style={s.btnGreen}>Create First Election</button>
        </div>
      ) : (
        <div style={s.electionsList}>
          {elections.map(el => {
            const meta = statusMeta[el.status] || statusMeta.pending;
            const isActive  = el.status === 'active';
            const isPending = el.status === 'pending';
            const isEnded   = el.status === 'ended';
            const isLive    = isActive && el.voting_enabled;

            return (
              <div key={el.id} style={{ ...s.elCard, borderColor: isLive ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)' }}>
                {/* Header */}
                <div style={s.elCardHead}>
                  <div>
                    <div style={s.elStatusRow}>
                      <span style={{ ...s.elStatus, background:meta.bg, color:meta.color, border:`1px solid ${meta.border}` }}>
                        {meta.label}
                      </span>
                      {isLive && (
                        <span style={s.liveChip}>
                          <span style={s.liveDot} />VOTING LIVE
                        </span>
                      )}
                    </div>
                    <div style={s.elTitle}>{el.title}</div>
                    {el.description && <div style={s.elDesc}>{el.description}</div>}
                    <div style={s.elMeta}>
                      Created {new Date(el.created_at).toLocaleString()}
                      {el.start_time && ` · Started ${new Date(el.start_time).toLocaleString()}`}
                      {el.end_time   && ` · Ended ${new Date(el.end_time).toLocaleString()}`}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                {!isEnded && (
                  <div style={s.elActions}>
                    {isPending && (
                      <button
                        onClick={() => doAction(el.id, { status:'active' }, 'Start this election? You can enable voting separately when ready.')}
                        disabled={acting}
                        style={s.btnStart}
                      >
                        ▶ Start Election
                      </button>
                    )}
                    {isActive && (
                      <>
                        <button
                          onClick={() => doAction(el.id, { voting_enabled: !el.voting_enabled })}
                          disabled={acting}
                          style={{ ...s.btnToggle, background:isLive?'rgba(245,158,11,0.1)':'rgba(34,197,94,0.1)', color:isLive?'#F59E0B':'#22C55E', borderColor:isLive?'rgba(245,158,11,0.25)':'rgba(34,197,94,0.25)' }}
                        >
                          {isLive ? '⏸ Pause Voting' : '▶ Enable Voting'}
                        </button>
                        <button
                          onClick={() => doAction(el.id, { status:'ended' }, '⚠️ End this election permanently? Voting will close and results will be finalised. This cannot be undone.')}
                          disabled={acting}
                          style={s.btnEnd}
                        >
                          ⏹ End Election
                        </button>
                      </>
                    )}
                  </div>
                )}

                {isEnded && (
                  <div style={s.endedNote}>
                    🏁 This election has ended. View results in the Results section.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div style={s.overlay}>
          <div style={s.overlayBg} onClick={() => setShowCreate(false)} />
          <div style={s.modalCard}>
            <div style={s.modalHead}>
              <span style={s.modalTitle}>Create New Election</span>
              <button onClick={() => setShowCreate(false)} style={s.modalClose}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={s.modalBody}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Election Title *</label>
                <input required value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. NUAITS General Elections 2026/2027" style={s.input} />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Description</label>
                <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} placeholder="Brief description (optional)" style={{ ...s.input, resize:'none' }} />
              </div>
              <div style={s.warningBox}>
                ⚠️ After creating, click <strong>Start Election</strong> to activate it, then <strong>Enable Voting</strong> when ready for students.
              </div>
              <div style={s.modalFooter}>
                <button type="button" onClick={() => setShowCreate(false)} style={s.btnGhost}>Cancel</button>
                <button type="submit" disabled={saving} style={s.btnGreen}>
                  {saving ? <><span style={spinnerInline} /> Creating…</> : 'Create Election'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.7)}} input:focus,textarea:focus{border-color:rgba(34,197,94,0.5)!important;outline:none} input::placeholder,textarea::placeholder{color:#1F2937}`}</style>
    </div>
  );
}

const spinnerEl     = { width:32, height:32, border:'3px solid rgba(34,197,94,0.2)', borderTopColor:'#22C55E', borderRadius:'50%', animation:'spin 0.8s linear infinite' };
const spinnerInline = { display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' };

const s = {
  root: { color:'#fff', fontFamily:'Inter,sans-serif' },
  pageHeader: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 },
  pageTitle:  { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:28, color:'#fff', margin:0 },
  pageSub:    { fontSize:13, color:'#374151', marginTop:4 },
  btnGreen:   { padding:'10px 18px', background:'linear-gradient(135deg,#15803D,#16A34A)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:6 },
  btnGhost:   { padding:'10px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  btnDisabled:{ opacity:0.3, cursor:'not-allowed' },
  loadingRow: { display:'flex', justifyContent:'center', padding:60 },
  emptyState: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:80, background:'#0A1628', borderRadius:18, border:'1px solid rgba(255,255,255,0.05)' },
  infoBox:    { background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:12, padding:'12px 16px', fontSize:13, color:'#60A5FA', marginBottom:20 },

  electionsList: { display:'flex', flexDirection:'column', gap:14 },
  elCard:     { background:'#0A1628', border:'1px solid', borderRadius:20, overflow:'hidden', transition:'border-color 0.2s' },
  elCardHead: { padding:'22px 24px' },
  elStatusRow:{ display:'flex', alignItems:'center', gap:8, marginBottom:10 },
  elStatus:   { padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, letterSpacing:'1px' },
  liveChip:   { display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:20, fontSize:11, fontWeight:800, color:'#22C55E', letterSpacing:'1.5px' },
  liveDot:    { display:'inline-block', width:6, height:6, background:'#22C55E', borderRadius:'50%', animation:'pulseDot 1.5s infinite' },
  elTitle:    { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:22, color:'#fff', marginBottom:4 },
  elDesc:     { fontSize:13, color:'#374151', marginBottom:6 },
  elMeta:     { fontSize:11, color:'#1F2937' },
  elActions:  { padding:'0 24px 22px', display:'flex', gap:10, flexWrap:'wrap' },
  btnStart:   { padding:'10px 20px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:12, color:'#22C55E', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' },
  btnToggle:  { padding:'10px 20px', border:'1px solid', borderRadius:12, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' },
  btnEnd:     { padding:'10px 20px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, color:'#EF4444', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  endedNote:  { padding:'14px 24px 20px', fontSize:13, color:'#374151', display:'flex', alignItems:'center', gap:8 },

  overlay:    { position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  overlayBg:  { position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' },
  modalCard:  { position:'relative', zIndex:51, background:'#0A1628', border:'1px solid rgba(255,255,255,0.09)', borderRadius:22, width:'100%', maxWidth:480, boxShadow:'0 32px 80px rgba(0,0,0,0.8)' },
  modalHead:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  modalTitle: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18, color:'#fff' },
  modalClose: { background:'transparent', border:'none', color:'#374151', fontSize:18, cursor:'pointer' },
  modalBody:  { padding:'24px', display:'flex', flexDirection:'column', gap:16 },
  fieldGroup: { display:'flex', flexDirection:'column', gap:7 },
  label:      { fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'1px' },
  input:      { background:'#060D1F', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:13, fontFamily:'Inter,sans-serif', boxSizing:'border-box', width:'100%', transition:'border-color 0.2s' },
  warningBox: { background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10, padding:'12px 14px', fontSize:12, color:'#F59E0B' },
  modalFooter:{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' },
};
