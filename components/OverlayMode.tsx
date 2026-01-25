import React, { useState, useEffect, useRef } from 'react';
import { getLiveClient } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';

export const OverlayMode: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [crosshairType, setCrosshairType] = useState<'dot' | 'cross' | 'circle' | 'none'>('cross');
  const [fps, setFps] = useState(144);
  const [ping, setPing] = useState(24);
  const [isStealth, setIsStealth] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Real Live API State
  const [connectionStatus, setConnectionStatus] = useState<'OFFLINE' | 'CONNECTING' | 'ONLINE' | 'ERROR'>('OFFLINE');
  const [currentCaption, setCurrentCaption] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // --- AUDIO HELPERS (PCM PROCESSING) ---
  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const decodeAudioData = async (base64String: string, ctx: AudioContext) => {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const dataInt16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  // --- LIVE CONNECTION LOGIC ---
  const initLiveSession = async () => {
    try {
      setConnectionStatus('CONNECTING');
      
      // Init Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Get Mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const client = getLiveClient();
      const sessionPromise = client.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          // Enable transcription to show captions in HUD
          outputAudioTranscription: { model: "gemini-2.5-flash-native-audio-preview-12-2025" },
          systemInstruction: `
            You are Klutch, a Tactical Gaming HUD AI.
            ROLE: Military Operator / Cyberpunk AI.
            INSTRUCTION: Listen to the user. Provide extremely short, tactical, and precise responses.
            Do not use long sentences. Keep it under 15 words.
            Style: "Enemy spotted.", "Moving to sector.", "Affirmative."
            Language: Detect user language and match it exactly.
          `,
        },
        callbacks: {
          onopen: () => {
            setConnectionStatus('ONLINE');
            
            // Input Pipeline
            if (!inputAudioContextRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Simple volume meter calc
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i]*inputData[i];
              setAudioLevel(Math.sqrt(sum/inputData.length) * 100);

              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // 1. Handle Audio
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(base64Audio, ctx);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              
              source.onended = () => sourcesRef.current.delete(source);
            }

            // 2. Handle Transcription (Captions)
            // Note: The API sends transcription parts. We update the HUD with the latest text.
            // Check for output transcription
            const transcription = msg.serverContent?.outputTranscription?.text;
            if (transcription) {
               setCurrentCaption(prev => {
                  // Keep only last 100 chars or reset if pause
                  const newText = prev + transcription;
                  return newText.length > 150 ? transcription : newText;
               });
               // Clear caption after 5 seconds of silence
               const id = setTimeout(() => setCurrentCaption(""), 5000);
               return () => clearTimeout(id);
            }
          },
          onclose: () => setConnectionStatus('OFFLINE'),
          onerror: (e) => {
            console.error(e);
            setConnectionStatus('ERROR');
          }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (e) {
      console.error("Overlay Audio Error:", e);
      setConnectionStatus('ERROR');
    }
  };

  // Cleanup
  useEffect(() => {
    // Start session immediately
    initLiveSession();

    // FPS / Ping Simulation (Background visuals only)
    const interval = setInterval(() => {
      setFps(prev => Math.max(60, Math.min(240, prev + Math.floor(Math.random() * 20) - 10)));
      setPing(prev => Math.max(10, Math.min(80, prev + Math.floor(Math.random() * 10) - 5)));
    }, 1000);

    return () => {
      clearInterval(interval);
      if (sessionRef.current) sessionRef.current.then((s: any) => s.close());
      if (inputAudioContextRef.current) inputAudioContextRef.current.close();
      if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    };
  }, []);


  // --- MINIMIZED STATE ---
  if (isMinimized) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-black/80 backdrop-blur-md border border-primary/50 rounded-full px-6 py-2 flex items-center gap-4 shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-in fade-in slide-in-from-top-4 cursor-grab">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'ONLINE' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-xs font-bold text-white tracking-wider">REC</span>
        </div>
        <div className="h-4 w-px bg-white/20"></div>
        <span className="text-xs text-primary font-mono">
          {connectionStatus === 'ONLINE' ? 'AI LISTENING' : connectionStatus}
        </span>
        <button 
          onClick={() => setIsMinimized(false)}
          className="ml-2 text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded transition-colors"
        >
          MAXIMIZAR
        </button>
      </div>
    );
  }

  // --- FULL OVERLAY STATE ---
  return (
    <div className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-300 overflow-hidden ${isStealth ? 'opacity-30' : 'opacity-100'}`}>
      
      {/* 1. PERIPHERAL EFFECTS */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/80"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] z-0 bg-[length:100%_4px] pointer-events-none opacity-50"></div>

      {/* 2. TOP CONTROLS (Pointer Events Auto to allow clicking) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-auto">
         {/* Voice Status Indicator */}
         <div className="flex flex-col gap-1">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border bg-black/60 backdrop-blur-sm ${
              connectionStatus === 'ONLINE' ? 'border-green-500/50' : 
              connectionStatus === 'ERROR' ? 'border-red-500/50' : 'border-yellow-500/50'
            }`}>
               <span className={`w-2 h-2 rounded-full ${
                 connectionStatus === 'ONLINE' ? 'bg-green-500 animate-pulse' : 
                 connectionStatus === 'ERROR' ? 'bg-red-500' : 'bg-yellow-500'
               }`}></span>
               <span className={`text-[10px] font-bold tracking-widest ${
                 connectionStatus === 'ONLINE' ? 'text-green-400' : 
                 connectionStatus === 'ERROR' ? 'text-red-400' : 'text-yellow-400'
               }`}>
                 {connectionStatus === 'CONNECTING' ? 'ESTABELECENDO UPLINK...' : 
                  connectionStatus === 'ONLINE' ? 'VOICE COMMS: SECURE' : 
                  connectionStatus === 'ERROR' ? 'LINK FAILED' : 'OFFLINE'}
               </span>
            </div>
            {/* Audio Viz Bars */}
            {connectionStatus === 'ONLINE' && (
              <div className="flex items-center gap-1 px-3 h-2">
                 {[1,2,3,4,5].map(i => (
                   <div key={i} className="w-1 bg-primary transition-all duration-75" style={{ 
                     height: `${Math.max(2, Math.min(10, audioLevel * Math.random() * 5))}px`,
                     opacity: audioLevel > 1 ? 1 : 0.3
                   }}></div>
                 ))}
              </div>
            )}
         </div>

         {/* Window Controls */}
         <div className="flex gap-2">
            <button 
              onClick={() => setIsMinimized(true)}
              className="px-4 py-2 bg-black/60 border border-white/20 text-white text-[10px] font-bold rounded hover:bg-white/10 transition-all uppercase"
            >
              Minimizar
            </button>
            <button 
              onClick={onExit}
              className="px-4 py-2 bg-red-900/60 border border-red-500/50 text-white text-[10px] font-bold rounded hover:bg-red-600 transition-all uppercase shadow-[0_0_10px_rgba(255,0,0,0.2)]"
            >
              Encerrar
            </button>
         </div>
      </div>

      {/* 3. CENTER CROSSHAIR */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
         {crosshairType === 'dot' && <div className="w-1 h-1 bg-green-400 rounded-full shadow-[0_0_4px_#00ff00]"></div>}
         {crosshairType === 'cross' && (
           <div className="relative opacity-80">
             <div className="w-4 h-0.5 bg-green-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
             <div className="h-4 w-0.5 bg-green-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
           </div>
         )}
         {crosshairType === 'circle' && <div className="w-6 h-6 border border-green-400 rounded-full shadow-[0_0_4px_#00ff00]"></div>}
      </div>

      {/* 4. LEFT HUD: SYSTEM STATS */}
      <div className="absolute top-1/3 left-8 w-40 space-y-4">
         <div className="bg-black/40 p-3 border-l-2 border-primary backdrop-blur-md">
            <div className="space-y-1">
               <div className="flex justify-between text-[10px] font-mono">
                 <span className="text-gray-400">FPS</span>
                 <span className="text-green-400 font-bold">{fps}</span>
               </div>
               <div className="flex justify-between text-[10px] font-mono">
                 <span className="text-gray-400">LATENCY</span>
                 <span className={`${ping < 40 ? 'text-green-400' : 'text-red-400'} font-bold`}>{ping}ms</span>
               </div>
            </div>
         </div>
      </div>

      {/* 5. RIGHT HUD: CONTROLS (Pointer Auto) */}
      <div className="absolute top-1/3 right-8 flex flex-col items-end gap-2 pointer-events-auto">
         <div className="flex flex-col gap-1 bg-black/40 p-2 rounded border border-white/10 backdrop-blur-sm">
            <label className="text-[8px] text-gray-500 uppercase font-bold text-center">Mira</label>
            <div className="flex gap-1">
               <button onClick={() => setCrosshairType('dot')} className={`w-6 h-6 border rounded ${crosshairType==='dot' ? 'border-primary bg-primary/20' : 'border-white/10 bg-black/40'} text-[8px] text-white`}>•</button>
               <button onClick={() => setCrosshairType('cross')} className={`w-6 h-6 border rounded ${crosshairType==='cross' ? 'border-primary bg-primary/20' : 'border-white/10 bg-black/40'} text-[8px] text-white`}>+</button>
               <button onClick={() => setCrosshairType('circle')} className={`w-6 h-6 border rounded ${crosshairType==='circle' ? 'border-primary bg-primary/20' : 'border-white/10 bg-black/40'} text-[8px] text-white`}>○</button>
            </div>
         </div>
         <button 
           onClick={() => setIsStealth(!isStealth)}
           className={`px-3 py-1 text-[9px] font-bold uppercase rounded border transition-all ${isStealth ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : 'bg-black/40 text-gray-400 border-white/10'}`}
         >
           {isStealth ? 'STEALTH ON' : 'STEALTH OFF'}
         </button>
      </div>

      {/* 6. BOTTOM: REAL-TIME CAPTIONS (Subtitle) */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none">
        <div className={`transition-all duration-300 transform ${currentCaption ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-black/70 backdrop-blur-md border-x-4 border-primary px-8 py-3 rounded-lg max-w-2xl text-center shadow-[0_0_30px_rgba(0,0,0,0.8)]">
             <div className="flex items-center justify-center gap-2 mb-1">
               <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
               <span className="text-[9px] text-primary font-bold tracking-widest uppercase">KLUTCH AI (LIVE TRANSCRIPT)</span>
             </div>
             <p className="text-lg md:text-xl font-display text-white font-medium drop-shadow-md leading-tight">
               "{currentCaption}"
             </p>
          </div>
        </div>
      </div>

    </div>
  );
};