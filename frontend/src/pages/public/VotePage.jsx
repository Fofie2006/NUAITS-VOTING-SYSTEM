import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNav from '../../components/shared/PublicNav';
import { validateVoteCredentials, submitVotes } from '../../utils/api';
import { FiArrowLeft, FiCheckCircle, FiShield, FiUser, FiKey, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const STEPS = { CREDENTIALS: 1, VOTING: 2, SUCCESS: 3 };

export default function VotePage() {
  const [step, setStep] = useState(STEPS.CREDENTIALS);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ student_id: '', voting_code: '' });
  const [sessionData, setSessionData] = useState(null); // { student, election, candidates, alreadyVotedFor }
  const [selections, setSelections] = useState({}); // { position: candidate_id }
  const [error, setError] = useState('');

  // Group candidates by position
  const groupByPosition = (candidates) => {
    return candidates.reduce((acc, c) => {
      if (!acc[c.position]) acc[c.position] = [];
      acc[c.position].push(c);
      return acc;
    }, {});
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await validateVoteCredentials({
        student_id: credentials.student_id.trim(),
        voting_code: credentials.voting_code.trim(),
      });
      if (data.success) {
        setSessionData(data.data);
        setStep(STEPS.VOTING);
        toast.success(`Welcome, ${data.data.student.name}!`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Validation failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (position, candidateId) => {
    setSelections(prev => ({ ...prev, [position]: candidateId }));
  };

  const handleSubmit = async () => {
    const positions = Object.keys(groupByPosition(sessionData.candidates));
    const unvoted = positions.filter(p => !selections[p] && !sessionData.alreadyVotedFor.includes(p));

    if (unvoted.length > 0) {
      toast.error(`Please select a candidate for: ${unvoted.join(', ')}`);
      return;
    }

    if (!window.confirm('Are you sure you want to submit your votes? This cannot be undone.')) return;

    setLoading(true);
    try {
      const votes = Object.entries(selections).map(([position, candidate_id]) => ({ position, candidate_id }));
      const { data } = await submitVotes({
        student_id: credentials.student_id,
        voting_code: credentials.voting_code,
        election_id: sessionData.election.id,
        votes,
      });
      if (data.success) {
        setStep(STEPS.SUCCESS);
        toast.success('Votes submitted!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit votes');
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Credentials
  if (step === STEPS.CREDENTIALS) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <PublicNav />
        <div className="max-w-md mx-auto px-4 py-12 md:py-20">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-800 to-blue-700 px-8 py-8 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiShield className="text-white text-3xl" />
              </div>
              <h1 className="text-white text-2xl font-bold">NUAITS Election</h1>
              <p className="text-blue-200 text-sm mt-1">Enter your credentials to vote</p>
            </div>

            {/* Form */}
            <form onSubmit={handleValidate} className="px-8 py-8 space-y-5">
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 animate-fade-in">
                  <FiAlertCircle className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiUser className="inline mr-1.5 text-blue-600" />
                  Student ID
                </label>
                <input
                  type="text"
                  value={credentials.student_id}
                  onChange={e => setCredentials(p => ({ ...p, student_id: e.target.value }))}
                  placeholder="e.g. CS/2021/001"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <FiKey className="inline mr-1.5 text-blue-600" />
                  Voting Code
                </label>
                <input
                  type="text"
                  value={credentials.voting_code}
                  onChange={e => setCredentials(p => ({ ...p, voting_code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. XXXX-XXXX-XXXX"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors font-mono tracking-widest text-lg"
                  maxLength={14}
                />
                <p className="text-xs text-gray-400 mt-1.5">Found in the email sent to you by NUAITS</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition-colors shadow-lg hover:shadow-blue-700/30 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                ) : 'Verify & Continue →'}
              </button>

              <div className="flex items-center gap-2 text-xs text-gray-400 justify-center">
                <FiShield className="text-green-500" />
                Your credentials are encrypted and securely verified
              </div>
            </form>
          </div>

          <p className="text-center mt-6 text-sm text-gray-500">
            <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
          </p>
        </div>
      </div>
    );
  }

  // STEP 2: Voting
  if (step === STEPS.VOTING) {
    const candidatesByPosition = groupByPosition(sessionData.candidates);
    const positions = Object.keys(candidatesByPosition);
    const totalPositions = positions.length;
    const votedCount = Object.keys(selections).length;

    return (
      <div className="min-h-screen bg-gray-50">
        <PublicNav />
        <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
          {/* Student info banner */}
          <div className="bg-blue-700 text-white rounded-2xl px-6 py-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-lg">{sessionData.student.name}</p>
              <p className="text-blue-200 text-sm">{sessionData.student.student_id} · {sessionData.student.department}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs uppercase tracking-wide">Progress</p>
              <p className="font-bold">{votedCount}/{totalPositions} Positions</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${totalPositions > 0 ? (votedCount / totalPositions) * 100 : 0}%` }}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">{sessionData.election.title}</h2>
          <p className="text-gray-500 text-sm mb-8">Select one candidate for each position. All positions must be filled before submission.</p>

          {/* Positions */}
          {positions.map(position => (
            <div key={position} className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-bold text-gray-800 text-lg">{position}</h3>
                {selections[position] && <span className="text-xs bg-green-100 text-green-700 font-semibold px-3 py-1 rounded-full">✓ Selected</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {candidatesByPosition[position].map(candidate => {
                  const isSelected = selections[position] === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      onClick={() => handleSelect(position, candidate.id)}
                      className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100'
                          : 'border-gray-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      {/* Photo */}
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden ${
                          isSelected ? 'ring-2 ring-blue-600' : 'bg-gray-100'
                        }`}>
                          {candidate.photo ? (
                            <img src={candidate.photo} alt={candidate.fullname} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                              <span className="text-blue-700 font-bold text-xl">{candidate.fullname[0]}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-base ${isSelected ? 'text-blue-800' : 'text-gray-900'}`}>
                            {candidate.fullname}
                          </p>
                          {candidate.department && (
                            <p className="text-gray-500 text-sm truncate">{candidate.department}</p>
                          )}
                          {candidate.manifesto && (
                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">{candidate.manifesto}</p>
                          )}
                        </div>
                        {isSelected && (
                          <FiCheckCircle className="text-blue-600 text-xl flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Submit */}
          <div className="sticky bottom-4">
            <button
              onClick={handleSubmit}
              disabled={loading || votedCount < totalPositions}
              className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl text-base transition-colors shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              ) : votedCount < totalPositions
                ? `Select ${totalPositions - votedCount} more position(s) to continue`
                : '✓ Submit All Votes'
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: Success
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex flex-col">
      <PublicNav />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center animate-slide-up">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="text-green-600 text-5xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Vote Submitted!</h1>
          <p className="text-gray-500 mb-2 text-lg">Thank you, {sessionData?.student?.name}.</p>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Your votes have been securely recorded. Your voting code has been marked as used
            and cannot be reused. The results will be announced when voting closes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/results" className="px-6 py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors">
              View Live Results
            </Link>
            <Link to="/" className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
