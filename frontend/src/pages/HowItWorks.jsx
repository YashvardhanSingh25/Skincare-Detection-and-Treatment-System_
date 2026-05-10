import React from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Camera, Bot, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      title: "1. Capture or Upload",
      desc: "Take a clear photo of your skin concern using your phone or upload an existing image. Our AI works best with good lighting.",
      icon: Camera,
      color: "bg-teal-50 text-teal-600"
    },
    {
      title: "2. AI Analysis",
      desc: "Our deep learning models analyze the image against thousands of clinical samples to identify patterns and potential conditions.",
      icon: Sparkles,
      color: "bg-blue-50 text-blue-600"
    },
    {
      title: "3. Get Recommendations",
      desc: "Receive instant feedback, severity levels, and personalized routine suggestions tailored to your detected skin type.",
      icon: Bot,
      color: "bg-purple-50 text-purple-600"
    },
    {
      title: "4. Track Progress",
      desc: "Save your scans and monitor how your skin responds to the recommended treatments over time with our progress tracker.",
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-black text-gray-900 mb-6"
            >
              How it <span className="text-[#00A884]">Works</span>
            </motion.h1>
            <p className="text-xl text-gray-500 leading-relaxed">
              Dermalyzer uses state-of-the-art Artificial Intelligence to help you understand your skin health in seconds.
            </p>
          </div>
          {/* Platform Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-24 bg-teal-50/50 rounded-[40px] p-12 border border-teal-100"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">What We Provide</h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Dermalyzer is an advanced AI-powered dermatology assistant designed to help you take control of your skin health. We provide users with instant, clinical-grade skin analysis right from the comfort of their home without needing expensive equipment.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Whether you are struggling with acne, concerned about dark spots, or simply want to build a perfect daily routine, our platform bridges the gap between everyday skincare and professional dermatological insights by generating tailored morning and night routines based on your unique scan.
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Instant AI Diagnostics</h4>
                    <p className="text-sm text-gray-500">Detect issues like acne, blackheads, dark spots, and wrinkles with deep learning.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Smart Chatbot Assistant</h4>
                    <p className="text-sm text-gray-500">Ask questions, report product reactions, and get your routines updated instantly.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Progress Tracking</h4>
                    <p className="text-sm text-gray-500">Monitor your skin's health score daily and see how well your treatments are working.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-8 p-8 rounded-[40px] border border-gray-100 hover:shadow-xl transition-all group"
              >
                <div className={`w-20 h-20 shrink-0 rounded-3xl ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <step.icon size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed mb-6">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-32 bg-gray-900 rounded-[60px] p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent" />
            <h2 className="text-4xl font-black text-white mb-8 relative z-10">Ready to analyze your skin?</h2>
            <button
              onClick={() => window.location.href = '/scan'}
              className="px-10 py-5 bg-[#00A884] text-white rounded-2xl font-black text-lg hover:bg-[#008f70] transition-all shadow-xl shadow-teal-900/20 relative z-10 flex items-center gap-2 mx-auto"
            >
              Start Your First Scan <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
