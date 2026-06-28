import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicNav from '../../components/shared/PublicNav';
import { getActiveElection } from '../../utils/api';
import { FiShield, FiUsers, FiBarChart2, FiCheckCircle, FiLock, FiSmartphone } from 'react-icons/fi';

export default function HomePage() {
  const [election, setElection] = useState(null);

  useEffect(() => {
    getActiveElection().then(r => setElection(r.data.data)).catch(() => {});
  }, []);

  const features = [
    { icon: FiLock, title: 'Secure & Tamper-proof', desc: 'One-time voting codes ensure each student votes exactly once', color: 'blue' },
    { icon: FiSmartphone, title: 'Mobile First', desc: 'Vote from your phone, tablet, or laptop — anywhere, anytime', color: 'green' },
    { icon: FiCheckCircle, title: 'Instant Verification', desc: 'Your Student ID and unique code are verified in seconds', color: 'blue' },
    { icon: FiBarChart2, title: 'Live Results', desc: 'Real-time vote counting with transparent result display', color: 'green' },
  ];

  const steps = [
    { num: '01', title: 'Check your email', desc: 'After registration, you receive your unique voting code via email' },
    { num: '02', title: 'Go to Vote page', desc: 'Visit the voting portal using the Vote Now button' },
    { num: '03', title: 'Enter credentials', desc: 'Type your Student ID and the voting code from your email' },
    { num: '04', title: 'Cast your votes', desc: 'Select your preferred candidate for each position and confirm' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-green-400 blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
            {election?.voting_enabled ? 'Voting is LIVE now' : 'NUAITS General Elections'}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Your Voice,<br />
            <span className="text-green-400">Your Vote</span>
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The official digital voting platform for Njala University Association of Information Technology Students.
            Secure, transparent, and built for every student.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/vote"
              className="px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl text-lg transition-all duration-200 shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5"
            >
              🗳️ Vote Now
            </Link>
            <Link
              to="/about"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold rounded-xl text-lg transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Election Status Banner */}
      {election && (
        <div className={`py-4 text-center text-sm font-semibold ${
          election.voting_enabled ? 'bg-green-50 text-green-800 border-b border-green-200' : 'bg-yellow-50 text-yellow-800 border-b border-yellow-200'
        }`}>
          {election.voting_enabled
            ? `🟢 ${election.title} — Voting is open! Cast your vote now.`
            : `⏳ ${election.title} — Voting will open soon. Stay tuned.`
          }
        </div>
      )}

      {/* Features */}
      <section className="py-16 md:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Why NUAITS Digital Voting?</h2>
          <p className="text-gray-500 max-w-lg mx-auto">Built with security and student experience at the core.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200 group">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                f.color === 'blue' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              } group-hover:scale-110 transition-transform duration-200`}>
                <f.icon className="text-xl" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to Vote */}
      <section className="py-16 md:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">How to Vote</h2>
            <p className="text-gray-500">Simple, fast, and secure in four steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-5 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-900 text-white rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0">
                  {s.num}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <FiUsers className="text-5xl text-blue-700 mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Ready to Make Your Voice Heard?</h2>
          <p className="text-gray-500 mb-8">Use your Student ID and the voting code sent to your email to cast your ballot.</p>
          <Link
            to="/vote"
            className="inline-block px-10 py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-lg transition-colors shadow-lg"
          >
            Go to Voting Page →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <p className="font-medium text-white mb-1">NUAITS Voting System</p>
        <p>Njala University Association of Information Technology Students</p>
        <p className="mt-2 text-xs">
          <Link to="/admin/login" className="hover:text-gray-300 transition-colors">Admin Access</Link>
        </p>
      </footer>
    </div>
  );
}
