import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateVoteCredentials, submitVotes } from '../utils/api';
import toast from 'react-hot-toast';

const STEPS = { CREDS: 1, BALLOT: 2, DONE: 3 };

export default function VotePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.CREDS);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ student_id: '', voting_code: '' });
  const [session, setSession] = useState(null);
  const [selections, setSelections] = useState({});
  const [error, setError] = useState('');

  const byPosition = (candidates) => candidates.reduce((acc, c) => {
    if (!acc[c.position]) acc[c.position] = [];
    acc[c.position].push(c);
    return acc;
  }, {});

  /* ─ Step 1: validate ─ */
  const handleValidate = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await validateVoteCredentials({
        student_id: form.student_id.trim(),
        voting_code: form.voting_code.trim(),
      });
      if (data.success) {
        setSession(data.data);
        setStep(STEPS.BALLOT);
        toast.success(`Welcome, ${data.data.student.name}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please check and try again.');
    } finally { setLoading(false); }
  };

  /* ─ Step 2: submit ─ */
  const handleSubmit = async () => {
    const positions = Object.keys(byPosition(session.candidates));
    const missing = positions.filter(p => !selections[p]);
    if (missing.length) { toast.error(`Please select a candidate for: ${missing[0]}`); return; }
    if (!window.confirm('Submit your votes? This cannot be undone.')) return;
    setLoading(true);
    try {
      const votes = Object.entries(selections).map(([position, candidate_id]) => ({ position, candidate_id }));
      const { data } = await submitVotes({
        student_id: form.student_id, voting_code: form.voting_code,
        election_id: session.election.id, votes,
      });
      if (data.success) { setStep(STEPS.DONE); toast.success('Votes recorded!'); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Try again.');
    } finally { setLoading(false); }
  };

  /* ══════════════════════════════════════════ STEP 1 */
  if (step === STEPS.CREDS) return (
    <div style={s.root}>
      <div style={s.dotGrid} />
      <div style={s.glowTL} />

      <button onClick={() => navigate('/')} style={s.backBtn}>← Back</button>

      <div style={s.credWrap}>
        {/* Card header */}
        <div style={s.cardHead}>
          <div style={s.cardHeadShield}>🛡</div>
          <div style={s.cardHeadTitle}>NUAITS Elections 2026/2027</div>
          <div style={s.cardHeadSub}>Enter your credentials to access the ballot</div>
        </div>

        {/* Error */}
        {error && (
          <div style={s.errorBox}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleValidate} style={s.credForm}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Student ID</label>
            <input
              type="text" required autoFocus
              value={form.student_id}
              onChange={e => setForm(p => ({ ...p, student_id: e.target.value }))}
              placeholder="e.g.  CS / 2021 / 001"
              style={s.input}
            />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Voting Code</label>
            <input
              type="text" required
              value={form.voting_code}
              onChange={e => setForm(p => ({ ...p, voting_code: e.target.value.toUpperCase() }))}
              placeholder="XXXX-XXXX-XXXX"
              maxLength={14}
              style={{ ...s.input, ...s.inputCode }}
            />
            <span style={s.inputHint}>Sent to your student email by NUAITS</span>
          </div>
          <button type="submit" disabled={loading} style={s.submitBtn}>
            {loading
              ? <><span style={s.spinner} /> Verifying…</>
              : 'Verify & Open Ballot →'}
          </button>
        </form>

        <div style={s.secureRow}>
          <span>🔒</span>
          <span style={{ color: '#374151', fontSize: 12 }}>Encrypted · Single-use code · No account required</span>
        </div>
      </div>

      <style>{anims}</style>
    </div>
  );

  /* ══════════════════════════════════════════ STEP 2 */
  if (step === STEPS.BALLOT) {
    const grouped = byPosition(session.candidates);
    const positions = Object.keys(grouped);
    const voted = Object.keys(selections).length;
    const pct = positions.length > 0 ? (voted / positions.length) * 100 : 0;

    return (
      <div style={s.root}>
        <div style={s.dotGrid} />

        {/* Sticky top */}
        <div style={s.ballotTop}>
          <div>
            <div style={s.ballotStudentName}>{session.student.name}</div>
            <div style={s.ballotStudentSub}>{session.student.student_id} · {session.student.department}</div>
          </div>
          <div style={s.ballotProgress}>
            <div style={{ ...s.ballotProgressBar, width: `${pct}%` }} />
            <span style={s.ballotProgressLabel}>{voted} / {positions.length} positions</span>
          </div>
        </div>

        {/* Ballot */}
        <div style={s.ballotBody}>
          <div style={s.ballotElectionTitle}>{session.election.title}</div>
          <div style={s.ballotInstruction}>Select one candidate per position. All positions required before submission.</div>

          {positions.map((position, pi) => (
            <div key={position} style={{ ...s.positionBlock, animationDelay: `${pi * 0.06}s` }}>
              <div style={s.positionHeader}>
                <span style={s.positionName}>{position}</span>
                {selections[position] && <span style={s.selectedTag}>✓ Selected</span>}
              </div>
              <div style={s.candidateGrid}>
                {grouped[position].map(c => {
                  const chosen = selections[position] === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelections(p => ({ ...p, [position]: c.id }))}
                      style={{
                        ...s.candidateCard,
                        ...(chosen ? s.candidateCardChosen : {}),
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        ...s.avatar,
                        background: chosen ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                        border: chosen ? '2px solid #22C55E' : '2px solid rgba(255,255,255,0.06)',
                      }}>
                        {c.photo
                          ? <img src={c.photo} alt={c.fullname} style={s.avatarImg} />
                          : <span style={{ ...s.avatarInitial, color: chosen ? '#22C55E' : '#4B5563' }}>{c.fullname[0]}</span>
                        }
                      </div>
                      <div style={s.candidateInfo}>
                        <div style={{ ...s.candidateName, color: chosen ? '#22C55E' : '#fff' }}>{c.fullname}</div>
                        {c.department && <div style={s.candidateDept}>{c.department}</div>}
                        {c.manifesto && <div style={s.candidateManifesto}>{c.manifesto}</div>}
                      </div>
                      {chosen && <span style={s.checkmark}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit */}
          <div style={s.submitRow}>
            <button
              onClick={handleSubmit}
              disabled={loading || voted < positions.length}
              style={{
                ...s.bigSubmitBtn,
                ...(voted < positions.length || loading ? s.bigSubmitBtnDisabled : {}),
              }}
            >
              {loading
                ? <><span style={s.spinner} /> Submitting…</>
                : voted < positions.length
                  ? `Complete ${positions.length - voted} more position${positions.length - voted !== 1 ? 's' : ''} to submit`
                  : '✓ Submit All Votes'}
            </button>
          </div>
        </div>

        <style>{anims}</style>
      </div>
    );
  }

  /* ══════════════════════════════════════════ STEP 3 */
  return (
    <div style={{ ...s.root, alignItems: 'center', justifyContent: 'center' }}>
      <div style={s.dotGrid} />
      <div style={s.successBox}>
        <div style={s.successIcon}>✅</div>
        <div style={s.successTitle}>Vote Submitted</div>
        <div style={s.successSub}>Thank you, {session?.student?.name}.</div>
        <p style={s.successBody}>
          Your votes are securely recorded. Your voting code is now permanently deactivated.
          Results will be announced when the election closes.
        </p>
        <div style={s.successActions}>
          <button onClick={() => navigate('/results')} style={s.successBtnPrimary}>
            📺 Watch Live Results
          </button>
          <button onClick={() => navigate('/')} style={s.successBtnSecondary}>
            Back to Home
          </button>
        </div>
      </div>
      <style>{anims}</style>
    </div>
  );
}

const anims = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@600&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes posIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
`;

const s = {
  root: {
    minHeight: '100vh', background: '#060D1F',
    display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden',
    fontFamily: 'Inter, sans-serif', color: '#fff',
  },
  dotGrid: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
  },
  glowTL: {
    position: 'absolute', top: -100, left: -100, width: 500, height: 500,
    borderRadius: '50%', pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
  },
  backBtn: {
    position: 'absolute', top: 20, left: 24, zIndex: 20,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
    color: '#4B5563', fontSize: 13, fontWeight: 600, padding: '8px 16px',
    borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },

  /* ── Credentials card ── */
  credWrap: {
    margin: 'auto', width: '100%', maxWidth: 440,
    background: '#0A1628', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 24, overflow: 'hidden',
    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
    animation: 'fadeUp 0.4s ease both',
    position: 'relative', zIndex: 10,
  },
  cardHead: {
    background: 'linear-gradient(135deg, #0F1E38 0%, #1A3A6E 100%)',
    padding: '32px 32px 28px', textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  cardHeadShield: {
    fontSize: 36, display: 'block', marginBottom: 12,
  },
  cardHeadTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 6,
  },
  cardHeadSub: { fontSize: 13, color: '#4B5563' },
  errorBox: {
    margin: '20px 28px 0',
    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 12, padding: '12px 16px',
    display: 'flex', alignItems: 'flex-start', gap: 10,
    fontSize: 13, color: '#FCA5A5',
  },
  credForm: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px' },
  input: {
    background: '#060D1F', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 12, padding: '14px 16px',
    color: '#fff', fontSize: 14, outline: 'none',
    fontFamily: 'Inter, sans-serif', transition: 'border-color 0.2s',
    width: '100%', boxSizing: 'border-box',
  },
  inputCode: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 20, letterSpacing: '4px', fontWeight: 600,
  },
  inputHint: { fontSize: 11, color: '#374151' },
  submitBtn: {
    background: 'linear-gradient(135deg, #15803D, #16A34A)',
    border: 'none', borderRadius: 12, padding: '15px',
    color: '#fff', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 4px 20px rgba(22,163,74,0.3)',
    transition: 'opacity 0.2s',
  },
  secureRow: {
    padding: '0 32px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },

  /* ── Ballot ── */
  ballotTop: {
    position: 'sticky', top: 0, zIndex: 30,
    background: 'rgba(6,13,31,0.95)', backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '14px 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
  },
  ballotStudentName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700, fontSize: 16, color: '#fff',
  },
  ballotStudentSub: { fontSize: 12, color: '#374151', marginTop: 2 },
  ballotProgress: {
    flex: 1, maxWidth: 200,
    background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 6,
    position: 'relative', overflow: 'hidden',
  },
  ballotProgressBar: {
    height: '100%', background: '#22C55E', borderRadius: 99,
    transition: 'width 0.5s ease',
  },
  ballotProgressLabel: {
    position: 'absolute', top: 10, left: 0,
    fontSize: 11, color: '#4B5563', whiteSpace: 'nowrap',
  },
  ballotBody: { padding: '32px 24px 60px', maxWidth: 760, margin: '0 auto', width: '100%' },
  ballotElectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 6,
  },
  ballotInstruction: { fontSize: 13, color: '#374151', marginBottom: 36 },
  positionBlock: {
    marginBottom: 40,
    animation: 'posIn 0.4s ease both',
  },
  positionHeader: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
    paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  positionName: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700, fontSize: 17, color: '#fff',
  },
  selectedTag: {
    fontSize: 11, fontWeight: 700, padding: '3px 10px',
    background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 20, color: '#22C55E',
  },
  candidateGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12,
  },
  candidateCard: {
    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px',
    background: '#0A1628', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16, cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
    fontFamily: 'Inter, sans-serif',
  },
  candidateCardChosen: {
    background: 'rgba(34,197,94,0.05)',
    border: '1px solid rgba(34,197,94,0.35)',
    boxShadow: '0 4px 20px rgba(34,197,94,0.1)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', transition: 'all 0.2s',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarInitial: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 22, transition: 'color 0.2s',
  },
  candidateInfo: { flex: 1, minWidth: 0 },
  candidateName: { fontWeight: 700, fontSize: 15, lineHeight: 1.2, transition: 'color 0.2s' },
  candidateDept: { fontSize: 11, color: '#374151', marginTop: 3 },
  candidateManifesto: {
    fontSize: 11, color: '#1F2937', marginTop: 6, lineHeight: 1.5,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  },
  checkmark: {
    position: 'absolute', top: 12, right: 14,
    color: '#22C55E', fontSize: 16, fontWeight: 700,
  },
  submitRow: { marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' },
  bigSubmitBtn: {
    width: '100%', padding: '16px',
    background: 'linear-gradient(135deg, #15803D, #16A34A)',
    border: 'none', borderRadius: 14, color: '#fff',
    fontSize: 16, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 8px 32px rgba(22,163,74,0.3)',
    transition: 'all 0.2s',
  },
  bigSubmitBtnDisabled: {
    background: '#0F1E38', boxShadow: 'none', cursor: 'not-allowed',
    color: '#374151',
  },

  /* ── Success ── */
  successBox: {
    textAlign: 'center', maxWidth: 420, padding: 40,
    background: '#0A1628', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 24, position: 'relative', zIndex: 10,
    animation: 'fadeUp 0.5s ease both',
  },
  successIcon: { fontSize: 64, marginBottom: 20, display: 'block' },
  successTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 800, fontSize: 32, color: '#fff', marginBottom: 8,
  },
  successSub: { fontSize: 16, color: '#22C55E', fontWeight: 600, marginBottom: 16 },
  successBody: { fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 28 },
  successActions: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
  successBtnPrimary: {
    padding: '12px 24px', background: '#1D4ED8', border: 'none',
    borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },
  successBtnSecondary: {
    padding: '12px 24px', background: 'transparent',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, color: '#4B5563', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  },

  /* Shared */
  spinner: {
    display: 'inline-block', width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.7s linear infinite',
  },
};
