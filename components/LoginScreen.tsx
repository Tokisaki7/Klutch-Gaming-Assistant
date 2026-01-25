
import React, { useState } from 'react';
import { t } from '../services/localization';
import { authService } from '../services/authService';
import { UserProfile } from '../types';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearForm = () => {
    setError(null);
    setSuccessMsg(null);
    setEmail('');
    setUsername('');
    setPassword('');
  };

  const switchView = (newView: 'login' | 'register' | 'forgot') => {
    clearForm();
    setView(newView);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('auth.error_miss'));
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      // Email field acts as Identifier (Email or Username)
      const user = await authService.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(t('auth.error_cred'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      setError(t('auth.error_miss'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.register(username, email, password);
      setSuccessMsg(t('auth.success_reg'));
      setTimeout(() => {
        switchView('login');
      }, 2000);
    } catch (err: any) {
      if (err.message === 'DUPLICATE_ENTRY') {
        setError(t('auth.error_dup'));
      } else {
        setError('REGISTRATION FAILED');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError(t('auth.error_miss'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
      setSuccessMsg(t('auth.success_reset'));
      setTimeout(() => switchView('login'), 3000);
    } catch (err) {
      setError('ERROR SENDING EMAIL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-black relative overflow-hidden font-sans">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#050505] to-[#111]"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-gradient-x"></div>
      
      {/* Login Card */}
      <div className="z-10 bg-[#0a0a0c]/95 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] max-w-md w-full relative overflow-hidden transition-all duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-black text-white mb-2 tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            KLUTCH
          </h1>
          <p className="text-primary font-mono text-xs tracking-[0.3em] uppercase opacity-80">
             {view === 'login' ? t('auth.login_title') : view === 'register' ? t('auth.register_title') : t('auth.forgot_title')}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 p-3 rounded mb-6 animate-in fade-in slide-in-from-top-2">
            <p className="text-red-400 text-[10px] font-bold font-mono uppercase text-center">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="bg-green-900/20 border border-green-500/50 p-3 rounded mb-6 animate-in fade-in slide-in-from-top-2">
            <p className="text-green-400 text-[10px] font-bold font-mono uppercase text-center">{successMsg}</p>
          </div>
        )}

        {/* --- LOGIN FORM --- */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
             <div>
               <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('auth.username')} / {t('auth.email')}</label>
               <input 
                 type="text" 
                 className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] font-mono text-sm"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 autoFocus
               />
             </div>
             <div>
               <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('auth.password')}</label>
               <input 
                 type="password" 
                 className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none focus:shadow-[0_0_15px_rgba(0,240,255,0.2)] font-mono text-sm"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
               />
               <div className="text-right mt-1">
                 <button type="button" onClick={() => switchView('forgot')} className="text-[10px] text-gray-500 hover:text-white transition-colors">{t('auth.forgot_pass')}</button>
               </div>
             </div>

             <button 
               type="submit"
               disabled={isLoading}
               className="w-full py-4 bg-primary text-black font-black uppercase tracking-widest rounded-lg hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)]"
             >
               {isLoading ? 'AUTHENTICATING...' : t('auth.btn_login')}
             </button>

             <div className="pt-4 border-t border-white/5 text-center">
               <button type="button" onClick={() => switchView('register')} className="text-xs text-gray-400 hover:text-primary tracking-wider transition-colors">
                 {t('auth.switch_register')}
               </button>
             </div>
          </form>
        )}

        {/* --- REGISTER FORM --- */}
        {view === 'register' && (
          <form onSubmit={handleRegister} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
             <div>
               <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('auth.username')}</label>
               <input 
                 type="text" 
                 className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none font-mono text-sm"
                 value={username}
                 onChange={(e) => setUsername(e.target.value)}
               />
             </div>
             <div>
               <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('auth.email')}</label>
               <input 
                 type="email" 
                 className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none font-mono text-sm"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
               />
             </div>
             <div>
               <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('auth.password')}</label>
               <input 
                 type="password" 
                 className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none font-mono text-sm"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
               />
             </div>

             <button 
               type="submit"
               disabled={isLoading}
               className="w-full py-4 bg-secondary text-white font-black uppercase tracking-widest rounded-lg hover:bg-white hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(112,0,255,0.2)]"
             >
               {isLoading ? 'REGISTERING...' : t('auth.btn_register')}
             </button>

             <div className="pt-4 border-t border-white/5 text-center">
               <button type="button" onClick={() => switchView('login')} className="text-xs text-gray-400 hover:text-primary tracking-wider transition-colors">
                 {t('auth.switch_login')}
               </button>
             </div>
          </form>
        )}

        {/* --- FORGOT PASSWORD --- */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="bg-white/5 p-4 rounded text-xs text-gray-400 leading-relaxed mb-4">
               Enter the email address associated with your operative account. We will transmit a secure neural link to reset your credentials.
             </div>
             
             <div>
               <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('auth.email')}</label>
               <input 
                 type="email" 
                 className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none font-mono text-sm"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 autoFocus
               />
             </div>

             <button 
               type="submit"
               disabled={isLoading}
               className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isLoading ? 'TRANSMITTING...' : t('auth.btn_recover')}
             </button>

             <div className="pt-4 border-t border-white/5 text-center">
               <button type="button" onClick={() => switchView('login')} className="text-xs text-gray-400 hover:text-white tracking-wider transition-colors">
                 ← Back to Login
               </button>
             </div>
          </form>
        )}

      </div>
    </div>
  );
};
