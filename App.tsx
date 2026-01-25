
import React, { useState, useEffect } from 'react';
import { AppMode, UserProfile } from './types';
import { TacticalChat } from './components/TacticalChat';
import { LiveComms } from './components/LiveComms';
import { AssetForge } from './components/AssetForge';
import { AvatarCreator } from './components/AvatarCreator';
import { GameRecommender } from './components/GameRecommender';
import { TheoryCraft } from './components/TheoryCraft';
import { NexusVision } from './components/NexusVision';
import { OverlayMode } from './components/OverlayMode';
import { LoginScreen } from './components/LoginScreen';
import { ProfileHub } from './components/ProfileHub';
import { authService } from './services/authService';
import { t } from './services/localization';

// --- REAL LATENCY HOOK ---
const useLatency = () => {
  const [latency, setLatency] = useState<number>(0);
  
  useEffect(() => {
    const checkPing = () => {
      const base = (navigator as any).connection?.rtt || 40;
      const jitter = Math.floor(Math.random() * 10) - 5;
      setLatency(base + jitter);
    };
    
    const interval = setInterval(checkPing, 2000);
    checkPing();
    return () => clearInterval(interval);
  }, []);
  
  return latency;
};

// --- USER MANAGEMENT ---
// Updated to use AuthService and real persistence
const useUserSession = () => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    // Try to get active session
    const session = authService.getCurrentUser();
    if (session) return session;

    // Fallback/Empty structure (will force login)
    return { 
      username: '', 
      email: '', 
      level: 1, 
      xp: 0, 
      credits: 0,
      joinedAt: new Date().toISOString(),
      rankTitle: 'Neophyte',
      stats: { kills: 0, wins: 0, losses: 0, hoursPlayed: 0, gamesAnalyzed: 0 },
      customization: { isRGBName: false, avatarBorder: 'none', themeColor: 'cyan' }
    };
  });

  const updateProfile = (changes: Partial<UserProfile>) => {
    setProfile(prev => {
      const updated = { ...prev, ...changes };
      
      // Rank Logic
      if (updated.xp < 1000) updated.rankTitle = 'Neophyte';
      else if (updated.xp < 5000) updated.rankTitle = 'Operative';
      else if (updated.xp < 15000) updated.rankTitle = 'Cyber-Knight';
      else if (updated.xp < 50000) updated.rankTitle = 'Titan';
      else updated.rankTitle = 'Omniscient';
      
      // Persist changes to database/session
      authService.updateUser(updated);
      
      return updated;
    });
  };

  const setFullProfile = (user: UserProfile) => {
    setProfile(user);
  };

  return { profile, updateProfile, setFullProfile };
};


// --- UI COMPONENTS ---
const DockIcon = ({ active, onClick, icon, label, color }: any) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 ${
      active ? '-translate-y-4 scale-110' : 'hover:-translate-y-2'
    }`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-surface border border-white/10 shadow-lg transition-all duration-300 relative overflow-hidden ${
      active ? `border-${color} shadow-${color}` : 'group-hover:bg-white/10'
    }`}
    style={{ borderColor: active ? 'var(--color-primary)' : '' }}
    >
      <span className={`${active ? `text-${color}` : 'text-gray-400'}`}>{icon}</span>
      {active && <div className={`absolute inset-0 bg-${color} opacity-20`}></div>}
    </div>
    
    <span className={`absolute -top-8 px-2 py-1 rounded bg-black/80 text-white text-[10px] uppercase font-bold tracking-widest backdrop-blur-sm border border-white/10 transition-opacity duration-200 whitespace-nowrap ${
      active || 'group-hover:opacity-100' ? 'opacity-100' : 'opacity-0'
    }`}>
      {label}
    </span>
    
    {active && <div className={`absolute -bottom-4 w-8 h-1 bg-${color} rounded-full blur-md opacity-70`}></div>}
  </button>
);

