import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, User, ArrowRight, Globe } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLogin) {
      if (!email || !password) {
        alert("Fill all fields");
        return;
      }
      try {
        const response = await fetch("http://localhost:5000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.success) {
          localStorage.setItem("userName", data.user.name);
          localStorage.setItem("userEmail", data.user.email);
          navigate('/dashboard');
        } else {
          alert(data.message || "Invalid Credentials");
        }
      } catch (error) {
        alert("Server Error");
      }
    } else {
      if (!name || !email || !password) {
        alert("Fill all fields");
        return;
      }
      try {
        const response = await fetch("http://localhost:5000/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (data.success) {
          alert("Signup Successful. Please login.");
          setIsLogin(true);
        } else {
          alert(data.message || "Signup Failed");
        }
      } catch (error) {
        alert("Server Error");
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Please enter your email address first");
      return;
    }

    const newPassword = prompt("Enter your new password:");
    if (!newPassword) return;

    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword })
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert("Server Error: API endpoint not found. Please restart your backend server.");
        } else {
          alert(`Server Error: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();
      if (data.success) {
        alert("Password reset successful! You can now login with your new password.");
      } else {
        alert(data.message || "Could not reset password");
      }
    } catch (error) {
      console.error("Reset Error:", error);
      alert("Network Error: Could not connect to the server.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-100/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-2xl border border-gray-100 p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
              <Sparkles size={24} />
            </div>
            <span className="text-2xl font-black text-gray-900 uppercase tracking-tighter">GlowAi</span>
          </Link>
          <h1 className="text-3xl font-black text-gray-900 mb-3">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-gray-500 font-medium">
            {isLogin ? 'Enter your details to continue your journey.' : 'Start your personalized skincare journey today.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 transition-all font-medium"
              required
            />
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-sm font-bold text-teal-600 hover:text-teal-700"
              >
                Reset Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-5 bg-teal-600 text-white rounded-[24px] font-black text-lg hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 flex items-center justify-center gap-2 group"
          >
            {isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 py-4 border-2 border-gray-50 rounded-2xl hover:bg-gray-50 transition-all font-bold text-gray-600">
            <Globe size={20} className="text-rose-500" /> Google
          </button>
          <button className="flex items-center justify-center gap-3 py-4 border-2 border-gray-50 rounded-2xl hover:bg-gray-50 transition-all font-bold text-gray-600">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg> GitHub
          </button>

        </div>

        <p className="text-center mt-10 text-sm font-medium text-gray-500">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-teal-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
