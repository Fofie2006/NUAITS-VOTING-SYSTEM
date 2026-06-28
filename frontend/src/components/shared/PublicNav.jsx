import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiMenu, FiX, FiShield } from 'react-icons/fi';

export default function PublicNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl flex items-center justify-center shadow">
              <FiShield className="text-white text-base" />
            </div>
            <div>
              <span className="font-bold text-blue-900 text-base">NUAITS</span>
              <span className="hidden sm:inline text-gray-500 text-sm ml-1">Voting</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { to: '/', label: 'Home' },
              { to: '/about', label: 'About' },
              { to: '/results', label: 'Results' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:text-blue-700 hover:bg-gray-50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            <Link
              to="/vote"
              className="ml-3 px-5 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm"
            >
              Vote Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <Link to="/vote" className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-semibold">
              Vote
            </Link>
            <button onClick={() => setOpen(!open)} className="text-gray-600 p-1">
              {open ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1 animate-fade-in">
            {[
              { to: '/', label: 'Home' },
              { to: '/about', label: 'About' },
              { to: '/results', label: 'Results' },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg text-sm font-medium ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
