import React, { useEffect, useState, useRef } from 'react';
import { getAdminCandidates, deleteCandidate } from '../../utils/api';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const POSITIONS = ['President','Vice President','Secretary General','Assistant Secretary','Financial Secretary','Treasurer','Public Relations Officer','Social Secretary','Sports Secretary','Academic Secretary'];
const DEPTS     = ['Computer Science','Information Technology','Software Engineering','Information Systems','Electrical Engineering','Mathematics','Other'];
const COLORS    = ['#22C55E','#3B82F6','#A855F7','#F59E0B','#EF4444','#14B8A6','#F97316','#EC4899'];
const EMPTY     = { fullname:'', position:'', department:'', manifesto:'' };

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(false);
  const [edit,       setEdit]       = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [filterPos,  setFilterPos]  = useState('');
  const [customPos,  setCustomPos]  = useState('');

  // Image upload state
  const [photoFile,    setPhotoFile]    = useState(null);   // File object
  const [photoPreview, setPhotoPreview] = useState(null);   // Data URL for preview
  const fileInputRef = useRef(null);

  const load = () =>
    getAdminCandidates()
      .then(r => setCandidates(r.data.data))
      .catch(() => toast.error('Failed to load candidates'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const positions = [...new Set(candidates.map(c => c.position))].sort();
  const filtered  = filterPos ? candidates.filter(c => c.position === filterPos) : candidates;
  const grouped   = filtered.reduce((acc, c) => {
    if (!acc[c.position]) acc[c.position] = [];
    acc[c.position].push(c);
    return acc;
  }, {});

  const openCreate = () => {
    setEdit(null);
    setForm(EMPTY);
    setPhotoFile(null);
    setPhotoPreview(null);
    setCustomPos('');
    setModal(true);
  };

  const openEdit = (c) => {
    setEdit(c);
    setForm({ fullname:c.fullname, position:c.position, department:c.department||'', manifesto:c.manifesto||'' });
    setPhotoFile(null);
    setPhotoPreview(c.photo || null); // show existing photo
    setCustomPos('');
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEdit(null); setPhotoFile(null); setPhotoPreview(null); };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) { toast.error('Please drop an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit — use FormData for multipart upload
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const finalPosition = form.position === 'custom' ? customPos : form.position;
    if (!finalPosition) { toast.error('Please select a position'); setSaving(false); return; }

    try {
      const fd = new FormData();
      fd.append('fullname',   form.fullname);
      fd.append('position',   finalPosition);
      fd.append('department', form.department || '');
      fd.append('manifesto',  form.manifesto  || '');
      if (photoFile) fd.append('photo', photoFile);

      if (edit) {
        await API.put(`/admin/candidates/${edit.id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Candidate updated');
      } else {
        await API.post('/admin/candidates', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Candidate added');
      }

      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save candidate');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete ${c.fullname}?`)) return;
    try { await deleteCandidate(c.id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete — candidate has votes'); }
  };

  return (
    <div style={s.root}>
      {/* Page header */}
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
        <div style={s.loadingRow}><div style={spinEl} /></div>
      ) : candidates.length === 0 ? (
        <div style={s.emptyState}>
          <span style={{ fontSize:52, opacity:0.12 }}>🎓</span>
          <p style={{ color:'#374151', fontSize:14, margin:0 }}>No candidates yet</p>
          <button onClick={openCreate} style={s.btnGreen}>Add First Candidate</button>
        </div>
      ) : (
        Object.entries(grouped).map(([position, positionCandidates]) => (
          <div key={position} style={s.posGroup}>
            <div style={s.posLabel}>
              <span style={s.posDot} />
              {position}
              <span style={s.posCount}>({positionCandidates.length})</span>
            </div>
            <div style={s.cardGrid}>
              {positionCandidates.map((c, ci) => {
                const color = COLORS[ci % COLORS.length];
                return (
                  <div key={c.id} style={s.card}
                    onMouseEnter={e => { e.currentTarget.querySelector('.card-overlay').style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.querySelector('.card-overlay').style.opacity = '0'; }}
                  >
                    {/* Photo */}
                    <div style={{ ...s.cardPhoto, background:`${color}18` }}>
                      {c.photo ? (
                        <img src={c.photo} alt={c.fullname} style={s.cardPhotoImg}
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                        />
                      ) : null}
                      <div style={{ ...s.cardInitialWrap, display: c.photo ? 'none' : 'flex' }}>
                        <span style={{ ...s.cardInitial, color }}>{c.fullname[0]}</span>
                      </div>

                      {/* Hover overlay */}
                      <div className="card-overlay" style={s.cardOverlay}>
                        <button onClick={() => openEdit(c)} style={s.oBtn}>✏️ Edit</button>
                        <button onClick={() => handleDelete(c)} style={{ ...s.oBtn, ...s.oBtnRed }}>🗑 Delete</button>
                      </div>

                      {/* Vote badge */}
                      <div style={s.voteBadge}>
                        <span style={{ color, fontWeight:800 }}>{c.votes}</span>
                        <span style={{ color:'#4B5563' }}> votes</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div style={s.cardBody}>
                      <div style={s.cardName}>{c.fullname}</div>
                      {c.department && <div style={s.cardDept}>{c.department}</div>}
                      {c.manifesto  && <div style={s.cardManifesto}>{c.manifesto}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* ── MODAL ── */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.overlayBg} onClick={closeModal} />
          <div style={s.modal}>
            <div style={s.modalHead}>
              <span style={s.modalTitle}>{edit ? 'Edit Candidate' : 'Add Candidate'}</span>
              <button onClick={closeModal} style={s.modalClose}>✕</button>
            </div>

            <form onSubmit={handleSave} style={s.modalBody}>

              {/* ── PHOTO UPLOAD ── */}
              <div style={s.fieldGroup}>
                <label style={s.label}>Candidate Photo</label>

                {photoPreview ? (
                  /* Preview */
                  <div style={s.previewWrap}>
                    <img src={photoPreview} alt="preview" style={s.previewImg} />
                    <div style={s.previewInfo}>
                      <div style={s.previewName}>
                        {photoFile ? photoFile.name : 'Current photo'}
                      </div>
                      {photoFile && (
                        <div style={s.previewSize}>
                          {(photoFile.size / 1024).toFixed(0)} KB
                        </div>
                      )}
                      <div style={s.previewActions}>
                        <button type="button" onClick={() => fileInputRef.current?.click()} style={s.previewChangeBtn}>
                          Change Photo
                        </button>
                        <button type="button" onClick={removePhoto} style={s.previewRemoveBtn}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drop zone */
                  <div
                    style={s.dropZone}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
                    onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onDrop={handleDrop}
                  >
                    <div style={s.dropIcon}>📸</div>
                    <div style={s.dropTitle}>Click to upload or drag & drop</div>
                    <div style={s.dropSub}>JPG, PNG, WEBP · Max 5MB</div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display:'none' }}
                />
              </div>

              {/* Name */}
              <div style={s.fieldGroup}>
                <label style={s.label}>Full Name *</label>
                <input
                  required value={form.fullname}
                  onChange={e => setForm(p => ({ ...p, fullname:e.target.value }))}
                  placeholder="e.g. Aminata Koroma"
                  style={s.input}
                />
              </div>

              {/* Position */}
              <div style={s.fieldGroup}>
                <label style={s.label}>Position *</label>
                <select
                  required value={form.position}
                  onChange={e => setForm(p => ({ ...p, position:e.target.value }))}
                  style={s.select}
                >
                  <option value="">Select position</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="custom">Custom position…</option>
                </select>
                {form.position === 'custom' && (
                  <input
                    value={customPos}
                    onChange={e => setCustomPos(e.target.value)}
                    placeholder="Enter custom position"
                    required
                    style={{ ...s.input, marginTop:8 }}
                  />
                )}
              </div>

              {/* Department */}
              <div style={s.fieldGroup}>
                <label style={s.label}>Department</label>
                <select
                  value={form.department}
                  onChange={e => setForm(p => ({ ...p, department:e.target.value }))}
                  style={s.select}
                >
                  <option value="">Select department (optional)</option>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Manifesto */}
              <div style={s.fieldGroup}>
                <label style={s.label}>Manifesto / Bio</label>
                <textarea
                  value={form.manifesto}
                  onChange={e => setForm(p => ({ ...p, manifesto:e.target.value }))}
                  rows={3}
                  placeholder="Brief manifesto or bio (optional)"
                  style={{ ...s.input, resize:'none' }}
                />
              </div>

              {/* Footer */}
              <div style={s.modalFooter}>
                <button type="button" onClick={closeModal} style={s.btnGhost}>Cancel</button>
                <button type="submit" disabled={saving} style={s.btnGreen}>
                  {saving
                    ? <><span style={spinInline} /> {edit ? 'Saving…' : 'Adding…'}</>
                    : edit ? 'Save Changes' : 'Add Candidate'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus { border-color: rgba(34,197,94,0.5) !important; outline: none; }
        input::placeholder, textarea::placeholder { color: #1F2937; }
      `}</style>
    </div>
  );
}

const spinEl     = { width:32, height:32, border:'3px solid rgba(34,197,94,0.2)', borderTopColor:'#22C55E', borderRadius:'50%', animation:'spin 0.8s linear infinite' };
const spinInline = { display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' };

const s = {
  root:      { color:'#fff', fontFamily:'Inter,sans-serif' },
  pageHeader:{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 },
  pageTitle: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:28, color:'#fff', margin:0 },
  pageSub:   { fontSize:13, color:'#374151', marginTop:4 },
  btnGreen:  { padding:'10px 18px', background:'linear-gradient(135deg,#15803D,#16A34A)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:6 },
  btnGhost:  { padding:'10px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  loadingRow:{ display:'flex', justifyContent:'center', padding:60 },
  emptyState:{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:80, background:'#0A1628', borderRadius:18, border:'1px solid rgba(255,255,255,0.05)' },

  filterRow:    { display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' },
  filterBtn:    { padding:'7px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)', background:'transparent', color:'#374151', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' },
  filterBtnActive:{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', color:'#22C55E' },

  posGroup:  { marginBottom:36 },
  posLabel:  { display:'flex', alignItems:'center', gap:10, marginBottom:14, fontSize:13, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'1px' },
  posDot:    { width:8, height:8, background:'#22C55E', borderRadius:'50%', flexShrink:0 },
  posCount:  { fontSize:12, fontWeight:500, color:'#1F2937', textTransform:'none', letterSpacing:0 },
  cardGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 },

  card:        { background:'#0A1628', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, overflow:'hidden', transition:'transform 0.2s, border-color 0.2s', cursor:'default' },
  cardPhoto:   { height:160, display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' },
  cardPhotoImg:{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center top' },
  cardInitialWrap:{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' },
  cardInitial: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:900, fontSize:56 },
  cardOverlay: { position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, opacity:0, transition:'opacity 0.2s' },
  oBtn:        { padding:'8px 18px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:8, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', width:120 },
  oBtnRed:     { background:'rgba(239,68,68,0.25)', border:'1px solid rgba(239,68,68,0.4)' },
  voteBadge:   { position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.75)', borderRadius:8, padding:'3px 9px', fontSize:11, backdropFilter:'blur(4px)' },
  cardBody:    { padding:'14px 16px' },
  cardName:    { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:15, color:'#fff', marginBottom:3 },
  cardDept:    { fontSize:11, color:'#374151', marginBottom:6 },
  cardManifesto:{ fontSize:11, color:'#1F2937', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' },

  // Modal
  overlay:   { position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  overlayBg: { position:'absolute', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(8px)' },
  modal:     { position:'relative', zIndex:51, background:'#0A1628', border:'1px solid rgba(255,255,255,0.09)', borderRadius:22, width:'100%', maxWidth:500, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.9)' },
  modalHead: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', position:'sticky', top:0, background:'#0A1628', zIndex:5 },
  modalTitle:{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18, color:'#fff' },
  modalClose:{ background:'transparent', border:'none', color:'#374151', fontSize:18, cursor:'pointer' },
  modalBody: { padding:'24px', display:'flex', flexDirection:'column', gap:18 },
  modalFooter:{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' },

  fieldGroup:{ display:'flex', flexDirection:'column', gap:7 },
  label:     { fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'1px' },
  input:     { background:'#060D1F', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:13, fontFamily:'Inter,sans-serif', boxSizing:'border-box', width:'100%', transition:'border-color 0.2s' },
  select:    { background:'#060D1F', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:13, fontFamily:'Inter,sans-serif', width:'100%', cursor:'pointer', transition:'border-color 0.2s' },

  // Drop zone
  dropZone:  { border:'2px dashed rgba(255,255,255,0.1)', borderRadius:14, padding:'32px 20px', textAlign:'center', cursor:'pointer', background:'rgba(255,255,255,0.02)', transition:'all 0.2s' },
  dropIcon:  { fontSize:36, marginBottom:10 },
  dropTitle: { fontSize:14, fontWeight:600, color:'#64748B', marginBottom:4 },
  dropSub:   { fontSize:12, color:'#1F2937' },

  // Preview
  previewWrap:   { display:'flex', alignItems:'center', gap:16, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'14px 16px' },
  previewImg:    { width:80, height:80, objectFit:'cover', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', flexShrink:0 },
  previewInfo:   { flex:1, minWidth:0 },
  previewName:   { fontSize:13, fontWeight:600, color:'#fff', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  previewSize:   { fontSize:11, color:'#374151', marginBottom:10 },
  previewActions:{ display:'flex', gap:8 },
  previewChangeBtn:{ padding:'6px 12px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:8, color:'#3B82F6', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  previewRemoveBtn:{ padding:'6px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, color:'#EF4444', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' },
};
