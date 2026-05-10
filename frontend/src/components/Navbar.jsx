import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userName = localStorage.getItem("userName");

  const handleLogout = () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'About', path: '/#about' },
    { name: 'Skin Detection', path: '/scan' },
    { name: 'Chatbot', path: '/chat' },
    { name: 'How It Works', path: '/how-it-works' },
  ];

  return (
    <nav className="fixed w-full z-50 bg-white/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between h-24 items-center">
          {/* Logo - Teal Outline Cross */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 text-[#00A884]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M12 4v16m-8-8h16" />
                <path d="M4 12a8 8 0 0 1 8-8 8 8 0 0 1 8 8" strokeDasharray="10 10" strokeWidth="1.5" className="opacity-40" />
                <path d="M4 12a8 8 0 0 0 8 8 8 8 0 0 0 8-8" strokeDasharray="10 10" strokeWidth="1.5" className="opacity-40" />
              </svg>
            </div>
            <span className="text-[24px] font-black tracking-tight text-[#1A202C] uppercase font-sans">
              Dermalyzer
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            <div className="flex items-center gap-8 text-[15px] font-bold text-gray-500">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`hover:text-[#00A884] transition-all relative py-1 ${location.pathname === link.path && !link.path.includes('#') ? 'text-gray-900' : ''
                    }`}
                >
                  {link.name}
                  {location.pathname === link.path && !link.path.includes('#') && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-0 w-full h-[3px] bg-[#00A884] rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>
            {userName ? (
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-700">Hi, {userName}</span>
                <button
                  onClick={handleLogout}
                  className="px-8 py-3.5 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-8 py-3.5 rounded-full bg-[#00A884] text-white font-bold hover:bg-[#008f70] transition-all shadow-lg shadow-teal-100"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="lg:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-6 py-8 space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="block text-lg font-bold text-gray-700 hover:text-[#00A884] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/login"
                className="block w-full text-center px-6 py-4 rounded-2xl bg-[#00A884] text-white font-bold"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
