import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AboutSection from '../components/AboutSection';
import { Camera, Bot, LineChart, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import sumanImg from '../assets/team/suman.jpeg';
import udayImg from '../assets/team/uday.jpeg';
import meImg from '../assets/team/me.jpeg';


const Home = () => {
  const navigate = useNavigate();
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [hash]);

  const services = [
    {
      title: "Skin Disease Detection",
      desc: "Identify common skin conditions with 95%+ accuracy using our trained neural networks.",
      icon: Camera,
      color: "from-teal-400 to-emerald-500",
      image: "/skin_detection_bg.png",
      action: () => navigate('/scan')
    },
    {
      title: "AI Chat Assistant",
      desc: "24/7 access to our skincare-trained AI for instant advice and product recommendations.",
      icon: Bot,
      color: "from-blue-400 to-indigo-500",
      image: "/ai_chat_bg.png",
      action: () => window.dispatchEvent(new CustomEvent('toggle-chat'))
    },
    {
      title: "Personalized Routines",
      desc: "Get custom AM/PM routines based on your unique skin profile and climate data.",
      icon: Sparkles,
      color: "from-amber-400 to-orange-500",
      image: "/growth_routine.png",
      action: () => navigate('/routines')
    }
  ];


  return (
    <div className="min-h-screen bg-white selection:bg-teal-100 selection:text-teal-900">
      <Navbar />
      <Hero />

      <AboutSection />

      {/* Services Section */}
      <section className="py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-bold text-[#00A884] uppercase tracking-[0.3em] mb-6"
            >
              Our Services
            </motion.h2>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl font-extrabold text-gray-900 mb-8"
            >
              Comprehensive care for your <span className="text-[#00A884]">skin health</span>
            </motion.h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                onClick={service.action}
                className="group relative bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all overflow-hidden cursor-pointer"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity blur-3xl`} />

                {service.image ? (
                  <div className="w-full h-40 rounded-3xl overflow-hidden mb-8 relative border border-gray-100 shadow-sm">
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-orange-500 shadow-sm">
                      <service.icon size={24} />
                    </div>
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white mb-8 shadow-lg`}>
                    <service.icon size={28} />
                  </div>
                )}
                <h4 className="text-2xl font-bold text-gray-900 mb-4">{service.title}</h4>
                <p className="text-gray-500 leading-relaxed">{service.desc}</p>
              </motion.div>

            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-[#00A884] rounded-[60px] p-16 md:p-24 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-5xl md:text-6xl font-black text-white mb-8">Start your journey to healthy skin today.</h2>
              <p className="text-teal-50/70 text-xl mb-12">No credit card required. Get your first analysis in under 60 seconds.</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="px-10 py-5 bg-white text-[#00A884] rounded-2xl font-black text-lg hover:shadow-2xl transition-all shadow-xl shadow-teal-900/10 w-full sm:w-auto"
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Meet Our Developers Section */}
      <section className="py-32 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-bold text-[#00A884] uppercase tracking-[0.3em] mb-6"
            >
              The Team
            </motion.h2>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl font-black text-gray-900"
            >
              Meet Our Developers
            </motion.h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              { role: "Frontend Developer", image: sumanImg, desc: "Built responsive and scalable web interfaces using React, HTML, CSS, and JavaScript, styled with Tailwind CSS, and connected to backend services using Node.js." },
              { role: "Backend Developer", image: udayImg, desc: "Building database using Mangodb and SqlLite and handle storing real-time data & also done the part of aunthentication and authorization in system ." },
              { role: "AI Developer", image: meImg, desc: "Built a multimodal AI system using MobileNetV2 for accurate skin detection and similarity search, integrated with an interactive chatbot for personalized assistance." }
            ].map((dev, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group flex flex-col items-center"
              >
                {/* Square Profile Placeholder */}
                <div className="w-full aspect-square bg-gray-100 rounded-3xl mb-8 overflow-hidden relative border border-gray-100 shadow-sm group-hover:shadow-xl transition-all duration-500">
                  <img
                    src={dev.image}
                    alt={dev.role}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <h4 className="text-2xl font-black text-gray-900 mb-3">{dev.role}</h4>
                <p className="text-gray-500 text-center leading-relaxed">
                  {dev.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-20 border-t border-gray-100 bg-white overflow-hidden flex flex-col">
        {/* Massive Typography at the top of the footer */}
        <div className="w-full flex justify-center mt-auto pb-10 px-4 overflow-hidden">
          <h1 className="text-[18vw] leading-[0.8] font-medium text-[#1A1A1A] tracking-tighter select-none">
            Dermalyzer
          </h1>
        </div>

        {/* Bottom Bar - Google Style */}
        <div className="border-t border-gray-100 bg-gray-50/50 py-10">
          <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Small Branding like Google */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#00A884] rounded-lg flex items-center justify-center text-white shadow-sm">
                <Sparkles size={16} fill="currentColor" />
              </div>
              <span className="text-lg font-black text-gray-900 uppercase tracking-widest">Dermalyzer</span>
            </div>

            {/* Links in the middle */}
            <div className="flex gap-12 text-sm font-bold text-gray-500 uppercase tracking-widest">
              <Link to="/#about" className="hover:text-[#00A884] transition-colors">About</Link>
              <Link to="/scan" className="hover:text-[#00A884] transition-colors">Scan</Link>
              <Link to="/how-it-works" className="hover:text-[#00A884] transition-colors">Terms</Link>
            </div>

            {/* Copyright on the right */}
            <p className="text-sm font-bold text-gray-400">© 2026 Dermalyzer.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
