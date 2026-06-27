import React, { useEffect, useState } from 'react';
import { getAdminCandidates, createCandidate, updateCandidate, deleteCandidate } from '../../utils/api';
import toast from 'react-hot-toast';

const POSITIONS = ['President','Vice President','Secretary General','Assistant Secretary','Financial Secretary','Treasurer','Public Relations Officer','Social Secretary','Sports Secretary','Academic Secretary'];
const DEPTS = ['Computer Science','Information Technology','Software Engineering','Information Systems','Electrical Engineering','Mathematics','Other'];
const COLORS = ['#22C55E','#3B82F6','#A855F7','#F59E0B','#EF4444','#14B8A6','#F97316','#EC4899'];
const EMPTY = { fullname:'', position:'', department:'', manifesto:'', photo:'' };

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [edit,       setEdit]       = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [filterPos,  setFilterPos]  = useState('');
  const [customPos,  setCustomPos]  = useState('');

  const load = () => getAdminCandidates().then(r => setCandidates(r.data.data)).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const positions = [...new Set(candidates.map(c => c.position))].sort();
  const filtered  = filterPos ? candidates.filter(c => c.position === filterPos) : candidates;
  const grouped   = filtered.reduce((acc, c) => { if (!acc[c.position]) acc[c.position]=[]; acc[c.position].push(c); return acc; }, {});

  const openCreate = () => { setEdit(null); setForm(EMPTY); setCustomPos(''); setModal(true); };
  const openEdit   = (c) => { setEdit(c); setForm({ fullname:c.fullname, position:c.position, department:c.department||'', manifesto:c.manifesto||'', photo:c.photo||'' }); setModal(true); };
  const closeModal = () => { setModal(false); setEdit(null); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, position: form.position === 'custom' ? customPos : form.position };
    try {
      if (edit) { await updateCandidate(edit.id, payload); toast.success('Candidate updated'); }
      else       { await createCandidate(payload); toast.success('Candidate added'); }
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete ${c.fullname}?`)) return;
    try { await deleteCandidate(c.id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete — has votes'); }
  };

  return (
    <div style={s.root}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Candidates</h1>
          <p style={s.pageSub}>{candidates.length} candidates · {positions.length} positions</p>
        </div>
        <button onClick={openCreate} style={s.btnGreen}>+ Add Candidate</button>
      </div>

      {/* Position filter */}
      {positions.length > 0 && (
        <div style={s.filterRow}>
          <button onClick={() => setFilterPos('')} style={{ ...s.filterBtn, ...(filterPos===''?s.filterBtnActive:{}) }}>All</button>
          {positions.map(p => (
            <button key={p} onClick={() => setFilterPos(p)} style={{ ...s.filterBtn, ...(filterPos===p?s.filterBtnActive:{}) }}>{p}</button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={s.loadingRow}><div style={spinnerEl} /></div>
      ) : candidates.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize:48, opacity:0.15 }}>🎓</span>
          <p style={{ color:'#374151', fontSize:14 }}>No candidates added yet</p>
          <button onClick={openCreate} style={s.btnGreen}>Add First Candidate</button>
        </div>
      ) : (
        Object.entries(grouped).map(([position, positionCandidates]) => (
          <div key={position} style={s.positionGroup}>
            <div style={s.positionLabel}>
              <span style={s.positionDot} />
              {position}
              <span style={s.positionCount}>({positionCandidates.length})</span>
            </div>
            <div style={s.cardGrid}>
              {positionCandidates.map((c, ci) => {
                const color = COLORS[ci % COLORS.length];
                return (
                  <div key={c.id} style={s.candidateCard}>
                    {/* Photo / Avatar */}
                    <div style={{ ...s.cardPhoto, background:`${color}18`, borderBottom:`1px solid ${color}22` }}>
                      {c.photo ? (
                        <img src={c.photo} alt={c.fullname} style={s.cardPhotoImg} onError={e=>e.target.style.display='none'} />
                      ) : (
                        <span style={{ ...s.cardInitial, color }}>{c.fullname[0]}</span>
                      )}
                      {/* Edit / Delete overlay */}
                      <div style={s.cardOverlay}>
                        <button onClick={() => openEdit(c)} style={s.overlayBtn}>✏️</button>
                        <button onClick={() => handleDelete(c)} style={{ ...s.overlayBtn, ...s.overlayBtnRed }}>🗑</button>
                      </div>
                      {/* Vote count badge */}
                      <div style={s.voteBadge}>
                        <span style={{ color }}>{c.votes}</span> votes
                      </div>
                    </div>
                    {/* Info */}
                    <div style={s.cardBody}>
                      <div style={s.cardName}>{c.fullname}</div>
                      {c.department && <div style={s.cardDept}>{c.department}</div>}
                      {c.manifesto && <div style={s.cardManifesto}>{c.manifesto}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Modal */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.overlayBg} onClick={closeModal} />
          <div style={s.modalCard}>
            <div style={s.modalHead}>
              <span style={s.modalTitle}>{edit ? 'Edit Candidate' : 'Add Candidate'}</span>
              <button onClick={closeModal} style={s.modalClose}>✕</button>
            </div>
            <form onSubmit={handleSave} style={s.modalBody}>
              <div style={s.fieldGroup}>
                <label style={s.label}>Full Name *</label>
                <input required value={form.fullname} onChange={e=>setForm(p=>({...p,fullname:e.target.value}))} placeholder="e.g. Aminata Koroma" style={s.input} />
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Position *</label>
                <select required value={form.position} onChange={e=>setForm(p=>({...p,position:e.target.value}))} style={s.select}>
                  <option value="">Select position</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="custom">Custom position…</option>
                </select>
                {form.position === 'custom' && (
                  <input value={customPos} onChange={e=>setCustomPos(e.target.value)} placeholder="Enter custom position" style={{ ...s.input, marginTop:8 }} required />
                )}
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Department</label>
                <select value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))} style={s.select}>
                  <option value="">Select department (optional)</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Photo URL</label>
                <input type="url" value={form.photo} onChange={e=>setForm(p=>({...p,photo:e.target.value}))} placeholder="https://… (optional)" style={s.input} />
                {form.photo && <img src={form.photo} alt="preview" style={s.photoPreview} onError={e=>e.target.style.display='none'} />}
              </div>
              <div style={s.fieldGroup}>
                <label style={s.label}>Manifesto / Bio</label>
                <textarea value={form.manifesto} onChange={e=>setForm(p=>({...p,manifesto:e.target.value}))} rows={3} placeholder="Brief manifesto or bio (optional)" style={{ ...s.input, resize:'none' }} />
              </div>
              <div style={s.modalFooter}>
                <button type="button" onClick={closeModal} style={s.btnGhost}>Cancel</button>
                <button type="submit" disabled={saving} style={s.btnGreen}>
                  {saving ? <><span style={spinnerInline} /> Saving…</> : edit ? 'Save Changes' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus,select:focus,textarea:focus{border-color:rgba(34,197,94,0.5)!important;outline:none} input::placeholder,textarea::placeholder{color:#1F2937} .candidateCard:hover .cardOverlay{opacity:1!important}`}</style>
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
  btnGreen:   { padding:'10px 18px', background:'linear-gradient(135deg,#15803D,#16A34A)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  btnGhost:   { padding:'10px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  loadingRow: { display:'flex', justifyContent:'center', padding:60 },
  emptyState: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:80, background:'#0A1628', borderRadius:18, border:'1px solid rgba(255,255,255,0.05)' },

  filterRow: { display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' },
  filterBtn: { padding:'7px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', background:'transparent', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' },
  filterBtnActive: { background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', color:'#22C55E' },

  positionGroup: { marginBottom:36 },
  positionLabel: { display:'flex', alignItems:'center', gap:10, marginBottom:14, fontSize:14, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'1px' },
  positionDot:   { width:8, height:8, background:'#22C55E', borderRadius:'50%', flexShrink:0 },
  positionCount: { fontSize:12, fontWeight:500, color:'#374151', textTransform:'none', letterSpacing:0 },
  cardGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 },

  candidateCard: { background:'#0A1628', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, overflow:'hidden', transition:'border-color 0.2s, transform 0.2s', cursor:'default' },
  cardPhoto: { height:140, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' },
  cardPhotoImg: { width:'100%', height:'100%', objectFit:'cover' },
  cardInitial: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:52 },
  cardOverlay: { position:'absolute', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity:0, transition:'opacity 0.2s' },
  overlayBtn:    { padding:'8px 10px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, cursor:'pointer', fontSize:14 },
  overlayBtnRed: { background:'rgba(239,68,68,0.2)', border:'1px solid rgba(239,68,68,0.3)' },
  voteBadge: { position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.7)', borderRadius:8, padding:'3px 8px', fontSize:11, fontWeight:700, color:'#94A3B8' },
  cardBody: { padding:'14px 16px' },
  cardName: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, color:'#fff', marginBottom:3 },
  cardDept: { fontSize:11, color:'#374151', marginBottom:6 },
  cardManifesto: { fontSize:11, color:'#1F2937', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' },

  overlay:    { position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  overlayBg:  { position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' },
  modalCard:  { position:'relative', zIndex:51, background:'#0A1628', border:'1px solid rgba(255,255,255,0.09)', borderRadius:22, width:'100%', maxWidth:480, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.8)' },
  modalHead:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, background:'#0A1628', zIndex:5 },
  modalTitle: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18, color:'#fff' },
  modalClose: { background:'transparent', border:'none', color:'#374151', fontSize:18, cursor:'pointer' },
  modalBody:  { padding:'24px', display:'flex', flexDirection:'column', gap:16 },
  fieldGroup: { display:'flex', flexDirection:'column', gap:7 },
  label:      { fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'1px' },
  input:      { background:'#060D1F', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:13, fontFamily:'Inter,sans-serif', boxSizing:'border-box', width:'100%', transition:'border-color 0.2s' },
  select:     { background:'#060D1F', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:13, fontFamily:'Inter,sans-serif', width:'100%', cursor:'pointer', transition:'border-color 0.2s' },
  photoPreview: { width:60, height:60, objectFit:'cover', borderRadius:10, marginTop:8, border:'1px solid rgba(255,255,255,0.1)' },
  modalFooter:{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' },
};
