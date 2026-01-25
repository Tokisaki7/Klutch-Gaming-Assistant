import React, { useState } from 'react';
import { generateGameAsset } from '../services/geminiService';
import { ImageConfig, GeneratedImage } from '../types';
import { t } from '../services/localization';

export const AssetForge: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<ImageConfig>({
    aspectRatio: '1:1',
    imageSize: '1K',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt || isGenerating) return;
    setIsGenerating(true);

    try {
      const imageUrl = await generateGameAsset(prompt, config.aspectRatio, config.imageSize);
      setGallery(prev => [{ url: imageUrl, prompt, date: new Date().toISOString() }, ...prev]);
    } catch (e) {
      alert("Asset generation failed. Try a different prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full bg-[#0a0a0c] overflow-hidden">
      {/* Sidebar Tooling */}
      <div className="w-80 bg-[#111] border-r border-[#222] p-6 flex flex-col gap-6 shadow-2xl z-10">
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-1 flex items-center gap-2">
            <span className="text-secondary">💠</span> {t('forge.title')}
          </h2>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider">ENGINE: GEMINI 3 PRO VISION</p>
        </div>

        <div className="space-y-5 flex-1 overflow-y-auto pr-1">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">{t('forge.prompt')}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-40 bg-[#050505] border border-[#333] rounded-lg p-3 text-white text-sm focus:border-secondary focus:outline-none font-mono resize-none transition-colors"
              placeholder="Describe texture, item, or concept art..."
            />
          </div>

          <div className="space-y-4">
             <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#222]">
                <label className="block text-[10px] font-bold text-gray-500 mb-2">ASPECT RATIO</label>
                <div className="grid grid-cols-3 gap-2">
                   {['1:1', '16:9', '9:16', '4:3', '3:4'].map((ratio) => (
                      <button 
                        key={ratio}
                        onClick={() => setConfig({...config, aspectRatio: ratio as any})}
                        className={`text-xs py-1.5 rounded border transition-all ${config.aspectRatio === ratio ? 'bg-secondary text-white border-secondary' : 'bg-transparent border-[#333] text-gray-500 hover:border-gray-500'}`}
                      >
                        {ratio}
                      </button>
                   ))}
                </div>
             </div>

             <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#222]">
                <label className="block text-[10px] font-bold text-gray-500 mb-2">RESOLUTION</label>
                <div className="flex gap-2 bg-black rounded p-1">
                   {['1K', '2K', '4K'].map((res) => (
                      <button 
                        key={res}
                        onClick={() => setConfig({...config, imageSize: res as any})}
                        className={`flex-1 text-xs py-1 rounded transition-all ${config.imageSize === res ? 'bg-gray-700 text-white' : 'text-gray-600'}`}
                      >
                        {res}
                      </button>
                   ))}
                </div>
             </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt}
          className={`w-full py-4 font-bold tracking-widest uppercase transition-all rounded-lg relative overflow-hidden group ${
            isGenerating 
              ? 'bg-gray-800 cursor-wait text-gray-500' 
              : 'bg-gradient-to-r from-secondary to-indigo-600 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.5)]'
          }`}
        >
          <span className="relative z-10">{isGenerating ? t('forge.generating') : t('forge.generate')}</span>
          {!isGenerating && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>}
        </button>
      </div>

      {/* Main Viewport / Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-8 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5 relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px] pointer-events-none"></div>
        
        {gallery.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-700 border-2 border-dashed border-[#222] rounded-3xl m-4">
            <span className="text-6xl mb-4 opacity-20">💠</span>
            <p className="font-mono text-xs uppercase tracking-[0.2em]">{t('forge.prompt')} TO BEGIN</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {gallery.map((img, idx) => (
              <div key={idx} className="break-inside-avoid relative group bg-[#111] border border-[#222] rounded-xl overflow-hidden hover:border-secondary transition-colors duration-300">
                <img src={img.url} alt="Generated" className="w-full h-auto object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <p className="text-[10px] text-gray-300 font-mono line-clamp-2 mb-2">{img.prompt}</p>
                  <a 
                    href={img.url} 
                    download={`klutch-asset-${Date.now()}.png`}
                    className="self-start px-3 py-1 bg-secondary text-white text-[10px] font-bold rounded uppercase hover:bg-white hover:text-secondary transition-colors"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};