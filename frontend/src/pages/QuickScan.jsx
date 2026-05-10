import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Camera, RefreshCcw, ShieldCheck, Info, Scan as ScanIcon, ArrowRight, Sparkles, CameraOff, Sun, Moon, SplitSquareHorizontal } from 'lucide-react';

const QuickScan = () => {
  const [scanMode, setScanMode] = useState('face'); // 'face' or 'skin'
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [skinType, setSkinType] = useState('');
  const [age, setAge] = useState('');

  // Single image for skin mode
  const [previewImage, setPreviewImage] = useState(null);

  // Three images for face mode
  const [faceImages, setFaceImages] = useState({ left: null, middle: null, right: null });
  const [activeFaceSide, setActiveFaceSide] = useState('middle'); // 'left', 'middle', 'right'

  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/schedule/today?user_email=${localStorage.getItem('userEmail') || 'test@example.com'}`);
        const data = await response.json();
        if (data.success && data.skin_type) {
          setSkinType(data.skin_type);
          setAge(data.age);
        } else {
          setError("No previous scan found. Please do a full scan first.");
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchProfile();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (scanMode === 'face') {
          setFaceImages(prev => ({ ...prev, [activeFaceSide]: reader.result }));
        } else {
          setPreviewImage(reader.result);
        }
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');

      if (scanMode === 'face') {
        setFaceImages(prev => ({ ...prev, [activeFaceSide]: dataUrl }));
      } else {
        setPreviewImage(dataUrl);
      }
      stopCamera();
    }
  };

  const startScan = async () => {
    if (!skinType || !age) {
      alert("Please select your skin type and age first!");
      return;
    }

    const formData = new FormData();
    formData.append('skin_type', skinType);
    formData.append('mode', scanMode);
    formData.append('user_email', localStorage.getItem('userEmail') || "test@example.com");

    if (scanMode === 'face') {
      if (!faceImages.left || !faceImages.middle || !faceImages.right) {
        alert("Please upload/capture all 3 sides (Left, Middle, Right) for a complete face scan.");
        return;
      }
      const sides = ['left', 'middle', 'right'];
      for (const side of sides) {
        const res = await fetch(faceImages[side]);
        const blob = await res.blob();
        formData.append(`image_${side}`, blob, `scan_${side}.jpg`);
      }
    } else {
      if (!previewImage) {
        alert("Please upload or capture a photo first!");
        return;
      }
      const res = await fetch(previewImage);
      const blob = await res.blob();
      formData.append('image', blob, 'scan.jpg');
    }

    setIsScanning(true);
    setError(null);

    try {
      const predictRes = await fetch('http://localhost:5001/api/predict', {
        method: 'POST',
        body: formData
      });
      const predictData = await predictRes.json();

      if (predictData.success) {
        setResult(predictData);
        setScanComplete(true);

        if (predictData.improvement < 0) {
          const email = localStorage.getItem("userEmail") || "guest";
          const CHAT_HISTORY_KEY = `skincare_chat_history_${email}`;
          const saved = localStorage.getItem(CHAT_HISTORY_KEY);
          let messages = saved ? JSON.parse(saved) : [{ role: 'assistant', content: 'Hi! Ask me anything about your skin concerns.' }];

          messages.push({
            role: 'assistant',
            content: "⚠️ **Alert:** Your score is dropping! Are you eating something that you shouldn't eat? Please review your diet and routine."
          });

          localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
          window.dispatchEvent(new Event('chat-updated'));
          setTimeout(() => window.dispatchEvent(new Event('toggle-chat')), 500);
        }

      } else {
        setError(predictData.message || "Detection failed.");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError("Failed to connect to AI server.");
    } finally {
      setIsScanning(false);
    }
  };

  const addToRecord = () => {
    // The backend /api/predict already updated the DB with new metrics
    // We just navigate back to routines
    window.location.href = '/routines';
  };

  const currentViewedImage = scanMode === 'face' ? faceImages[activeFaceSide] : previewImage;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-20 text-center">
        {!scanComplete ? (
          <div className="space-y-10">
            <div className="max-w-xl mx-auto">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Quick Scan & Similarity Search</h1>
              <p className="text-gray-500 text-lg">Scan your face to check your improvement and verify similarity against your original scan.</p>
            </div>

            {/* Mode Toggle */}
            <div className="max-w-md mx-auto bg-gray-200 p-1 rounded-2xl flex relative overflow-hidden shadow-inner">
              <div
                className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-in-out ${scanMode === 'skin' ? 'translate-x-0' : 'translate-x-full ml-1'}`}
              />
              <button
                onClick={() => setScanMode('skin')}
                className={`flex-1 py-3 font-bold text-sm z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${scanMode === 'skin' ? 'text-teal-700' : 'text-gray-500'}`}
              >
                <ScanIcon size={18} /> Single Part (Skin)
              </button>
              <button
                onClick={() => setScanMode('face')}
                className={`flex-1 py-3 font-bold text-sm z-10 transition-colors duration-300 flex items-center justify-center gap-2 ${scanMode === 'face' ? 'text-teal-700' : 'text-gray-500'}`}
              >
                <SplitSquareHorizontal size={18} /> Full Face (3-Views)
              </button>
            </div>

            {/* Side Selector (Only for Face Mode) */}
            {scanMode === 'face' && (
              <div className="max-w-md mx-auto flex gap-2">
                {['left', 'middle', 'right'].map((side) => (
                  <button
                    key={side}
                    onClick={() => { setActiveFaceSide(side); setIsCameraActive(false); }}
                    className={`flex-1 py-2 rounded-xl font-bold text-sm border-2 transition-all capitalize ${activeFaceSide === side
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-transparent bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {side} Side
                    {faceImages[side] && <ShieldCheck size={14} className="inline ml-1 text-teal-500" />}
                  </button>
                ))}
              </div>
            )}

            <div className="relative aspect-square max-w-md mx-auto bg-white rounded-[40px] shadow-2xl overflow-hidden border-8 border-white group">
              {/* Image Preview / Live Camera */}
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : currentViewedImage ? (
                  <img src={currentViewedImage} alt="Skin preview" className="w-full h-full object-cover animate-in fade-in duration-700" />
                ) : (
                  <Camera size={64} className="text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                )}
              </div>

              {/* Scanning Overlay */}
              <AnimatePresence>
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10"
                  >
                    <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-[2px]" />
                    <motion.div
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.8)] z-20"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur px-6 py-3 rounded-full text-teal-700 font-bold flex items-center gap-2 shadow-xl">
                        <RefreshCcw className="animate-spin" size={20} />
                        Analyzing...
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Viewfinder Corners */}
              <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-teal-500 rounded-tl-2xl" />
              <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-teal-500 rounded-tr-2xl" />
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-teal-500 rounded-bl-2xl" />
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-teal-500 rounded-br-2xl" />
            </div>

            <div className="flex flex-col items-center gap-8">
              <div className="flex flex-col gap-4 w-full max-w-md">
                <div className="flex justify-center gap-4">
                  {isCameraActive ? (
                    <>
                      <button
                        onClick={capturePhoto}
                        className="flex-[2] px-6 py-4 rounded-2xl font-bold bg-teal-600 text-white hover:bg-teal-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-100"
                      >
                        <Camera size={20} />
                        Capture
                      </button>
                      <button
                        onClick={stopCamera}
                        className="flex-1 px-4 py-4 rounded-2xl font-bold bg-white border-2 border-rose-100 text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-100"
                      >
                        <CameraOff size={18} />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startCamera}
                      className="flex-1 px-6 py-4 rounded-2xl font-bold bg-white border-2 border-gray-100 text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-gray-100"
                    >
                      <ScanIcon size={20} className="text-teal-500" />
                      Live Camera
                    </button>
                  )}

                  <div className="flex-1 relative">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="file-upload"
                      className="w-full px-6 py-4 rounded-2xl font-bold bg-white border-2 border-gray-100 text-gray-600 hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-gray-100"
                    >
                      <Camera size={20} className="text-teal-500" />
                      Upload
                    </label>
                  </div>
                </div>

                {error && <p className="text-rose-500 font-bold">{error}</p>}

                <button
                  onClick={startScan}
                  disabled={isScanning || isCameraActive}
                  className={`w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl ${isScanning || isCameraActive
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-[#00A884] text-white hover:bg-[#008f70] shadow-teal-600/30'
                    }`}
                >
                  {isScanning ? (
                    <>
                      <RefreshCcw className="animate-spin" size={24} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={24} />
                      Start Full AI Analysis
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400 font-medium">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} /> Privacy Protected
                </span>
                <span className="flex items-center gap-2">
                  <Info size={16} /> Image saved securely to your profile
                </span>
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div className="bg-white p-12 rounded-[40px] shadow-xl border border-teal-50">
              <div className="w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Analysis Complete!</h2>
              <p className="text-gray-500 mb-10">We've identified your skin concerns and calculated your health metrics. Your personalized routine is ready below.</p>

              {/* Detailed Metrics Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 text-left">
                <div className="p-5 bg-teal-50 rounded-2xl border border-teal-100/50">
                  <p className="text-xs font-bold text-teal-600 uppercase mb-1">Detected Issue</p>
                  <p className="text-lg font-bold text-gray-900 capitalize leading-tight">{result?.detected_issue}</p>
                </div>
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Overall Health</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-black text-gray-900 leading-none">{result?.overall_health}%</p>
                    {result?.is_first_scan ? (
                      <span className="text-xs font-bold text-gray-400 mb-0.5">(First Scan)</span>
                    ) : (
                      <span className={`text-xs font-bold mb-0.5 ${result?.improvement >= 0 ? 'text-green-600' : 'text-rose-600'}`}>
                        {result?.improvement >= 0 ? '+' : ''}{result?.improvement}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100/50">
                  <p className="text-xs font-bold text-blue-600 uppercase mb-1">Closeness to Normal</p>
                  <p className="text-2xl font-black text-gray-900 leading-none">{result?.closeness_to_normal}%</p>
                </div>
                <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100/50">
                  <p className="text-xs font-bold text-purple-600 uppercase mb-1">Similarity (Past Scan)</p>
                  <p className="text-2xl font-black text-gray-900 leading-none">{result?.is_first_scan ? 'N/A' : `${result?.similarity}%`}</p>
                </div>
              </div>

              <button
                onClick={addToRecord}
                className="w-full py-5 bg-teal-600 text-white rounded-[24px] font-bold hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 flex items-center justify-center gap-3 group"
              >
                Add Your Record
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <button
              onClick={() => setScanComplete(false)}
              className="text-gray-400 font-bold hover:text-teal-600 transition-colors"
            >
              Start Over
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default QuickScan;
