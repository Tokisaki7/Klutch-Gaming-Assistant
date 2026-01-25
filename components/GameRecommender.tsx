import React, { useState } from 'react';
import { getGameRecommendations } from '../services/geminiService';
import { GameRecommendation } from '../types';

export const GameRecommender: React.FC = () => {
  const [history, setHistory] = useState('');
  const [preferences, setPreferences] = useState('');
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const getRecs = async () => {
    if (!history && !preferences) return;
    setLoading(true);
    setRecommendations([]); // Clear previous
    const recs = await getGameRecommendations(history, preferences);
    setRecommendations(recs);
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
          Live Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-success to-primary">Discovery</span>
        </h2>
        <p className="text-klutch-mute max-w-2xl mx-auto">
          Powered by <span className="text-success font-bold">Google Search Grounding</span>. 
          We find games that are actually trending, released recently, or match your specific niche perfectly.
        </p>
      </div>

      {/* Input Section */}
      <div className="glass-panel p-6 rounded-2xl mb-8 border border-klutch-border/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 font-mono mb-2 uppercase tracking-wide">Play History</label>
            <textarea 
              className="w-full bg-klutch-bg border border-klutch-border rounded-xl p-4 text-white focus:border-success focus:outline-none h-32 resize-none transition-all font-mono text-sm"
              placeholder="E.g. I played Elden Ring for 200 hours, love Stardew Valley..."
              value={history}
              onChange={(e) => setHistory(e.target.value)}
            />
          </div>
          <div>
             <label className="block text-sm text-gray-400 font-mono mb-2 uppercase tracking-wide">Current Mood / Request</label>
             <textarea 
              className="w-full bg-klutch-bg border border-klutch-border rounded-xl p-4 text-white focus:border-success focus:outline-none h-32 resize-none transition-all font-mono text-sm"
              placeholder="E.g. Find me a game released LAST WEEK that is getting good reviews..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button 
            onClick={getRecs}
            disabled={loading || (!history && !preferences)}
            className={`px-8 py-3 font-bold rounded-lg transition-all uppercase tracking-wider flex items-center gap-2 ${
              loading 
                ? 'bg-gray-800 text-gray-500 cursor-wait' 
                : 'bg-success text-black hover:bg-white hover:shadow-[0_0_20px_#00ff9f]'
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Scanning Web...
              </>
            ) : (
              'Initialize Search'
            )}
          </button>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10">
        {recommendations.length === 0 && !loading && (
           <div className="col-span-full text-center text-gray-600 font-mono py-12 border border-dashed border-gray-800 rounded-xl">
             NO DATA DETECTED. INITIATE SEARCH PARAMETERS.
           </div>
        )}
        
        {recommendations.map((game, idx) => (
          <div key={idx} className="bg-black/40 border border-white/10 rounded-2xl p-6 hover:border-success/50 transition-all hover:translate-y-[-5px] group shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <span className="text-6xl">🎮</span>
             </div>
             <div className="flex justify-between items-start mb-4 relative z-10">
               <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-1 rounded uppercase tracking-wider border border-success/20">
                 {game.genre}
               </span>
               <span className="text-white font-mono text-sm font-bold">{game.matchScore}%</span>
             </div>
             <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-success transition-colors relative z-10">
               {game.title}
             </h3>
             <p className="text-sm text-gray-400 leading-relaxed relative z-10 font-sans">
               {game.reason}
             </p>
          </div>
        ))}
      </div>
    </div>
  );
};