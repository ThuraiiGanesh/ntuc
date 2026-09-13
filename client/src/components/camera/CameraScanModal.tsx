import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Sparkles, Zap, Image as ImageIcon, Scan } from 'lucide-react';
import { SAMPLE_HAWKER_DISHES, SampleDish } from '../../data/sampleDishes';
import { VisionResult } from '../../types';
import { api } from '../../services/api';
import { identifyFoodWithGemini, getBestGeminiKey } from '../../services/geminiClient';

interface CameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIdentified: (result: VisionResult, photoUrl: string) => void;
  onOpenManualSearch: () => void;
}

export const CameraScanModal: React.FC<CameraScanModalProps> = ({
  isOpen,
  onClose,
  onIdentified,
  onOpenManualSearch
}) => {
  if (!isOpen) return null;

  const [activeMode, setActiveMode] = useState<'camera' | 'upload' | 'samples'>('samples');
  const [analyzing, setAnalyzing] = useState(false);
  const [scanStatus, setScanStatus] = useState('Initializing AI Vision...');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const statusMessages = [
    'Scanning photo for hawker culinary cues...',
    'Detecting wok-hei charring & rice mound height...',
    'Matching against 80+ Singapore hawker dishes...',
    'Calculating portions & nutritional values...',
  ];

  useEffect(() => {
    if (activeMode === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => { stopCamera(); };
  }, [activeMode, isOpen]);

  const startCamera = async () => {
    setStreamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err: any) {
      console.warn('Camera error:', err);
      setStreamError('Camera not available. Use file upload or sample dishes.');
      setActiveMode('samples');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const captureFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewUrl(dataUrl);
      processImage(dataUrl);
    }
  };

  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const raw = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 1024;
          let { width, height } = img;
          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(raw);
          }
        };
        img.onerror = () => resolve(raw);
        img.src = raw;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressedDataUrl = await compressImageFile(file);
    if (!compressedDataUrl) return;
    setPreviewUrl(compressedDataUrl);
    processImage(compressedDataUrl);
  };

  const handleSampleClick = (sample: SampleDish) => {
    setPreviewUrl(sample.image_url);
    processImage(sample.image_url, sample.id);
  };

  const processImage = async (imgData: string, sampleId?: string) => {
    setAnalyzing(true);
    setScanPhase(0);
    setScanStatus(statusMessages[0]);

    const timers = statusMessages.slice(1).map((msg, i) =>
      setTimeout(() => {
        setScanStatus(msg);
        setScanPhase(i + 1);
      }, 700 + i * 600)
    );

    try {
      let result: VisionResult;

      // If scanning a sample dish, use server/fallback catalog path
      if (sampleId) {
        result = await api.identifyFood({ sampleDishId: sampleId });
      } else if (imgData.startsWith('data:')) {
        // Real camera/upload photo — use client-side Gemini Vision
        const geminiKey = getBestGeminiKey();
        if (geminiKey) {
          setScanStatus('Sending to Google Gemini Vision AI...');
          try {
            const mimeType = imgData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
            result = await identifyFoodWithGemini(imgData, mimeType, geminiKey);
          } catch (geminiErr: any) {
            console.warn('Gemini Vision failed:', geminiErr?.message || geminiErr);
            setScanStatus('Switching to server analysis...');
            result = await api.identifyFood({ imageBase64: imgData });
          }
        } else {
          // No key — use server (which reads GEMINI_API_KEY from Vercel env vars)
          setScanStatus('Using server AI analysis...');
          result = await api.identifyFood({ imageBase64: imgData });
        }
      } else {
        // URL-based image (shouldn't happen for real photos but handle gracefully)
        result = await api.identifyFood({});
      }


      timers.forEach(clearTimeout);
      setAnalyzing(false);
      onIdentified(result, imgData);
    } catch (err) {
      timers.forEach(clearTimeout);
      setScanStatus('Failed to process. Switching to manual search...');
      setTimeout(() => { setAnalyzing(false); onOpenManualSearch(); }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-[#1C1917] text-white w-full max-w-md rounded-3xl overflow-hidden flex flex-col max-h-[92vh] border border-stone-800/80 shadow-2xl relative animate-scale-in">

        {/* ── Top Bar ── */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-stone-800/60 bg-black/20">
          <div className="flex items-center space-x-2.5">
            <div className="relative w-7 h-7 rounded-full flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-rose-500 opacity-20 animate-ping" style={{ animationDuration: '2s' }} />
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative z-10" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-stone-100 leading-none">AI Food Scanner</h3>
              <p className="text-[10px] text-stone-500 font-medium mt-0.5">Singapore Hawker Vision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800/80 flex items-center justify-center text-stone-400 hover:text-white hover:bg-stone-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Mode Tabs ── */}
        <div className="flex bg-stone-900/50 p-1 mx-4 mt-3 rounded-2xl border border-stone-800/50 text-xs font-semibold gap-1">
          {([
            { id: 'samples' as const, icon: <Zap className="w-3.5 h-3.5" />, label: 'Samples' },
            { id: 'camera'  as const, icon: <Camera className="w-3.5 h-3.5" />, label: 'Camera' },
            { id: 'upload'  as const, icon: <Upload className="w-3.5 h-3.5" />, label: 'Upload' },
          ]).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveMode(tab.id);
                if (tab.id === 'upload') fileInputRef.current?.click();
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                activeMode === tab.id
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-pink-500/20 font-extrabold'
                  : 'text-stone-500 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {/* ── Content Area ── */}
        <div className="p-4 flex-1 overflow-y-auto no-scrollbar">

          {/* CAMERA */}
          {activeMode === 'camera' && (
            <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-stone-800 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {/* Viewfinder overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner brackets */}
                {[
                  'top-6 left-6 border-t-2 border-l-2',
                  'top-6 right-6 border-t-2 border-r-2',
                  'bottom-16 left-6 border-b-2 border-l-2',
                  'bottom-16 right-6 border-b-2 border-r-2',
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-7 h-7 border-rose-400 ${cls}`} />
                ))}
                {/* Center guide */}
                <div className="absolute inset-6 bottom-16 border border-white/15 rounded-xl" />
              </div>

              {/* Snap Button */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <button
                  type="button"
                  onClick={captureFromVideo}
                  className="w-16 h-16 rounded-full bg-white p-1.5 shadow-2xl hover:scale-105 active:scale-95 transition-all press-anim"
                >
                  <div className="w-full h-full rounded-full border-4 border-stone-900/20 bg-gradient-to-br from-rose-500 to-pink-500" />
                </button>
              </div>
            </div>
          )}

          {/* SAMPLES */}
          {activeMode === 'samples' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-300 uppercase tracking-wider">
                  Tap a dish to try AI Vision:
                </span>
                <span className="text-[10px] bg-pink-950/80 text-pink-300 px-2 py-0.5 rounded-full border border-pink-900/40 font-bold">
                  Instant Demo
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {SAMPLE_HAWKER_DISHES.map((dish, idx) => (
                  <button
                    key={dish.id}
                    onClick={() => handleSampleClick(dish)}
                    className="group text-left relative aspect-[4/3] rounded-2xl overflow-hidden border border-stone-700/60 hover:border-rose-400 transition-all duration-200 hover:scale-[1.02] shadow-md animate-fade-slide-up press-anim"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <img
                      src={dish.image_url}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2.5 flex flex-col justify-end">
                      <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-widest">
                        {dish.badge}
                      </span>
                      <div className="font-black text-xs text-white leading-tight">{dish.name}</div>
                      <div className="text-[10px] text-stone-400">{dish.name_local}</div>
                    </div>
                    {/* Hover scan indicator */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/30">
                      <div className="w-10 h-10 rounded-full bg-rose-500/90 flex items-center justify-center shadow-lg">
                        <Scan className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* UPLOAD */}
          {activeMode === 'upload' && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[4/3] border-2 border-dashed border-stone-700 hover:border-rose-400 rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 bg-stone-900/30 hover:bg-stone-900/50 group animate-scale-in"
            >
              <div className="w-14 h-14 rounded-2xl bg-stone-800 group-hover:bg-rose-500/20 flex items-center justify-center text-stone-400 group-hover:text-rose-400 mb-4 transition-all duration-200 border border-stone-700 group-hover:border-rose-400/50">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-extrabold text-stone-200">Choose a Food Photo</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">JPEG, PNG, or WebP from your camera roll</p>
              <button
                type="button"
                className="mt-4 px-5 py-2 bg-stone-800 group-hover:bg-rose-500 rounded-xl text-xs font-bold text-stone-200 group-hover:text-white transition-all duration-200"
              >
                Browse Gallery
              </button>
            </div>
          )}
        </div>

        {/* ── AI Scanning Overlay ── */}
        {analyzing && (
          <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            {/* Animated rings */}
            <div className="relative w-44 h-44 flex items-center justify-center mb-6">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="absolute rounded-full border border-rose-500/40"
                  style={{
                    inset: `${i * 12}px`,
                    animation: `ping ${1.5 + i * 0.4}s cubic-bezier(0,0,0.2,1) infinite`,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}

              {/* Center image */}
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-rose-400 shadow-2xl shadow-pink-500/30 relative">
                {previewUrl && (
                  <img src={previewUrl} alt="Analyzing" className="w-full h-full object-cover opacity-70 blur-[0.5px]" />
                )}
                {/* Laser sweep */}
                <div className="radar-laser absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent shadow-[0_0_14px_3px_#F43F5E]" />
                {/* Sparkle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-pink-300 animate-spin-slow" />
                </div>
              </div>
            </div>

            {/* Status text */}
            <h4 className="text-base font-black text-white tracking-tight">Hawker AI Vision</h4>

            {/* Progress steps */}
            <div className="flex space-x-1.5 mt-3 mb-2">
              {statusMessages.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i <= scanPhase ? 'bg-gradient-to-r from-rose-500 to-pink-500 w-8' : 'bg-stone-700 w-3'
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-stone-400 max-w-[220px] leading-relaxed font-medium">
              {scanStatus}
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="p-3 bg-black/30 border-t border-stone-800/50 text-center">
          <button
            type="button"
            onClick={onOpenManualSearch}
            className="text-xs text-stone-500 hover:text-rose-400 font-semibold underline underline-offset-4 transition-colors"
          >
            Search food name manually without photo
          </button>
        </div>
      </div>
    </div>
  );
};
