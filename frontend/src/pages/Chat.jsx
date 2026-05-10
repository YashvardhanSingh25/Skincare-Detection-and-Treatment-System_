import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Send, Bot, User, Sparkles, Plus, X } from 'lucide-react';

const Chat = () => {
  const userEmail = localStorage.getItem("userEmail") || "guest";
  const CHAT_HISTORY_KEY = `skincare_chat_history_${userEmail}`;
  const RECENT_CHATS_KEY = `skincare_recent_chats_${userEmail}`;
  const lastKey = useRef(CHAT_HISTORY_KEY);

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [
      { role: 'assistant', content: "Hello! I'm your AI Skincare Expert. How can I help you today? You can ask me about ingredients, routines, or specific skin concerns." }
    ];
  });
  const [recentChats, setRecentChats] = useState(() => {
    const saved = localStorage.getItem(RECENT_CHATS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Sync with mini chatbot
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
        { role: 'assistant', content: "Hello! I'm your AI Skincare Expert. How can I help you today? You can ask me about ingredients, routines, or specific skin concerns." }
      ]);
      const savedRecents = localStorage.getItem(RECENT_CHATS_KEY);
      setRecentChats(savedRecents ? JSON.parse(savedRecents) : []);
      lastKey.current = CHAT_HISTORY_KEY;
      return;
    }

    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    const currentStr = JSON.stringify(messages);
    if (saved !== currentStr) {
      localStorage.setItem(CHAT_HISTORY_KEY, currentStr);
      window.dispatchEvent(new Event('chat-updated'));
    }
  }, [messages, CHAT_HISTORY_KEY, RECENT_CHATS_KEY]);

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

  const handleNewChat = () => {
    if (messages.length > 1) {
      const newRecent = {
        id: Date.now(),
        title: messages.find(m => m.role === 'user')?.content.substring(0, 30) || 'New Chat',
        messages: [...messages]
      };
      const updatedRecents = [newRecent, ...recentChats].slice(0, 5);
      setRecentChats(updatedRecents);
      localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(updatedRecents));
    }

    const defaultMsg = [{ role: 'assistant', content: "Hello! I'm your AI Skincare Expert. How can I help you today?" }];
    setMessages(defaultMsg);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(defaultMsg));
  };

  const loadRecentChat = (chat) => {
    setMessages(chat.messages);
  };

  const handleDeleteChat = (id) => {
    const updatedRecents = recentChats.filter(c => c.id !== id);
    setRecentChats(updatedRecents);
    localStorage.setItem(RECENT_CHATS_KEY, JSON.stringify(updatedRecents));
  };

  const parseRoutine = (text) => {
    const morningMatch = text.match(/\*\*Morning Routine:\*\*\s*([\s\S]*?)(?=\*\*Night Routine:\*\*|$)/i);
    const nightMatch = text.match(/\*\*Night Routine:\*\*\s*([\s\S]*?)$/i);

    const extractSteps = (section) => {
      if (!section) return [];
      return section.split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0 && !line.includes('**'));
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
        alert("Routine updated successfully! Your dashboard will now show these new steps.");
      } else {
        alert(data.message || "Failed to update routine");
      }
    } catch (err) {
      alert("Error: Could not reach the server.");
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar />
      <motion.main
        initial={{ scale: 0, opacity: 0, transformOrigin: 'bottom right' }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 max-w-5xl w-full mx-auto px-4 pt-28 pb-6 flex gap-6 overflow-hidden"
      >
        {/* Sidebar / History */}
        <div className="hidden lg:flex flex-col w-64 bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 w-full py-3 px-4 bg-teal-50 text-teal-700 rounded-xl font-bold mb-8 hover:bg-teal-100 transition-colors"
          >
            <Plus size={20} /> New Chat
          </button>

          <div className="flex-1 space-y-4">
            <p className="text-xs font-bold text-gray-400 uppercase px-2">Recent Chats</p>
            <div className="space-y-1">
              {recentChats.map((chat) => (
                <div key={chat.id} className="group relative flex items-center">
                  <button
                    onClick={() => loadRecentChat(chat)}
                    className="flex-1 text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium truncate pr-8"
                  >
                    {chat.title}...
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    className="absolute right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {recentChats.length === 0 && (
                <p className="text-xs text-gray-300 px-3 italic">No recent chats</p>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white">
                <Bot size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Skincare Assistant</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-teal-500 rounded-full" />
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-100 text-gray-600' : 'bg-teal-50 text-teal-600'
                  }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[80%] space-y-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap text-left ${msg.role === 'user'
                    ? 'bg-gray-900 text-white rounded-tr-none'
                    : 'bg-gray-50 text-gray-700 rounded-tl-none'
                    }`}>
                    {msg.content}
                  </div>

                  {msg.role === 'assistant' && msg.content.includes('**Morning Routine:**') && (
                    <button
                      onClick={() => handleUpdateRoutine(msg.content)}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                    >
                      <Plus size={14} /> Update My Routine
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 pt-2">
            <form
              onSubmit={handleSend}
              className="relative"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about skincare..."
                className="w-full pl-6 pr-16 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500/20 text-sm transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20"
              >
                <Send size={18} />
              </button>
            </form>
            <p className="text-[10px] text-gray-400 text-center mt-3 font-medium flex items-center justify-center gap-1">
              <Sparkles size={10} /> AI can make mistakes. Consult a dermatologist for medical advice.
            </p>
          </div>
        </div>
      </motion.main>
    </div>
  );
};

export default Chat;