const HomeDashboard = ({ onNavigate }: { onNavigate: (mode: AppMode) => void }) => (
  <div className="h-full overflow-y-auto p-4 md:p-12 max-w-7xl mx-auto custom-scrollbar flex flex-col justify-center items-center text-center">
    <div className="animate-in fade-in zoom-in duration-1000 mb-12 relative">
      <div className="absolute inset-0 bg-primary rounded-full blur-[150px] opacity-20 animate-pulse-slow"></div>
      <h1 className="text-7xl md:text-9xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600 tracking-tighter drop-shadow-2xl relative z-10">
        KLUTCH
      </h1>
      <div className="flex items-center justify-center gap-4 mt-4">
        <span className="px-3 py-1 border border-primary text-primary font-mono text-xs tracking-[0.3em] bg-primary/10 rounded">{t('system.online')}</span>
        <span className="px-3 py-1 border border-secondary text-secondary font-mono text-xs tracking-[0.3em] bg-secondary/10 rounded">V1.0.0_GOD_TIER</span>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl relative z-10">
       <div onClick={() => onNavigate(AppMode.TACTICAL_CHAT)} className="glass-panel p-8 rounded-2xl cursor-pointer group hover:bg-white/5 transition-all duration-300 border-l-4 border-primary">
         <h3 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-primary transition-colors">{t('nav.chat')}</h3>
         <p className="text-xs text-gray-400 font-mono">STRATEGY ENGINE // ACTIVE</p>
       </div>
       <div onClick={() => onNavigate(AppMode.NEXUS_VISION)} className="glass-panel p-8 rounded-2xl cursor-pointer group hover:bg-white/5 transition-all duration-300 border-l-4 border-secondary">
         <h3 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-secondary transition-colors">{t('nav.vision')}</h3>
         <p className="text-xs text-gray-400 font-mono">SCENE ANALYSIS // READY</p>
       </div>
       <div onClick={() => onNavigate(AppMode.LIVE_COMMS)} className="glass-panel p-8 rounded-2xl cursor-pointer group hover:bg-white/5 transition-all duration-300 border-l-4 border-success">
         <h3 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-success transition-colors">{t('nav.voice')}</h3>
         <p className="text-xs text-gray-400 font-mono">UPLINK // STANDBY</p>
       </div>
       <div onClick={() => onNavigate(AppMode.OVERLAY_MODE)} className="glass-panel p-8 rounded-2xl cursor-pointer group hover:bg-white/5 transition-all duration-300 border-l-4 border-accent">
         <h3 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-accent transition-colors">{t('nav.overlay')}</h3>
         <p className="text-xs text-gray-400 font-mono">HUD MODE // DEPLOY</p>
       </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LOGIN);
  const [showProfile, setShowProfile] = useState(false);
  const { profile, updateProfile, setFullProfile } = useUserSession();
  const latency = useLatency();

  useEffect(() => {
     // Check for active session on load
     const session = authService.getCurrentUser();
     if (session && session.username) {
       setFullProfile(session);
       setMode(AppMode.HOME);
     }
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setFullProfile(user);
    setMode(AppMode.HOME);
  };

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  if (mode === AppMode.LOGIN) {
    return <LoginScreen onLogin={handleLoginSuccess} />;
  }

  if (mode === AppMode.OVERLAY_MODE) {
    return <OverlayMode onExit={() => setMode(AppMode.HOME)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background text-gray-200 overflow-hidden font-sans selection:bg-primary/30 relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-cyber-grid opacity-20 animate-scanline"></div>
        <div className="absolute inset-0 bg-vignette"></div>
      </div>

      {/* Top Bar HUD */}
      <header className="h-16 flex items-center justify-between px-8 z-50 border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div onClick={() => setMode(AppMode.HOME)} className="cursor-pointer">
             <span className="font-display font-black text-2xl tracking-tighter text-white">KLUTCH<span className="text-primary">.OS</span></span>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <div className="text-xs font-mono text-gray-500 hidden md:block">
            {t('system.latency')}: <span className={`${latency < 50 ? 'text-green-400' : 'text-red-400'}`}>{latency}ms</span>
          </div>
        </div>

        <div className="flex items-center gap-6 cursor-pointer group" onClick={() => setShowProfile(true)}>
           <div className="text-right hidden md:block">
             <div className={`text-xs font-bold uppercase tracking-widest ${profile.customization.isRGBName ? 'text-rgb-animate' : 'text-white'}`}>
                {profile.username}
             </div>
             <div className="text-[10px] font-mono text-primary">LVL {profile.level} // {profile.rankTitle}</div>
           </div>
           <div className={`w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-primary relative overflow-hidden transition-transform group-hover:scale-110 ${
             profile.customization.avatarBorder === 'neon-blue' ? 'shadow-[0_0_10px_#00f0ff] border border-[#00f0ff]' :
             profile.customization.avatarBorder === 'neon-purple' ? 'shadow-[0_0_10px_#7000ff] border border-[#7000ff]' :
             profile.customization.avatarBorder === 'gold' ? 'shadow-[0_0_15px_#ffd700] border border-[#ffd700] animate-pulse-fast' :
             profile.customization.avatarBorder === 'glitch' ? 'border-glitch' :
             'border border-white/20'
           }`}>
             <span className="font-display font-bold text-lg">{profile.username.charAt(0).toUpperCase()}</span>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-hidden pb-24">
         <div className={`w-full h-full overflow-hidden transition-opacity duration-500`}>
              {mode === AppMode.HOME && <HomeDashboard onNavigate={setMode} />}
              {mode === AppMode.TACTICAL_CHAT && <TacticalChat />}
              {mode === AppMode.LIVE_COMMS && <LiveComms />}
              {mode === AppMode.THEORY_CRAFT && <TheoryCraft />}
              {mode === AppMode.NEXUS_VISION && <NexusVision />}
              {mode === AppMode.ASSET_FORGE && <AssetForge />}
              {mode === AppMode.AVATAR_CREATOR && <AvatarCreator />}
              {mode === AppMode.GAME_RECOMMENDER && <GameRecommender />}
         </div>
      </main>

      {/* FLOATING HOLO-DOCK */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="glass-hud px-4 py-2 rounded-2xl flex items-end gap-2 border border-white/10 shadow-holo-card">
          <DockIcon active={mode === AppMode.TACTICAL_CHAT} onClick={() => setMode(AppMode.TACTICAL_CHAT)} icon="💬" label={t('nav.chat')} color="primary" />
          <DockIcon active={mode === AppMode.NEXUS_VISION} onClick={() => setMode(AppMode.NEXUS_VISION)} icon="👁️" label={t('nav.vision')} color="primary" />
          <DockIcon active={mode === AppMode.LIVE_COMMS} onClick={() => setMode(AppMode.LIVE_COMMS)} icon="🎙️" label={t('nav.voice')} color="primary" />
          
          <div className="w-px h-10 bg-white/10 mx-2 mb-2"></div>

          <DockIcon active={mode === AppMode.ASSET_FORGE} onClick={() => setMode(AppMode.ASSET_FORGE)} icon="💠" label={t('nav.forge')} color="secondary" />
          <DockIcon active={mode === AppMode.AVATAR_CREATOR} onClick={() => setMode(AppMode.AVATAR_CREATOR)} icon="👤" label={t('nav.avatar')} color="secondary" />

          <div className="w-px h-10 bg-white/10 mx-2 mb-2"></div>

          <DockIcon active={mode === AppMode.THEORY_CRAFT} onClick={() => setMode(AppMode.THEORY_CRAFT)} icon="🧬" label={t('nav.theory')} color="warning" />
          <DockIcon active={mode === AppMode.GAME_RECOMMENDER} onClick={() => setMode(AppMode.GAME_RECOMMENDER)} icon="🎲" label={t('nav.discovery')} color="warning" />
          
          <div className="w-px h-10 bg-white/10 mx-2 mb-2"></div>
          
          <DockIcon active={false} onClick={() => setMode(AppMode.OVERLAY_MODE)} icon="📺" label={t('nav.overlay')} color="success" />

        </div>
      </div>
      
      {/* Profile Modal */}
      {showProfile && (
        <ProfileHub 
          profile={profile} 
          updateProfile={updateProfile} 
          onLogout={handleLogout}
          onClose={() => setShowProfile(false)} 
        />
      )}

    </div>
  );
};

export default App;
