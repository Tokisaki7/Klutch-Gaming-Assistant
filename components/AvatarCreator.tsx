import React, { useState, useEffect } from 'react';
import { generateGameAsset } from '../services/geminiService';
import { AvatarTraits } from '../types';

export const AvatarCreator: React.FC = () => {
  const [traits, setTraits] = useState<AvatarTraits>({
    gender: 'Female',
    race: 'Human',
    style: 'Cyberpunk',
    bodyType: 'Athletic',
    faceShape: 'Heart-shaped',
    hair: 'Neon Blue Bob',
    clothing: 'Tactical Bodysuit',
    accessory: 'Holographic Visor',
    mood: 'Confident',
    action: 'Standing Ready'
  });
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'core' | 'details' | 'style'>('core');

  // Presets State
  const [presets, setPresets] = useState<{name: string, traits: AvatarTraits}[]>(() => {
    const saved = localStorage.getItem('klutch_avatar_presets');
    return saved ? JSON.parse(saved) : [];
  });
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    localStorage.setItem('klutch_avatar_presets', JSON.stringify(presets));
  }, [presets]);

  const handleGenerate = async () => {
    setIsLoading(true);
    const prompt = `Character Design Sheet, High Quality Render.
    Style: ${traits.style}.
    Subject: ${traits.gender} ${traits.race}, ${traits.bodyType} build.
    Face: ${traits.faceShape}, Expression: ${traits.mood}.
    Hair: ${traits.hair}.
    Apparel: ${traits.clothing}.
    Accessories: ${traits.accessory}.
    Action/Pose: ${traits.action}.
    Details: 8k resolution, cinematic lighting, highly detailed textures, masterpiece.`;
    
    try {
      const url = await generateGameAsset(prompt, "1:1", "1K");
      setAvatarUrl(url);
    } catch (e) {
      alert("Failed to generate avatar");
    } finally {
      setIsLoading(false);
    }
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    setPresets([...presets, { name: presetName, traits: { ...traits } }]);
    setPresetName('');
  };

  const loadPreset = (p: AvatarTraits) => {
    setTraits({ ...p });
  };

  const deletePreset = (idx: number) => {
    const newPresets = [...presets];
    newPresets.splice(idx, 1);
    setPresets(newPresets);
  };

  const InputField = ({ label, value, onChange, placeholder }: any) => (
    <div className="mb-4">
      <label className="block text-xs font-medium text-klutch-mute mb-2 uppercase tracking-wide">{label}</label>
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-klutch-bg border border-klutch-border rounded-lg p-3 text-white focus:outline-none focus:border-klutch-primary transition-colors text-sm"
        placeholder={placeholder}
      />
    </div>
  );

  const SelectGroup = ({ label, value, options, onChange }: any) => (
    <div className="mb-4">
      <label className="block text-xs font-medium text-klutch-mute mb-2 uppercase tracking-wide">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 truncate ${
              value === opt 
                ? 'bg-klutch-primary border-klutch-primary text-white shadow-lg shadow-klutch-primary/25' 
                : 'bg-klutch-card border-klutch-border text-gray-400 hover:border-gray-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-hidden">
      {/* Controls Column */}
      <div className="lg:col-span-5 flex flex-col h-full gap-4 overflow-hidden">
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-full overflow-hidden border border-klutch-border/50 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <h2 className="text-2xl font-display font-bold text-white mb-4 flex items-center justify-between">
            <span className="text-transparent bg-clip-text bg-gradient-main drop-shadow-sm">Avatar Creator</span>
            <div className="flex bg-black/40 rounded-full p-1 border border-white/10">
              <button 
                onClick={() => setActiveTab('core')}
                className={`w-3 h-3 rounded-full mx-1 transition-all ${activeTab === 'core' ? 'bg-klutch-primary shadow-[0_0_8px_#ff5f1f]' : 'bg-gray-700 hover:bg-gray-600'}`}
                title="Body & Species"
              />
              <button 
                 onClick={() => setActiveTab('details')}
                 className={`w-3 h-3 rounded-full mx-1 transition-all ${activeTab === 'details' ? 'bg-klutch-primary shadow-[0_0_8px_#ff5f1f]' : 'bg-gray-700 hover:bg-gray-600'}`}
                 title="Gear & Hair"
              />
               <button 
                 onClick={() => setActiveTab('style')}
                 className={`w-3 h-3 rounded-full mx-1 transition-all ${activeTab === 'style' ? 'bg-klutch-primary shadow-[0_0_8px_#ff5f1f]' : 'bg-gray-700 hover:bg-gray-600'}`}
                 title="Vibe & Style"
              />
            </div>
          </h2>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {activeTab === 'core' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                 <SelectGroup 
                  label="Race / Species" 
                  value={traits.race} 
                  options={['Human', 'Elf', 'Cyborg', 'Orc', 'Alien', 'Undead']} 
                  onChange={(v: string) => setTraits({...traits, race: v})} 
                />
                <SelectGroup 
                  label="Gender" 
                  value={traits.gender} 
                  options={['Male', 'Female', 'Non-binary', 'Robot']} 
                  onChange={(v: string) => setTraits({...traits, gender: v})} 
                />
                <SelectGroup 
                  label="Body Type" 
                  value={traits.bodyType} 
                  options={['Athletic', 'Slim', 'Muscular', 'Heavy', 'Cybernetic']} 
                  onChange={(v: string) => setTraits({...traits, bodyType: v})} 
                />
                <InputField 
                   label="Face Shape / Features"
                   value={traits.faceShape}
                   onChange={(v: string) => setTraits({...traits, faceShape: v})}
                   placeholder="E.g. Sharp jawline, scarred, soft..."
                />
              </div>
            )}

            {activeTab === 'details' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                 <InputField 
                   label="Hair Style & Color"
                   value={traits.hair}
                   onChange={(v: string) => setTraits({...traits, hair: v})}
                   placeholder="E.g. Neon pink mohawk..."
                />
                <InputField 
                   label="Clothing / Armor"
                   value={traits.clothing}
                   onChange={(v: string) => setTraits({...traits, clothing: v})}
                   placeholder="E.g. Heavy Power Armor..."
                />
                <InputField 
                   label="Accessories"
                   value={traits.accessory}
                   onChange={(v: string) => setTraits({...traits, accessory: v})}
                   placeholder="E.g. Cybernetic eye, Cape..."
                />
              </div>
            )}

            {activeTab === 'style' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                <SelectGroup 
                  label="Art Style" 
                  value={traits.style} 
                  options={['Cyberpunk', 'Fantasy', 'Realistic', 'Anime', 'Retro Pixel', 'Oil Painting']} 
                  onChange={(v: string) => setTraits({...traits, style: v})} 
                />
                 <SelectGroup 
                  label="Mood / Expression" 
                  value={traits.mood} 
                  options={['Serious', 'Happy', 'Angry', 'Mysterious', 'Crazy', 'Stoic']} 
                  onChange={(v: string) => setTraits({...traits, mood: v})} 
                />
                <InputField 
                   label="Action / Animation Pose"
                   value={traits.action}
                   onChange={(v: string) => setTraits({...traits, action: v})}
                   placeholder="E.g. Casting a spell, Aiming rifle, Crossing arms..."
                />
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-klutch-border">
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setActiveTab('core')} 
                className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${activeTab === 'core' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Body
              </button>
              <button 
                onClick={() => setActiveTab('details')} 
                className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${activeTab === 'details' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Gear
              </button>
              <button 
                onClick={() => setActiveTab('style')} 
                className={`flex-1 py-2 text-xs font-bold uppercase rounded transition-colors ${activeTab === 'style' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Vibe
              </button>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-main rounded-xl font-bold text-white shadow-[0_0_20px_rgba(157,78,221,0.3)] hover:shadow-[0_0_30px_rgba(255,95,31,0.5)] hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 tracking-wider uppercase border border-white/10"
            >
              {isLoading ? 'Synthesizing...' : 'Initialize Generation'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview & Presets Column */}
      <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 relative glass-panel rounded-3xl overflow-hidden border border-klutch-border flex items-center justify-center shadow-2xl group bg-black/20">
           {avatarUrl ? (
             <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover animate-in fade-in duration-700" />
           ) : (
             <div className="text-center p-8 opacity-30">
                <div className="text-6xl mb-4 animate-bounce">👤</div>
                <p className="font-display text-xl tracking-widest uppercase">Awaiting Input</p>
             </div>
           )}
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-glow opacity-30 pointer-events-none"></div>
           
           {avatarUrl && (
             <a 
               href={avatarUrl} 
               download={`klutch-avatar-${Date.now()}.png`}
               className="absolute bottom-6 right-6 px-6 py-3 bg-black/80 text-white rounded-full text-xs font-bold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-klutch-primary border border-white/10 hover:scale-105"
             >
               DOWNLOAD 4K
             </a>
           )}
        </div>

        {/* Presets Manager */}
        <div className="glass-panel rounded-2xl p-4 h-1/3 flex flex-col border border-klutch-border/30">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-klutch-secondary rounded-full"></span>
               Database
             </h3>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 value={presetName}
                 onChange={(e) => setPresetName(e.target.value)}
                 placeholder="CONFIG_NAME"
                 className="bg-klutch-bg border border-klutch-border rounded px-3 py-1 text-xs text-white w-32 focus:outline-none focus:border-klutch-primary placeholder-gray-600 font-mono"
               />
               <button 
                 onClick={savePreset}
                 disabled={!presetName.trim()}
                 className="px-4 py-1 bg-klutch-secondary/20 border border-klutch-secondary text-klutch-secondary text-xs rounded hover:bg-klutch-secondary hover:text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 SAVE
               </button>
             </div>
          </div>
          
          <div className="flex-1 overflow-x-auto whitespace-nowrap pb-2 flex gap-3 custom-scrollbar">
            {presets.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center border border-dashed border-gray-800 rounded-xl">
                <p className="text-xs text-gray-600 italic font-mono">NO DATA PRESETS FOUND</p>
              </div>
            ) : (
              presets.map((p, idx) => (
                <div key={idx} className="inline-block w-48 bg-klutch-bg/80 border border-klutch-border rounded-xl p-3 hover:border-klutch-primary transition-all hover:shadow-[0_0_15px_rgba(255,95,31,0.1)] group relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-xs truncate w-32 font-mono" title={p.name}>{p.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePreset(idx); }}
                      className="text-gray-600 hover:text-red-500 w-4 h-4 flex items-center justify-center rounded hover:bg-red-500/10"
                    >
                      ×
                    </button>
                  </div>
                  <div className="text-[10px] text-gray-500 mb-3 space-y-0.5 font-mono opacity-70">
                     <p className="truncate">{p.traits.race} / {p.traits.gender}</p>
                     <p className="truncate text-klutch-secondary">{p.traits.style}</p>
                  </div>
                  <button 
                    onClick={() => loadPreset(p.traits)}
                    className="w-full py-1.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-300 hover:bg-white hover:text-black font-bold transition-colors uppercase tracking-wider"
                  >
                    Load Config
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};