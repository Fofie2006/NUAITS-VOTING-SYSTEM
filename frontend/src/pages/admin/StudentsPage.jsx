import React, { useEffect, useState } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent, resendStudentEmail } from '../../utils/api';
import toast from 'react-hot-toast';

const DEPTS  = ['Computer Science','Information Technology','Software Engineering','Information Systems','Electrical Engineering','Mathematics','Other'];
const LEVELS = ['100 Level','200 Level','300 Level','400 Level','500 Level','Postgraduate'];
const EMPTY  = { fullname:'', student_id:'', email:'', department:'', level:'' };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [edit,     setEdit]     = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  const load = () => getStudents().then(r => setStudents(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = students.filter(s =>
    [s.fullname, s.student_id, s.email, s.department].some(v => v.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => { setEdit(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (s) => { setEdit(s); setForm({ fullname:s.fullname, student_id:s.student_id, email:s.email, department:s.department, level:s.level }); setModal(true); };
  const closeModal = () => { setModal(false); setEdit(null); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (edit) { await updateStudent(edit.id, form); toast.success('Student updated'); }
      else       { await createStudent(form); toast.success('Student registered — email sent'); }
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete ${s.fullname}?`)) return;
    try { await deleteStudent(s.id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  const handleResend = async (s) => {
    try { await resendStudentEmail(s.id); toast.success('Email resent'); }
    catch { toast.error('Failed to resend'); }
  };

  const exportCSV = () => {
    const rows = [['Name','Student ID','Email','Department','Level','Voting Code','Voted','Email Sent']];
    students.forEach(s => rows.push([s.fullname,s.student_id,s.email,s.department,s.level,s.voting_code,s.code_used?'Yes':'No',s.email_sent?'Yes':'No']));
    const blob = new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='nuaits_students.csv'; a.click();
  };

  const voted = students.filter(s=>s.code_used).length;

  return (
    <div style={s.root}>
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Students</h1>
          <p style={s.pageSub}>{students.length} registered · {voted} voted · {students.length - voted} pending</p>
        </div>
        <div style={s.headerBtns}>
          <button onClick={exportCSV} style={s.btnGhost}>⬇ Export CSV</button>
          <button onClick={openCreate} style={s.btnGreen}>+ Add Student</button>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <span style={s.searchIcon}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, ID, email, department…"
          style={s.searchInput}
        />
        {search && <button onClick={() => setSearch('')} style={s.clearBtn}>✕</button>}
      </div>

      {/* Stats pills */}
      <div style={s.statsPills}>
        {[
          { label:'Total',   value:students.length,              color:'#3B82F6' },
          { label:'Voted',   value:voted,                        color:'#22C55E' },
          { label:'Pending', value:students.length - voted,       color:'#F59E0B' },
          { label:'Email Sent', value:students.filter(s=>s.email_sent).length, color:'#A855F7' },
        ].map(p => (
          <div key={p.label} style={s.statPill}>
            <span style={{ ...s.statPillVal, color:p.color }}>{p.value}</span>
            <span style={s.statPillLabel}>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        {loading ? (
          <div style={s.loadingRow}><div style={spinnerEl} /></div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyRow}>
            <span style={{ fontSize:40, opacity:0.2 }}>👥</span>
            <p style={{ color:'#374151', fontSize:14 }}>{search ? 'No matches found' : 'No students registered yet'}</p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Student','ID','Department','Level','Voting Code','Status','Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(st => (
                  <tr key={st.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.studentName}>{st.fullname}</div>
                      <div style={s.studentEmail}>{st.email}</div>
                    </td>
                    <td style={s.td}><span style={s.mono}>{st.student_id}</span></td>
                    <td style={s.td}><span style={s.dept}>{st.department}</span></td>
                    <td style={s.td}><span style={s.level}>{st.level}</span></td>
                    <td style={s.td}><span style={s.code}>{st.voting_code}</span></td>
                    <td style={s.td}>
                      <div style={s.statusCol}>
                        <span style={{ ...s.badge, background:st.code_used?'rgba(34,197,94,0.1)':'rgba(255,255,255,0.04)', color:st.code_used?'#22C55E':'#4B5563', border:`1px solid ${st.code_used?'rgba(34,197,94,0.2)':'rgba(255,255,255,0.06)'}` }}>
                          {st.code_used ? '✓ Voted' : '○ Pending'}
                        </span>
                        <span style={{ ...s.badge, background:st.email_sent?'rgba(59,130,246,0.1)':'rgba(245,158,11,0.1)', color:st.email_sent?'#3B82F6':'#F59E0B', border:`1px solid ${st.email_sent?'rgba(59,130,246,0.2)':'rgba(245,158,11,0.2)'}` }}>
                          {st.email_sent ? '📧 Sent' : '⏳ Unsent'}
                        </span>
                      </div>
                    </td>
                    <td style={s.td}>
                      <div style={s.actions}>
                        <button onClick={() => openEdit(st)} style={s.iconBtn} title="Edit">✏️</button>
                        <button onClick={() => handleResend(st)} style={s.iconBtn} title="Resend Email">📧</button>
                        {!st.code_used && (
                          <button onClick={() => handleDelete(st)} style={s.iconBtnRed} title="Delete">🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={s.overlay}>
          <div style={s.overlayBg} onClick={closeModal} />
          <div style={s.modalCard}>
            <div style={s.modalHead}>
              <span style={s.modalTitle}>{edit ? 'Edit Student' : 'Add New Student'}</span>
              <button onClick={closeModal} style={s.modalClose}>✕</button>
            </div>
            <form onSubmit={handleSave} style={s.modalBody}>
              <div style={s.formGrid}>
                <div style={{ ...s.fieldGroup, gridColumn:'1/-1' }}>
                  <label style={s.label}>Full Name *</label>
                  <input required value={form.fullname} onChange={e=>setForm(p=>({...p,fullname:e.target.value}))} placeholder="e.g. Foday Sheriff" style={s.input} />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Student ID *</label>
                  <input required value={form.student_id} onChange={e=>setForm(p=>({...p,student_id:e.target.value}))} disabled={!!edit} placeholder="CS/2021/001" style={{ ...s.input, ...(edit?s.inputDisabled:{}) }} />
                </div>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Level *</label>
                  <select required value={form.level} onChange={e=>setForm(p=>({...p,level:e.target.value}))} style={s.select}>
                    <option value="">Select level</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div style={{ ...s.fieldGroup, gridColumn:'1/-1' }}>
                  <label style={s.label}>Email Address *</label>
                  <input required type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="student@njala.edu.sl" style={s.input} />
                </div>
                <div style={{ ...s.fieldGroup, gridColumn:'1/-1' }}>
                  <label style={s.label}>Department *</label>
                  <select required value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))} style={s.select}>
                    <option value="">Select department</option>
                    {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              {!edit && (
                <div style={s.infoBox}>
                  📧 A unique voting code will be auto-generated and emailed to the student.
                </div>
              )}
              <div style={s.modalFooter}>
                <button type="button" onClick={closeModal} style={s.btnGhost}>Cancel</button>
                <button type="submit" disabled={saving} style={s.btnGreen}>
                  {saving ? <><span style={spinnerInline} /> Saving…</> : edit ? 'Save Changes' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus,select:focus{border-color:rgba(34,197,94,0.5)!important;outline:none} input::placeholder{color:#1F2937} tr:hover td{background:rgba(255,255,255,0.02)!important}`}</style>
    </div>
  );
}

const spinnerEl  = { width:32, height:32, border:'3px solid rgba(34,197,94,0.2)', borderTopColor:'#22C55E', borderRadius:'50%', animation:'spin 0.8s linear infinite' };
const spinnerInline = { display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' };

const s = {
  root: { color:'#fff', fontFamily:'Inter,sans-serif' },
  pageHeader: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 },
  pageTitle:  { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:28, color:'#fff', margin:0 },
  pageSub:    { fontSize:13, color:'#374151', marginTop:4 },
  headerBtns: { display:'flex', gap:10 },
  btnGreen: { padding:'10px 18px', background:'linear-gradient(135deg,#15803D,#16A34A)', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' },
  btnGhost: { padding:'10px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#64748B', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Inter,sans-serif' },

  searchWrap:  { position:'relative', marginBottom:16 },
  searchIcon:  { position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:14 },
  searchInput: { width:'100%', padding:'12px 14px 12px 40px', background:'#0A1628', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, color:'#fff', fontSize:14, fontFamily:'Inter,sans-serif', boxSizing:'border-box', transition:'border-color 0.2s' },
  clearBtn:    { position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'#374151', fontSize:14, cursor:'pointer' },

  statsPills: { display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' },
  statPill:   { display:'flex', alignItems:'center', gap:8, background:'#0A1628', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'8px 14px' },
  statPillVal: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, fontSize:18 },
  statPillLabel: { fontSize:11, fontWeight:600, color:'#374151', textTransform:'uppercase', letterSpacing:'0.5px' },

  tableWrap: { background:'#0A1628', border:'1px solid rgba(255,255,255,0.06)', borderRadius:18, overflow:'hidden' },
  loadingRow:{ display:'flex', justifyContent:'center', padding:60 },
  emptyRow:  { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, padding:60 },
  table:     { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:        { padding:'13px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.8px', background:'rgba(255,255,255,0.02)', borderBottom:'1px solid rgba(255,255,255,0.05)', whiteSpace:'nowrap' },
  tr:        { borderBottom:'1px solid rgba(255,255,255,0.03)' },
  td:        { padding:'13px 16px', verticalAlign:'middle', transition:'background 0.15s' },

  studentName:  { fontWeight:600, color:'#fff', fontSize:13 },
  studentEmail: { fontSize:11, color:'#374151', marginTop:2 },
  mono:  { fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#3B82F6' },
  dept:  { fontSize:12, color:'#64748B' },
  level: { fontSize:12, color:'#64748B' },
  code:  { fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'#374151', letterSpacing:'1px' },

  statusCol: { display:'flex', flexDirection:'column', gap:4 },
  badge: { display:'inline-block', padding:'3px 8px', borderRadius:6, fontSize:10, fontWeight:700 },

  actions:    { display:'flex', gap:4 },
  iconBtn:    { padding:'6px 8px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, cursor:'pointer', fontSize:13, transition:'background 0.15s' },
  iconBtnRed: { padding:'6px 8px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:8, cursor:'pointer', fontSize:13 },

  overlay:    { position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  overlayBg:  { position:'absolute', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)' },
  modalCard:  { position:'relative', zIndex:51, background:'#0A1628', border:'1px solid rgba(255,255,255,0.09)', borderRadius:22, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 32px 80px rgba(0,0,0,0.8)' },
  modalHead:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)' },
  modalTitle: { fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:18, color:'#fff' },
  modalClose: { background:'transparent', border:'none', color:'#374151', fontSize:18, cursor:'pointer' },
  modalBody:  { padding:'24px' },
  formGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 },
  fieldGroup: { display:'flex', flexDirection:'column', gap:7 },
  label:      { fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'1px' },
  input:      { background:'#060D1F', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:13, fontFamily:'Inter,sans-serif', boxSizing:'border-box', transition:'border-color 0.2s' },
  inputDisabled: { opacity:0.4, cursor:'not-allowed' },
  select:     { background:'#060D1F', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:13, fontFamily:'Inter,sans-serif', cursor:'pointer', transition:'border-color 0.2s' },
  infoBox:    { background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:10, padding:'12px 14px', fontSize:12, color:'#60A5FA', marginBottom:20 },
  modalFooter:{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' },
};
