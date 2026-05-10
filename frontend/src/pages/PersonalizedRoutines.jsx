import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Sun, Moon, CheckCircle2, Clock, Droplets, Sparkles, AlertCircle, Activity, Calendar } from 'lucide-react';

const PersonalizedRoutines = () => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [day, setDay] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [error, setError] = useState(null);

  const [profileData, setProfileData] = useState(null);

  const userEmail = localStorage.getItem("userEmail") || "test@example.com";

  useEffect(() => {
    fetchRoutine();
  }, []);

  const [progressMetrics, setProgressMetrics] = useState(null);

  const fetchRoutine = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/schedule/today?user_email=${userEmail}`);
      const data = await response.json();

      const progressRes = await fetch(`http://localhost:5001/api/schedule/progress?user_email=${userEmail}`);
      const progressData = await progressRes.json();

      if (progressData.success) {
        setProgressMetrics(progressData.metrics);
      }

      if (data.success) {
        if (!data.scan_image) {
          setError("You haven't completed your first skin scan yet.");
          setLoading(false);
          return;
        }
        setTasks(data.tasks);
        setDay(data.day);
        setCurrentDay(data.day);
        setProfileData({
          disease: data.disease,
          skin_type: data.skin_type,
          image: data.scan_image,
          is_healthy: data.is_healthy,
          message: data.healthy_message,
          age: data.age
        });
      } else {
        setError(data.message || "No routine found.");
      }
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/schedule/task/${taskId}`, {
        method: 'PUT'
      });
      const data = await response.json();
      if (data.success) {
        setTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, completed: data.completed } : t
        ));
      }
    } catch (err) {
      console.error("Error toggling task:", err);
    }
  };

  const totalItems = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const handleDayChange = async (e) => {
    const selectedDay = parseInt(e.target.value);
    setDay(selectedDay);
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/schedule/day?user_email=${userEmail}&day=${selectedDay}`);
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Scans', value: progressMetrics?.scan_count || 0, icon: Activity, color: 'text-blue-500 bg-blue-50' },
    { label: 'Avg. Improvement', value: progressMetrics ? `+${progressMetrics.improvement.toFixed(1)}%` : '0%', sub: progressMetrics ? `Closeness: ${progressMetrics.closeness_to_normal.toFixed(1)}%` : '', icon: CheckCircle2, color: 'text-green-500 bg-green-50' },
    { label: 'Similarity Search', value: 'View Details', icon: Sparkles, color: 'text-purple-500 bg-purple-50', isAction: true },
    { label: 'Select Day', isDropdown: true, icon: Calendar, color: 'text-orange-500 bg-orange-50' },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#FBFBFC] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFC]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-20">
        {error ? (
          <div className="text-center py-20 bg-white rounded-[40px] shadow-sm border border-gray-100">
            <AlertCircle className="mx-auto text-rose-500 mb-6" size={64} />
            <h2 className="text-2xl font-black text-gray-900 mb-2">No Routine Active</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">{error}. Start by detecting your skin issues to get a personalized plan.</p>
            <button
              onClick={() => window.location.href = '/scan'}
              className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
            >
              Start Skin Analysis
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8"
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900 capitalize">Welcome back, {localStorage.getItem("userName") || "Guest"}! 👋</h1>
                <p className="text-gray-500 mt-1">Here's your skin health overview for today.</p>
              </div>
              <button
                onClick={() => window.location.href = '/quick-scan'}
                className="px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-600/20"
              >
                <Activity size={20} />
                Quick Scan & Similarity Search
              </button>
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
                    ) : stat.isAction ? (
                      <button
                        onClick={() => window.location.href = '/quick-scan'}
                        className="text-sm font-black text-purple-600 uppercase hover:text-purple-700 transition-colors"
                      >
                        {stat.value}
                      </button>
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

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-3xl font-black text-gray-900"
                >
                  {day === currentDay ? (
                    <>
                      <span className="text-teal-600">Today's</span> Routine <span className="text-gray-400 font-bold ml-2">(Day {day})</span>
                    </>
                  ) : (
                    <>
                      Day <span className="text-teal-600">{day}</span> Routine
                    </>
                  )}
                </motion.h2>
                <p className="text-gray-500 mt-2 font-medium">Complete your steps to maintain healthy skin.</p>
              </div>

              {/* Progress Visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-xl border-4 border-gray-50"
              >
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
              </motion.div>
            </div>

            <div className="grid gap-12">
              {['Morning', 'Night'].map((tod) => {
                const todTasks = tasks.filter(t => t.time_of_day === tod);
                if (todTasks.length === 0) return null;

                return (
                  <section key={tod}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-2 rounded-xl ${tod === 'Morning' ? 'bg-orange-50 text-orange-500' : 'bg-indigo-50 text-indigo-500'}`}>
                        {tod === 'Morning' ? <Sun size={24} /> : <Moon size={24} />}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">{tod === 'Morning' ? 'Morning Ritual' : 'Evening Ritual'}</h2>
                    </div>

                    <div className="space-y-4">
                      {todTasks.map((t, i) => (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => toggleTask(t.id)}
                          className={`group flex items-center justify-between p-6 rounded-[32px] border-2 transition-all cursor-pointer ${t.completed
                            ? 'bg-teal-50/50 border-teal-200'
                            : 'bg-white border-transparent hover:border-gray-200 shadow-sm'
                            }`}
                        >
                          <div className="flex items-center gap-5">
                            <div className={`p-3 rounded-2xl ${t.completed ? 'bg-teal-500 text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
                              <Droplets size={22} />
                            </div>
                            <div>
                              <h3 className={`font-bold text-lg transition-all ${t.completed ? 'text-teal-900 line-through opacity-50' : 'text-gray-900'}`}>
                                {t.task}
                              </h3>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${t.completed
                            ? 'bg-teal-500 border-teal-500 text-white'
                            : 'border-gray-200 text-transparent group-hover:border-teal-500'
                            }`}>
                            <CheckCircle2 size={18} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PersonalizedRoutines;

