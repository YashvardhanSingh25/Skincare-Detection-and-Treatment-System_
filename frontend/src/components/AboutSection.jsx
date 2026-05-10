import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Target, Stethoscope } from 'lucide-react';

const AboutSection = () => {
  const cards = [
    {
      title: "Our Mission",
      description: "To democratize professional skincare through advanced AI technology, making dermatological insights accessible to everyone.",
      icon: Target,
      color: "bg-teal-50 text-teal-600"
    },
    {
      title: "Trust & Safety",
      description: "Your data is encrypted and handled with the highest privacy standards. We prioritize your health and confidentiality above all.",
      icon: Shield,
      color: "bg-emerald-50 text-emerald-600"
    },
    {
      title: "Medical Disclaimer",
      description: "While we strive to provide the best AI analysis possible, this tool does not replace professional medical advice. In case of severe redness or persistent issues, please consult a certified dermatologist.",
      icon: Stethoscope,
      color: "bg-rose-50 text-rose-600"
    }
  ];

  return (
    <section id="about" className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-sm font-bold text-[#00A884] uppercase tracking-[0.3em] mb-6">About Dermalyzer</h2>
            <h3 className="text-5xl font-extrabold text-gray-900 leading-tight mb-8">
              Pioneering the future of <span className="text-[#00A884]">digital dermatology</span>
            </h3>
            <p className="text-xl text-gray-500 leading-relaxed mb-10">
              Dermalyzer combines cutting-edge computer vision with decades of dermatological expertise to provide instant, accurate skin analysis from your smartphone.
            </p>
          </motion.div>

          <div className="space-y-6">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-8 rounded-[32px] border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex gap-6 group"
              >
                <div className={`w-16 h-16 rounded-2xl ${card.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <card.icon size={28} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{card.title}</h4>
                  <p className="text-gray-500 leading-relaxed">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
