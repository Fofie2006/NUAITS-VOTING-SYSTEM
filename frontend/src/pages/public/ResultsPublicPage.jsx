import React, { useEffect, useState } from 'react';
import PublicNav from '../../components/shared/PublicNav';
import { getActiveElection, getElectionResults } from '../../utils/api';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { FiBarChart2, FiAward } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function ResultsPublicPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState(null);
  const [election, setElection] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const el = await getActiveElection();
        if (!el.data.data) { setError('No active election found.'); setLoading(false); return; }
        setElection(el.data.data);
        const r = await getElectionResults(el.data.data.id);
        setResults(r.data.data);
      } catch {
        setError('Results are not available yet.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <FiBarChart2 className="text-5xl text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Results Not Available</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    </div>
  );

  const COLORS = ['#1d4ed8', '#16a34a', '#0891b2', '#7c3aed', '#dc2626', '#d97706'];

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">{election?.title} — Results</h1>
          <p className="text-gray-500">
            Turnout: <strong className="text-blue-700">{results?.turnout}%</strong> ·
            Voters: <strong>{results?.totalVoters}</strong> of <strong>{results?.totalStudents}</strong> registered
          </p>
          {election?.status !== 'ended' && (
            <span className="inline-block mt-3 px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold animate-pulse-slow">
              🔴 Live — Voting in progress
            </span>
          )}
        </div>

        {results?.results?.map((posResult) => {
          const labels = posResult.candidates.map(c => c.fullname);
          const data = posResult.candidates.map(c => c.vote_count);

          return (
            <div key={posResult.position} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">{posResult.position}</h2>
                {posResult.winner && (
                  <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-1.5">
                    <FiAward className="text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800">
                      {posResult.winner.fullname} {election?.status === 'ended' ? '(Winner)' : '(Leading)'}
                    </span>
                  </div>
                )}
              </div>

              {/* Candidates */}
              <div className="space-y-3 mb-6">
                {posResult.candidates.map((c, i) => (
                  <div key={c.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-800">{c.fullname}</span>
                      <span className="font-mono text-gray-500">{c.vote_count} votes ({c.percentage}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${c.percentage}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              {data.some(d => d > 0) && (
                <div className="h-48">
                  <Bar
                    data={{
                      labels,
                      datasets: [{ label: 'Votes', data, backgroundColor: COLORS.slice(0, labels.length) }],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <footer className="bg-gray-900 text-gray-400 py-6 px-4 text-center text-sm">
        <p>NUAITS Voting System · Results update in real time</p>
      </footer>
    </div>
  );
}
