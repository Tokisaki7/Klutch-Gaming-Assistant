import React, { useState } from 'react';
import { runTheoryCraft } from '../services/geminiService';
import { t } from '../services/localization';

export const TheoryCraft: React.FC = () => {
  const [scenario, setScenario] = useState('');
  const [data, setData] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRun = async () => {
    if (!scenario || isProcessing) return;
    setIsProcessing(true);
    setOutput('');

    try {
      await runTheoryCraft(scenario, data, (chunk) => {
        setOutput(prev => prev + chunk);
      });
    } catch (e) {
      setOutput("Error: Neural Link Severed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden">
      <div className="mb-6">
        <h2 className="text-4xl font-display font-bold text-white flex items-center gap-3">
          <span className="text-purple-500">🧠</span> {t('theory.title')}
        </h2>
        <p className="text-klutch-mute mt-2">
          Utilizing <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">thinkingBudget: 32768</span>. 
          {t('theory.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
        {/* Input Sector */}
        <div className="flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col">
            <label className="text-sm font-bold text-gray-400 uppercase mb-2">{t('theory.scenario')}</label>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full bg-klutch-bg/50 border border-klutch-border rounded-xl p-4 text-white focus:border-purple-500 focus:outline-none resize-none flex-1 font-mono text-sm"
              placeholder="e.g. Calculate the effective HP of a Paladin with these stats vs a Boss dealing 5000 Fire damage per second..."
            />
          </div>
          
          <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col">
            <label className="text-sm font-bold text-gray-400 uppercase mb-2">{t('theory.data')}</label>
            <textarea
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-klutch-bg/50 border border-klutch-border rounded-xl p-4 text-white focus:border-purple-500 focus:outline-none resize-none flex-1 font-mono text-sm"
              placeholder="Paste raw CSV, JSON, or item descriptions here..."
            />
          </div>

          <button
            onClick={handleRun}
            disabled={isProcessing || !scenario}
            className={`py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${
              isProcessing 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]'
            }`}
          >
            {isProcessing ? t('theory.thinking') : t('theory.execute')}
          </button>
        </div>

        {/* Output Sector */}
        <div className="glass-panel rounded-2xl p-6 border border-purple-500/30 overflow-hidden flex flex-col relative bg-black/40">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
             <span className="font-mono text-xs text-purple-400">OUTPUT_STREAM</span>
             {isProcessing && <span className="animate-pulse text-xs text-green-400">● COMPUTING</span>}
          </div>
          
          <div className="flex-1 overflow-y-auto font-mono text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">
            {output ? output : <span className="text-gray-600 italic">// Waiting for input parameters...</span>}
          </div>

          {/* Decor */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 blur-3xl pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};