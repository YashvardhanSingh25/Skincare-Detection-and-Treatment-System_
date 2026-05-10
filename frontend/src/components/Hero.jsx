import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Brain, User, Lock, ScanFace, Sparkles, Beaker, ArrowRight } from "lucide-react";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#F7FAF9] min-h-[calc(100vh-80px)] font-sans pt-16 lg:pt-24 flex flex-col relative overflow-hidden">

      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[30%] h-[50%] bg-emerald-200/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Section */}
      <div className="grid md:grid-cols-2 items-center px-6 lg:px-12 mt-6 lg:mt-12 flex-1 relative z-10 max-w-[1600px] mx-auto w-full">

        {/* LEFT TEXT */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="pb-6 relative z-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-600 font-bold text-xs mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            AI-Powered Dermatology
          </div>

          <h1 className="text-[36px] xl:text-[48px] font-black leading-[1.1] text-[#1A202C] tracking-tight">
            Skincare Detection and <br />
            <span className="bg-gradient-to-r from-teal-500 to-emerald-400 bg-clip-text text-transparent">Treatment System</span>
          </h1>

          <p className="text-sm xl:text-base text-gray-500 mt-3 xl:mt-4 max-w-lg font-medium leading-relaxed">
            AI-powered analysis for healthy, radiant skin.
            Detect issues early and get personalized treatment recommendations.
          </p>

          {/* Icons */}
          <div className="flex gap-4 xl:gap-6 mt-4 xl:mt-6 text-center">
            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => navigate('/scan')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="bg-white shadow-lg shadow-teal-900/5 group-hover:shadow-teal-500/20 transition-all p-3 rounded-2xl w-fit mx-auto text-teal-500">
                <ScanFace strokeWidth={1.5} size={24} />
              </div>
              <p className="text-[10px] xl:text-xs font-bold text-gray-600 mt-2 text-center leading-tight">Skin<br />Detection</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-chat'))}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="bg-white shadow-lg shadow-teal-900/5 group-hover:shadow-teal-500/20 transition-all p-3 rounded-2xl w-fit mx-auto text-teal-500">
                <Sparkles strokeWidth={1.5} size={24} />
              </div>
              <p className="text-[10px] xl:text-xs font-bold text-gray-600 mt-2 text-center leading-tight">Smart<br />Analysis</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              onClick={() => navigate('/routines')}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="bg-white shadow-lg shadow-teal-900/5 group-hover:shadow-teal-500/20 transition-all p-3 rounded-2xl w-fit mx-auto text-teal-500">
                <Beaker strokeWidth={1.5} size={24} />
              </div>
              <p className="text-[10px] xl:text-xs font-bold text-gray-600 mt-2 text-center leading-tight">Personalized<br />Treatment</p>
            </motion.div>
          </div>

          {/* Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/scan')}
            className="mt-6 xl:mt-8 group bg-teal-500 hover:bg-teal-600 text-white px-5 xl:px-6 py-2.5 xl:py-3 rounded-full font-bold text-sm xl:text-base shadow-xl shadow-teal-500/30 transition-all flex items-center gap-2"
          >
            Check Your Skin Now
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>

        </motion.div>

        {/* RIGHT IMAGE */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="relative h-full w-full flex items-end justify-center z-0"
        >
          <img
            src="/ChatGPT Image Apr 25, 2026, 12_39_32 AM.png"
            alt="doctor"
            className="absolute bottom-0 right-[-5%] xl:right-[-10%] w-[115%] xl:w-[125%] h-[115%] xl:h-[125%] max-w-none object-cover object-bottom"
          />

          {/* Floating Card - Premium Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute top-[10%] xl:top-[15%] left-[-5%] xl:left-[-10%] bg-white/90 backdrop-blur-xl border border-white shadow-2xl shadow-teal-900/10 px-3 xl:px-4 py-2 xl:py-3 rounded-2xl z-10 flex items-center gap-2 xl:gap-3"
          >
            <div>
              <p className="text-[9px] xl:text-[10px] font-bold text-gray-400 uppercase tracking-wider">Skin Health</p>
              <p className="text-base xl:text-lg font-black text-teal-500">Good</p>
            </div>
            <div className="relative w-8 h-8 xl:w-10 xl:h-10 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="50%" cy="50%" r="40%" fill="transparent" stroke="#E6F9F5" strokeWidth="4" />
                <circle cx="50%" cy="50%" r="40%" fill="transparent" stroke="#00A884" strokeWidth="4" strokeDasharray="125" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] xl:text-xs font-black text-gray-800">92%</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Features - Premium Floating Glass Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-teal-900/10 rounded-[28px] xl:rounded-[40px] mx-6 lg:mx-12 mb-10 xl:mb-12 px-6 lg:px-10 py-8 xl:py-10 flex flex-wrap justify-around items-center text-center relative z-20 -mt-2 xl:-mt-4"
      >
        <div onClick={() => navigate('/how-it-works')} className="flex items-center gap-4 font-bold text-gray-700 text-[16px] xl:text-[20px] hover:text-teal-600 transition-colors cursor-pointer group">
          <ShieldCheck className="text-teal-500 w-7 h-7 xl:w-8 xl:h-8 group-hover:scale-110 transition-transform" strokeWidth={2.5} /> Accurate Detection
        </div>

        <div onClick={() => navigate('/how-it-works')} className="flex items-center gap-4 font-bold text-gray-700 text-[16px] xl:text-[20px] hover:text-teal-600 transition-colors cursor-pointer group">
          <Brain className="text-teal-500 w-7 h-7 xl:w-8 xl:h-8 group-hover:scale-110 transition-transform" strokeWidth={2.5} /> AI Powered Analysis
        </div>

        <div onClick={() => navigate('/how-it-works')} className="flex items-center gap-4 font-bold text-gray-700 text-[16px] xl:text-[20px] hover:text-teal-600 transition-colors cursor-pointer group">
          <User className="text-teal-500 w-7 h-7 xl:w-8 xl:h-8 group-hover:scale-110 transition-transform" strokeWidth={2.5} /> Expert Care
        </div>

        <div onClick={() => navigate('/how-it-works')} className="flex items-center gap-4 font-bold text-gray-700 text-[16px] xl:text-[20px] hover:text-teal-600 transition-colors cursor-pointer group">
          <Lock className="text-teal-500 w-7 h-7 xl:w-8 xl:h-8 group-hover:scale-110 transition-transform" strokeWidth={2.5} /> Secure & Private
        </div>
      </motion.div>

    </div>
  );
}
