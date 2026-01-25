import React, { useState, useRef } from 'react';
import { analyzeGameScreenshot } from '../services/geminiService';
import { t } from '../services/localization';

export const NexusVision: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image || isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysis('');

    try {
      // Strip base64 header
      const base64Data = image.split(',')[1];
      await analyzeGameScreenshot(base64Data, prompt, (chunk) => {
        setAnalysis(prev => prev + chunk);
      });
    } catch (e) {
      setAnalysis("Error analyzing visual feed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-bold text-white mb-2">
          {t('vision.title')}
        </h2>
        <p className="text-klutch-mute">{t('vision.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0">
        
        {/* Left Col: Upload & Prompt */}
        <div className="flex flex-col gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${
              image ? 'border-cyan-500/50 bg-black' : 'border-klutch-border hover:border-cyan-500 hover:bg-white/5'
            }`}
          >
            {image ? (
              <img src={image} alt="Upload" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-center p-6">
                <span className="text-4xl mb-2 block">👁️</span>
                <p className="text-sm font-bold text-gray-400">{t('vision.drop')}</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            {image && (
               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                 <p className="text-white font-bold">CHANGE IMAGE</p>
               </div>
            )}
          </div>

          <div className="glass-panel p-4 rounded-xl">
             <input
               type="text"
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder="Question about this image? (Optional)"
               className="w-full bg-transparent border-b border-gray-700 p-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
             />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!image || isAnalyzing}
            className={`py-4 rounded-xl font-bold uppercase tracking-widest ${
               !image || isAnalyzing ? 'bg-gray-800 text-gray-600' : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:scale-[1.02] transition-transform'
            }`}
          >
            {isAnalyzing ? t('vision.analyzing') : t('vision.analyze')}
          </button>
        </div>

        {/* Right Col: Analysis */}
        <div className="glass-panel rounded-2xl p-8 overflow-y-auto border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
           <h3 className="font-mono text-cyan-400 mb-6 flex items-center gap-2">
             <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
             NEXUS_ANALYSIS_LOG
           </h3>
           <div className="prose prose-invert max-w-none text-sm leading-relaxed">
             {analysis ? (
               <div className="whitespace-pre-wrap">{analysis}</div>
             ) : (
               <div className="text-gray-600 font-mono text-xs">
                 > {t('vision.waiting')}
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
};