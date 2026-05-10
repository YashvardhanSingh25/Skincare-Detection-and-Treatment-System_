import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import {
  Activity,
  Calendar,
  Droplets,
  Sun,
  Moon,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  // Stats are now dynamic based on profileData, so defined below.

  const [profileData, setProfileData] = useState(null);
  const [dbRoutine, setDbRoutine] = useState(null);
  const [oldRoutine, setOldRoutine] = useState(null);
  const [viewingRoutine, setViewingRoutine] = useState('current');
  const [tasks, setTasks] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [progressMetrics, setProgressMetrics] = useState(null);
  const [day, setDay] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [currentTipIdx, setCurrentTipIdx] = useState(0);

  const standardTips = [
    { title: "Acne Care", text: "Avoid picking or squeezing. Use non-comedogenic moisturizers and incorporate Salicylic Acid (BHA) to unclog pores." },
    { title: "Dark Spots", text: "Daily SPF 50+ is non-negotiable. Pair with Vitamin C in the morning to actively fade hyperpigmentation and protect skin." },
    { title: "Wrinkles & Aging", text: "Hydration is key. Introduce a gentle Retinol into your night routine to stimulate collagen production and smooth fine lines." },
    { title: "Blackhead Control", text: "Double cleanse every night using an oil-based cleanser first, followed by a water-based one to deeply clear out sebum." },
    { title: "General Rule", text: "Consistency beats intensity. Using a gentle routine every single day yields better results than harsh treatments once a week." }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTipIdx(prev => (prev + 1) % standardTips.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchRoutine = async () => {
      const email = localStorage.getItem("userEmail") || "test@example.com";
      try {
        const response = await fetch(`http://localhost:5001/api/schedule/today?user_email=${email}`);
        const data = await response.json();
        if (data.success) {
          setDay(data.day);
          setCurrentDay(data.day);
          if (data.scan_routine) setDbRoutine(data.scan_routine);
          if (data.old_routine) setOldRoutine(data.old_routine);
          if (data.tasks) setTasks(data.tasks);
          setProfileData({
            disease: data.disease,
            skin_type: data.skin_type,
            image: data.scan_image,
            is_healthy: data.is_healthy,
            message: data.healthy_message,
            age: data.age
          });
        }

        // Fetch 30-day progress
        const progressRes = await fetch(`http://localhost:5001/api/schedule/progress?user_email=${email}`);
        const progressJson = await progressRes.json();
        if (progressJson.success) {
          setProgressData(progressJson.progress);
          setProgressMetrics(progressJson.metrics);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchRoutine();
  }, []);

  const handleDayChange = async (e) => {
    const selectedDay = parseInt(e.target.value);
    setDay(selectedDay);
    try {
      const email = localStorage.getItem("userEmail") || "test@example.com";
      const response = await fetch(`http://localhost:5001/api/schedule/day?user_email=${email}&day=${selectedDay}`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteRecords = async () => {
    if (window.confirm("Are you sure you want to completely delete your scan records and trackers? This action cannot be undone.")) {
      try {
        const email = localStorage.getItem("userEmail") || "test@example.com";
        const response = await fetch(`http://localhost:5001/api/schedule?user_email=${email}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        if (data.success) {
          window.location.reload();
        } else {
          alert("Failed to delete records");
        }
      } catch (err) {
        console.error("Error deleting records:", err);
      }
    }
  };

  const defaultRoutine = [
    { time: 'Morning', items: ['Gentle Cleanser', 'Vitamin C Serum', 'SPF 50+ Sunscreen'], icon: Sun, color: 'bg-orange-50 text-orange-600' },
    { time: 'Evening', items: ['Oil Cleanser', 'Retinol 0.5%', 'Night Cream'], icon: Moon, color: 'bg-indigo-50 text-indigo-600' },
  ];

  const currentRoutineFormatted = dbRoutine && Object.keys(dbRoutine).length > 0 ? [
    { time: 'Morning', items: dbRoutine['Morning'] || [], icon: Sun, color: 'bg-orange-50 text-orange-600' },
    { time: 'Evening', items: dbRoutine['Night'] || dbRoutine['Evening'] || [], icon: Moon, color: 'bg-indigo-50 text-indigo-600' }
  ] : defaultRoutine;

  const oldRoutineFormatted = oldRoutine && Object.keys(oldRoutine).length > 0 ? [
    { time: 'Morning', items: oldRoutine['Morning'] || [], icon: Sun, color: 'bg-gray-100 text-gray-500' },
    { time: 'Evening', items: oldRoutine['Night'] || oldRoutine['Evening'] || [], icon: Moon, color: 'bg-gray-100 text-gray-500' }
  ] : null;

  const displayRoutine = viewingRoutine === 'current' ? currentRoutineFormatted : oldRoutineFormatted;

  const stats = [
    { label: 'Total Scans', value: progressMetrics?.scan_count || 0, icon: Activity, color: 'text-blue-500 bg-blue-50' },
    { label: 'Health Score', value: progressMetrics ? `${progressMetrics.health_score.toFixed(1)}%` : '0%', sub: progressMetrics?.improvement ? `+${progressMetrics.improvement.toFixed(1)}%` : 'N/A', icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
    { label: 'Closeness to Normal', value: progressMetrics ? `${progressMetrics.closeness_to_normal.toFixed(1)}%` : '0%', icon: Activity, color: 'text-purple-500 bg-purple-50' },
    { label: 'Select Day', isDropdown: true, icon: Calendar, color: 'text-orange-500 bg-orange-50' },
  ];

  const totalItems = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 capitalize">Welcome back, {localStorage.getItem("userName") || "Guest"}!</h1>
            <p className="text-gray-500 mt-1">Here's your skin health overview for today.</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm flex items-center gap-4"
            >
              <div className={`p-4 rounded-2xl ${stat.color} shrink-0`}>
                <stat.icon size={24} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 leading-snug">{stat.label}</p>
                {stat.isDropdown ? (
                  <select
                    value={day}
                    onChange={handleDayChange}
                    className="w-full bg-gray-50 border-none rounded-xl py-2 px-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 outline-none cursor-pointer"
                  >
                    {[...Array(30)].map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {idx + 1 === currentDay ? 'Today' : `Day ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-end gap-2 flex-wrap">
                    <span className="text-xl sm:text-2xl font-black text-gray-900 capitalize leading-none">{stat.value}</span>
                    {stat.sub && <span className="text-xs font-bold text-gray-400 mb-0.5 shrink-0">{stat.sub}</span>}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Routine */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2 space-y-8"
          >
            <section>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="text-teal-600" size={24} />
                  {viewingRoutine === 'current' ? "Today's Routine" : "Previous Routine"}
                </h2>

                {oldRoutineFormatted && (
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setViewingRoutine('current')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewingRoutine === 'current' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Current
                    </button>
                    <button
                      onClick={() => setViewingRoutine('previous')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewingRoutine === 'previous' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Previous
                    </button>
                  </div>
                )}
              </div>

              {!profileData?.image ? (
                <div className="bg-white p-12 rounded-[32px] border border-gray-100 shadow-sm text-center">
                  <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Activity size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Routine Yet</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Scan your face to let our AI analyze your skin and generate a personalized daily routine for you.
                  </p>
                  <button
                    onClick={() => window.location.href = '/scan'}
                    className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                  >
                    Start Your First Scan
                  </button>
                </div>
              ) : (progressMetrics?.closeness_to_normal > 95 || (profileData?.is_healthy && profileData?.skin_type?.toLowerCase() === 'normal')) ? (
                <div className="bg-white p-10 rounded-[32px] border border-gray-100 shadow-sm text-center">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">You are cured! 🎉</h3>
                  <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    Your skin is in excellent condition and no need medical care. Keep up your current healthy lifestyle and remember to stay hydrated!
                  </p>
                </div>
              ) : (
                <>
                  {profileData?.is_healthy && profileData?.skin_type?.toLowerCase() !== 'normal' && (
                    <div className="bg-blue-50 border border-blue-100 p-5 rounded-2xl mb-6 shadow-sm">
                      <p className="text-blue-800 font-medium text-sm leading-relaxed">
                        🎉 Good news! You have no skin diseases. However, since your skin type is <span className="font-bold capitalize">{profileData.skin_type}</span>, we recommend following this daily routine to maintain your skin's health.
                      </p>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-6">
                    {displayRoutine.map((time, i) => {
                      if (time.items.length === 0) return null;
                      return (
                        <div key={i} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3 rounded-2xl ${time.color}`}>
                              <time.icon size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{time.time}</h3>
                              <p className="text-xs text-gray-400 font-medium">{time.items.length} steps</p>
                            </div>
                          </div>
                          <ul className="space-y-4">
                            {time.items.map((item, j) => (
                              <li key={j} className="flex items-start gap-4 bg-gray-50/50 p-3 rounded-xl">
                                <div className="w-6 h-6 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 mt-0.5">
                                  {j + 1}
                                </div>
                                <span className="text-gray-700 font-medium leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </section>

            {profileData?.image && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {day === currentDay ? "Today's" : `Day ${day}`} Task Progress
                </h2>
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                    <svg className="w-full h-full -rotate-90 p-2">
                      <circle cx="50%" cy="50%" r="45%" className="stroke-gray-100 fill-none" strokeWidth="8" />
                      <circle
                        cx="50%" cy="50%" r="45%"
                        className="stroke-teal-500 fill-none transition-all duration-1000 ease-out"
                        strokeWidth="8"
                        strokeDasharray={`${progress * 2.8}, 283`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-gray-900">{progress}%</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Done</span>
                    </div>
                  </div>
                  <p className="text-gray-500 font-medium mb-6">
                    You've completed {completedCount} out of {totalItems} tasks today.
                  </p>
                  <button
                    onClick={() => window.location.href = '/routines'}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-600/20"
                  >
                    Go to Progress Tracker
                  </button>
                </div>
              </section>
            )}

            {profileData?.image && progressData.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">30-Day Progress History</h2>
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={progressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00A884" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00A884" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          tickFormatter={(val) => val.replace('Day ', '')}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                          formatter={(value) => [`${value}%`, 'Completed']}
                        />
                        <Area
                          type="monotone"
                          dataKey="progress"
                          stroke="#00A884"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorProgress)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}
          </motion.div>

          {/* Sidebar / Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-8"
          >
            {/* Skin Profile Card */}
            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Sparkles className="text-teal-600" size={20} />
                Your Skin Profile
              </h3>

              {profileData?.image ? (
                <div className="space-y-6">
                  <div className="aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-50 relative group">
                    <img
                      src={profileData.image}
                      alt="Skin analysis"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                      <span className="text-sm text-gray-500 font-medium">Condition</span>
                      <span className="text-sm font-bold text-gray-900 capitalize">{profileData.disease || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                      <span className="text-sm text-gray-500 font-medium">Skin Type</span>
                      <span className="text-sm font-bold text-gray-900">{profileData.skin_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-50">
                      <span className="text-sm text-gray-500 font-medium">Age Group</span>
                      <span className="text-sm font-bold text-gray-900">{profileData.age ? profileData.age.replace('u18', 'Under 18') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-sm text-gray-500 font-medium">Status</span>
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${profileData.is_healthy ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                        {profileData.is_healthy ? 'Healthy' : 'Needs Care'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="text-gray-300" size={24} />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No scan data yet</p>
                  <button className="mt-4 text-teal-600 font-bold text-sm">Start first scan</button>
                </div>
              )}
            </div>

            <div className="bg-teal-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-lg shadow-teal-900/20 min-h-[220px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 blur-3xl rounded-full" />
              <div className="relative z-10 pb-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles size={18} className="text-teal-400" />
                  Standard Protocol
                </h3>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTipIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                  >
                    <p className="text-teal-400 font-bold text-xs uppercase tracking-wider mb-1">
                      {standardTips[currentTipIdx].title}
                    </p>
                    <p className="text-teal-100/90 leading-relaxed text-sm">
                      {standardTips[currentTipIdx].text}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="absolute bottom-6 left-8 flex gap-1.5 z-10">
                {standardTips.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentTipIdx ? 'w-4 bg-teal-400' : 'w-1.5 bg-teal-700'}`} />
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Reminders</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl h-fit">
                    <Droplets size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Hydration Check</p>
                    <p className="text-xs text-gray-400 mt-1">Drink 500ml of water now</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl h-fit">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Vitamin Time</p>
                    <p className="text-xs text-gray-400 mt-1">Take your daily supplements</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={deleteRecords}
                className="w-full py-4 bg-white border-2 border-rose-100 text-rose-600 rounded-2xl font-bold hover:bg-rose-50 hover:border-rose-200 transition-all shadow-sm"
              >
                Delete All Records
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
