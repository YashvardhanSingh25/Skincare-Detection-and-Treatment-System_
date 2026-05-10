import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import QuickScan from './pages/QuickScan';
import Chat from './pages/Chat';
import Login from './pages/Login';
import HowItWorks from './pages/HowItWorks';
import PersonalizedRoutines from './pages/PersonalizedRoutines';
import ChatWidget from './components/ChatWidget';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="font-sans antialiased">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
          <Route path="/quick-scan" element={<ProtectedRoute><QuickScan /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/routines" element={<ProtectedRoute><PersonalizedRoutines /></ProtectedRoute>} />
        </Routes>
        <ChatWidget />
      </div>
    </Router>
  );
}


export default App;





