import React, { useEffect, useRef, useState } from 'react';
import { getLiveClient } from '../services/geminiService';
import { Modality, LiveServerMessage } from '@google/genai';

const AudioVisualizer = ({ isActive }: { isActive: boolean }) => {
  return (
    <div className="flex items-center justify-center space-x-1 h-16">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className={`w-3 bg-primary rounded-sm transition-all duration-75 ${
            isActive ? 'animate-pulse' : 'h-1 opacity-20'
          }`}
          style={{ 
            height: isActive ? `${Math.random() * 40 + 10}px` : '4px',
            boxShadow: isActive ? '0 0 10px #00f0ff' : 'none'
          }}
        />
      ))}
    </div>
  );
};

export const LiveComms: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState("Standby");
  const [error, setError] = useState<string | null>(null);

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // PCM Helpers
  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    
    // Manual base64 encoding for raw PCM
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    return {
      data: b64,
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
    const numChannels = 1;
    const sampleRate = 24000;
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  };

  const connect = async () => {
    setError(null);
    setStatus("Initializing Uplink...");

    try {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const client = getLiveClient();
      
      const sessionPromise = client.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // Kore sounds energetic/tech
          },
          systemInstruction: `
            You are Klutch, an AI Gaming Copilot. 
            CRITICAL: You MUST listen to the user's language and respond in the SAME language.
            User speaks Portuguese -> You speak Portuguese.
            User speaks English -> You speak English.
            Do not stick to English if the user is speaking another language.
            Style: Concise, supportive, high-intensity.
          `,
        },
        callbacks: {
          onopen: () => {
            console.log("Live Session Open");
            setIsConnected(true);
            setStatus("Live Uplink Established");
            
            // Setup Input Stream
            if (!inputAudioContextRef.current) return;
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              setStatus("Klutch Speaking...");
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await decodeAudioData(base64Audio, ctx);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus("Listening...");
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              console.log("Interrupted");
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            setIsConnected(false);
            setStatus("Connection Closed");
          },
          onerror: (e) => {
            console.error(e);
            setError("Connection Error");
            setIsConnected(false);
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError("Failed to access microphone or connect.");
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => s.close()); // Try to close standard way
    }
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setIsConnected(false);
    setStatus("Offline");
  };

  useEffect(() => {
    return () => disconnect();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8 animate-in fade-in duration-500">
      <div className={`relative w-80 h-80 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500 ${isConnected ? 'shadow-neon-blue bg-black' : 'bg-black/50'}`}>
        <div className={`absolute inset-0 rounded-full border border-primary opacity-20 ${isConnected ? 'animate-hud-spin' : ''}`}></div>
        <div className={`absolute inset-4 rounded-full border border-primary opacity-20 ${isConnected ? 'animate-hud-spin' : ''}`} style={{ animationDirection: 'reverse' }}></div>
        
        {isConnected ? (
          <div className="flex flex-col items-center z-10">
             <span className="text-6xl mb-4 text-primary drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">🎙️</span>
             <AudioVisualizer isActive={status === "Klutch Speaking..." || status === "Listening..."} />
          </div>
        ) : (
          <span className="text-6xl text-gray-800">🔇</span>
        )}
      </div>

      <div>
        <h2 className="text-5xl font-display font-bold text-white mb-2 tracking-tighter">LIVE UPLINK</h2>
        <p className={`text-xl font-mono ${error ? 'text-accent' : 'text-primary'}`}>
          STATUS: [{status.toUpperCase()}]
        </p>
      </div>

      {error && <p className="text-red-400 text-sm max-w-md bg-red-900/20 border border-red-500/50 p-2 rounded">{error}</p>}

      {!isConnected ? (
        <button
          onClick={connect}
          className="px-12 py-6 bg-primary text-black font-black text-xl tracking-widest uppercase hover:bg-white hover:shadow-[0_0_30px_#00f0ff] transition-all skew-x-[-10deg] clip-path-polygon"
        >
          <span className="skew-x-[10deg] block">Initialize Voice</span>
        </button>
      ) : (
        <button
          onClick={disconnect}
          className="px-12 py-6 bg-transparent border-2 border-accent text-accent font-black text-xl tracking-widest uppercase hover:bg-accent hover:text-black transition-all skew-x-[-10deg]"
        >
          <span className="skew-x-[10deg] block">Terminate</span>
        </button>
      )}
    </div>
  );
};