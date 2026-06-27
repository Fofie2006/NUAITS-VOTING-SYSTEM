import React from 'react';
import PublicNav from '../../components/shared/PublicNav';
import { Link } from 'react-router-dom';
import { FiShield, FiUsers, FiAward, FiMail } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-14">
          <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FiShield className="text-blue-700 text-4xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">About NUAITS</h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg leading-relaxed">
            The Njala University Association of Information Technology Students (NUAITS) is the official student body
            representing IT students at Njala University, Sierra Leone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {[
            { icon: FiUsers, title: 'Our Community', desc: 'Representing hundreds of IT students across all departments and levels at Njala University.' },
            { icon: FiAward, title: 'Our Mission', desc: 'To foster academic excellence, technological innovation, and leadership among IT students.' },
            { icon: FiShield, title: 'Transparent Elections', desc: 'Our digital voting system ensures every student vote is secure, counted, and transparent.' },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <item.icon className="text-blue-700 text-3xl mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-800 rounded-2xl p-8 md:p-10 text-white text-center">
          <FiMail className="text-4xl mx-auto mb-4 text-blue-200" />
          <h2 className="text-2xl font-bold mb-3">Questions About the Election?</h2>
          <p className="text-blue-200 mb-6">Contact the NUAITS Electoral Committee for any voting-related inquiries.</p>
          <Link to="/vote" className="inline-block px-8 py-3 bg-white text-blue-800 font-bold rounded-xl hover:bg-blue-50 transition-colors">
            Go Vote Now
          </Link>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-6 px-4 text-center text-sm mt-12">
        <p>NUAITS Voting System · Njala University, Sierra Leone</p>
      </footer>
    </div>
  );
}
