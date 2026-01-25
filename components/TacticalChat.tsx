import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { streamStrategyChat } from '../services/geminiService';
import { Message } from '../types';

export const TacticalChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "**Klutch Vision PRO Online.**\n\nNeural Network Connected (Google Search).\nCommand me. Comande-me. Manda.\n*System auto-detects your language.*" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Copilot-style Toggles
  const [conversationStyle, setConversationStyle] = useState<'creative' | 'balanced' | 'precise'>('balanced');
  const [useSearch, setUseSearch] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // If Search is ON, we prioritize that. If OFF, we check conversation style for Thinking.
    const useThinking = !useSearch && conversationStyle !== 'balanced';

    setMessages(prev => [...prev, { role: 'model', text: '', isThinking: useThinking }]);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      let fullText = '';
      
      await streamStrategyChat(history, userMsg.text, useThinking, useSearch, (chunk, grounding) => {
        fullText += chunk;
        setMessages(prev => {
          const newArr = [...prev];
          const last = newArr[newArr.length - 1];
          last.text = fullText;
          if (grounding) {
            // Process grounding chunks into usable source objects
            const uniqueSources = new Map();
            
            grounding.forEach((g: any) => {
              if (g.web?.uri && g.web?.title) {
                uniqueSources.set(g.web.uri, { uri: g.web.uri, title: g.web.title });
              }
            });

            last.groundingUrls = Array.from(uniqueSources.values());
          }
          return newArr;
        });
      });
      
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Error: Neural Link Interrupted. Please check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      
      {/* Dynamic Background Blob */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none transition-colors duration-1000 opacity-20 ${
        useSearch ? 'bg-success' :
        conversationStyle === 'creative' ? 'bg-secondary' :
        conversationStyle === 'precise' ? 'bg-primary' : 
        'bg-blue-600'
      }`}></div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar relative z-10 pb-36">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2`}>
            {msg.role === 'model' && (
              <div className="w-10 h-10 rounded-none border border-primary bg-black/50 flex items-center justify-center text-xs font-bold text-primary mr-4 shrink-0 shadow-neon-blue mt-1 skew-x-[-10deg]">
                <span className="skew-x-[10deg]">AI</span>
              </div>
            )}
            
            <div className={`max-w-[85%] md:max-w-[70%] p-5 shadow-lg backdrop-blur-md border ${
              msg.role === 'user' 
                ? 'bg-primary/10 border-primary/30 text-white rounded-tl-2xl rounded-bl-2xl rounded-tr-sm' 
                : 'glass-panel text-gray-200 rounded-tr-2xl rounded-br-2xl rounded-tl-sm border-white/10'
            }`}>
              {/* Status Indicator inside Message */}
              {msg.isThinking && isLoading && !msg.text && (
                 <div className="flex items-center gap-3 text-xs font-mono text-primary mb-2">
                   <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   </div>
                   <span>CALCULATING STRATEGY...</span>
                 </div>
              )}
              {isLoading && useSearch && msg.role === 'model' && !msg.text && (
                 <div className="flex items-center gap-3 text-xs font-mono text-success mb-2">
                   <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                   <span>SEARCHING GLOBAL NETWORK...</span>
                 </div>
              )}
              
              <div className={`markdown-body text-[16px] leading-relaxed font-sans ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>

              {/* Holographic Source Chips */}
              {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/5">
                  <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mb-2">Verified Intel Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.groundingUrls.map((url, i) => (
                      <a 
                        key={i} 
                        href={url.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group flex items-center gap-2 text-xs bg-black/40 pl-2 pr-3 py-1.5 rounded border border-white/10 hover:border-success hover:bg-success/5 transition-all duration-300 max-w-[250px]"
                      >
                         <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center text-[8px] group-hover:bg-success group-hover:text-black transition-colors">
                           G
                         </div>
                         <span className="truncate text-gray-400 group-hover:text-white font-mono">{url.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Floating) */}
      <div className="absolute bottom-4 left-0 right-0 px-4 md:px-6 z-20">
        <div className="max-w-4xl mx-auto">
          {/* Conversation Style Toggles */}
          <div className="flex justify-center mb-2">
             <div className="bg-black/60 backdrop-blur-xl p-1 rounded-full flex gap-1 border border-white/10 shadow-lg">
                <button 
                  onClick={() => setConversationStyle('creative')}
                  className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${conversationStyle === 'creative' ? 'bg-secondary text-white shadow-neon-purple' : 'text-gray-500 hover:text-white'}`}
                >
                  Creative
                </button>
                <button 
                  onClick={() => setConversationStyle('balanced')}
                  className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${conversationStyle === 'balanced' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  Balanced
                </button>
                <button 
                  onClick={() => setConversationStyle('precise')}
                  className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${conversationStyle === 'precise' ? 'bg-primary text-black shadow-neon-blue' : 'text-gray-500 hover:text-white'}`}
                >
                  Precise
                </button>
             </div>
          </div>

          <div className={`glass-hud rounded-2xl p-2 shadow-2xl relative group transition-all duration-500 ${useSearch ? 'border-success/50 shadow-[0_0_20px_rgba(0,255,159,0.2)]' : 'border-white/10'}`}>
            <div className="relative flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={useSearch ? "Search the gaming web..." : "Initialize Command..."}
                className="w-full bg-transparent text-white p-4 max-h-48 min-h-[56px] focus:outline-none font-mono text-sm resize-none placeholder-gray-600"
                style={{ height: input.length > 50 ? 'auto' : '56px' }}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`mb-2 mr-2 p-3 rounded-xl transition-all duration-300 ${
                  input.trim() 
                   ? useSearch ? 'bg-success text-black hover:bg-white shadow-[0_0_15px_#00ff9f]' : 'bg-primary text-black hover:bg-white shadow-neon-blue' 
                   : 'bg-zinc-900 text-gray-700 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform rotate-0">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </button>
            </div>
            {/* Footer inside input */}
            <div className="px-4 pb-2 flex justify-between items-center border-t border-white/5 pt-2">
               <button 
                 onClick={() => setUseSearch(!useSearch)}
                 className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${useSearch ? 'text-success' : 'text-gray-600'}`}
               >
                 <span className={`w-2 h-2 rounded-sm ${useSearch ? 'bg-success shadow-[0_0_8px_#00ff9f] animate-pulse' : 'bg-gray-800'}`}></span>
                 GOOGLE_SEARCH {useSearch ? '[ACTIVE]' : '[OFFFLINE]'}
               </button>
               <span className="text-[10px] text-gray-600 font-mono">
                 GEMINI 3.0 // {useSearch ? 'FLASH' : 'PRO'}
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};