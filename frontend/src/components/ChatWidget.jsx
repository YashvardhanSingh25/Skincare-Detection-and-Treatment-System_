import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, Plus } from 'lucide-react';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const userEmail = localStorage.getItem("userEmail") || "guest";
  const CHAT_HISTORY_KEY = `skincare_chat_history_${userEmail}`;
  const RECENT_CHATS_KEY = `skincare_recent_chats_${userEmail}`;
  const lastKey = React.useRef(CHAT_HISTORY_KEY);

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: 'Hi! Ask me anything about your skin concerns.' }
    ];
  });
  const [input, setInput] = useState('');

  useEffect(() => {
    const syncChat = () => {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(prev => {
          if (JSON.stringify(prev) === saved) return prev;
          return parsed;
        });
      }
    };
    window.addEventListener('storage', syncChat);
    window.addEventListener('chat-updated', syncChat);
    return () => {
      window.removeEventListener('storage', syncChat);
      window.removeEventListener('chat-updated', syncChat);
    };
  }, [CHAT_HISTORY_KEY]);

  useEffect(() => {
    if (lastKey.current !== CHAT_HISTORY_KEY) {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      setMessages(saved ? JSON.parse(saved) : [
        { role: 'assistant', content: 'Hi! Ask me anything about your skin concerns.' }
      ]);
      lastKey.current = CHAT_HISTORY_KEY;
      return;
    }

    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    const currentStr = JSON.stringify(messages);
    if (saved !== currentStr) {
      localStorage.setItem(CHAT_HISTORY_KEY, currentStr);
      window.dispatchEvent(new Event('chat-updated'));
    }
  }, [messages, CHAT_HISTORY_KEY]);

  React.useEffect(() => {
    const handleToggle = () => setIsOpen(true);
    window.addEventListener('toggle-chat', handleToggle);
    return () => window.removeEventListener('toggle-chat', handleToggle);
  }, []);

  const handleNewChat = () => {
    if (messages.length > 1) {
      const savedRecents = localStorage.getItem(RECENT_CHATS_KEY);
      const recentChats = savedRecents ? JSON.parse(savedRecents) : [];

      const newRecent = {
        id: Date.now(),
        title: messages.find(m => m.role === 'user')?.content.substring(0, 30) || 'New Chat',
        messages: [...messages]
      };

      const updatedRecents = [newRecent, ...recentChats].slice(0, 5);
      localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(updatedRecents));
    }

    const defaultMsg = [{ role: 'assistant', content: 'Hi! Ask me anything about your skin concerns.' }];
    setMessages(defaultMsg);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(defaultMsg));
    window.dispatchEvent(new Event('chat-updated'));
  };

  if (['/chat', '/login', '/signup'].includes(location.pathname)) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          user_email: localStorage.getItem("userEmail") || "test@example.com"
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the AI right now." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Could not reach the backend server." }]);
    }
  };

  const parseRoutine = (text) => {
    const morningMatch = text.match(/\*\*Morning Routine:\*\*\s*([\s\S]*?)(?=\*\*Night Routine:\*\*|$)/i);
    const nightMatch = text.match(/\*\*Night Routine:\*\*\s*([\s\S]*?)$/i);

    const extractSteps = (section) => {
      if (!section) return [];
      return section.split('\n')
        .map(line => line.trim())
        .filter(line => /^\d+\.\s/.test(line))
        .map(line => line.replace(/^\d+\.\s*/, '').trim());
    };

    return {
      Morning: extractSteps(morningMatch?.[1]),
      Night: extractSteps(nightMatch?.[1])
    };
  };

  const handleUpdateRoutine = async (routineText) => {
    const routine = parseRoutine(routineText);
    if (routine.Morning.length === 0 && routine.Night.length === 0) {
      alert("No routine found in this message.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: localStorage.getItem("userEmail") || "test@example.com",
          routine: routine,
          is_update: true
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Routine updated successfully!");
      } else {
        alert(data.message || "Failed to update routine");
      }
    } catch (err) {
      alert("Error: Could not reach the server.");
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-[350px] bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-teal-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Skin AI Mini</h3>
                  <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Active Now</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleNewChat}
                  title="New Chat"
                  className="hover:bg-white/20 p-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus size={16} />
                  <span className="text-xs font-bold">New</span>
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-[350px] overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                      ? 'bg-gray-900 text-white rounded-tr-none'
                      : 'bg-white text-gray-700 shadow-sm rounded-tl-none border border-gray-100'
                    }`}>
                    {msg.content}
                  </div>

                  {msg.role === 'assistant' && msg.content.includes('**Morning Routine:**') && (
                    <button
                      onClick={() => handleUpdateRoutine(msg.content)}
                      className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-[10px] font-bold hover:bg-teal-700 transition-all shadow-md"
                    >
                      Update My Routine
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSend} className="relative">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center hover:bg-teal-700 transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${isOpen ? 'bg-gray-900 text-white' : 'bg-teal-600 text-white'
          }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-white rounded-full" />
        )}
      </motion.button>
    </div>
  );
};

export default ChatWidget;
