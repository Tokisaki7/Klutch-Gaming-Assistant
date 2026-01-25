import React, { useState } from 'react';
import { t } from '../services/localization';

const plans = [
  {
    name: "Starter",
    price: "0",
    description: "Essential tools for casual gamers.",
    features: [
      "Basic Chat Assistant",
      "5 Standard Images / day",
      "Game Recommendations",
      "Community Discord Access"
    ],
    cta: "Current Plan",
    highlight: false,
    color: "zinc"
  },
  {
    name: "Pro Operative",
    price: "29",
    description: "For serious players who want an edge.",
    features: [
      "Priority Chat Response (Fast)",
      "50 High-Res Images / day",
      "Avatar Creator Unlocked",
      "Nexus Vision (Unlimited)",
      "Ad-free Experience"
    ],
    cta: "Start Free Trial",
    highlight: true,
    color: "blue"
  },
  {
    name: "Elite Commander",
    price: "59",
    description: "Ultimate power for creators and pros.",
    features: [
      "Live Comms (Unlimited Voice)",
      "Gemini 3 Pro Deep Thinking",
      "Unlimited 4K Assets",
      "TheoryCraft Advanced Engine",
      "Early Access to Beta Features"
    ],
    cta: "Get Elite",
    highlight: false,
    color: "purple"
  }
];

export const Subscription: React.FC = () => {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'verified' | 'success'>('idle');

  const handleSelectPlan = (plan: any) => {
    if (plan.price === "0") return; // Skip for free plan
    setSelectedPlan(plan);
    setPaymentStatus('idle');
  };

  const handleGooglePay = () => {
    setPaymentStatus('processing');
    
    // Simulate realistic payment gateway latency
    setTimeout(() => {
      setPaymentStatus('verified');
      setTimeout(() => {
        setPaymentStatus('success');
        setTimeout(() => {
           setSelectedPlan(null); // Close modal
           // Optional: You could trigger a global state update here to unlock features
        }, 2500);
      }, 1500);
    }, 2000);
  };

  const calculatePrice = (price: string) => {
    return billing === 'yearly' ? Math.floor(parseInt(price) * 0.8) : parseInt(price);
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-12 bg-black relative">
      <div className="text-center mb-12 space-y-4 pt-8">
        <h2 className="text-primary font-mono text-sm tracking-widest uppercase mb-2">Pricing Plans</h2>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">
          Supercharge your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Gameplay</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto font-light">
          Unlock the full potential of Generative AI. Choose the plan that fits your squad role.
        </p>

        {/* Toggle */}
        <div className="flex justify-center mt-8">
          <div className="bg-zinc-900 p-1 rounded-xl flex items-center border border-white/5">
            <button 
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-zinc-800 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBilling('yearly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${billing === 'yearly' ? 'bg-zinc-800 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
            >
              Yearly <span className="ml-1 text-[10px] text-green-400 font-bold">-20%</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto pb-12">
        {plans.map((plan, idx) => (
          <div 
            key={idx} 
            className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 group hover:-translate-y-2 ${
              plan.highlight 
                ? 'bg-zinc-900/50 border-primary/50 shadow-neon z-10' 
                : 'bg-zinc-950/50 border-white/5 hover:border-white/10'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-blue-600 px-4 py-1 rounded-full text-[10px] font-bold text-white shadow-lg uppercase tracking-wider">
                Recommended
              </div>
            )}

            <div className="mb-8">
              <h3 className={`text-lg font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-gray-300'}`}>{plan.name}</h3>
              <p className="text-xs text-gray-500 mb-6 h-4">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-gray-400">$</span>
                <span className="text-5xl font-display font-bold text-white">
                  {calculatePrice(plan.price)}
                </span>
                <span className="text-sm text-gray-500">/mo</span>
              </div>
            </div>

            <div className="w-full h-px bg-white/5 mb-8"></div>

            <ul className="flex-1 space-y-4 mb-8">
              {plan.features.map((feat, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300 group-hover:text-white transition-colors">
                  <svg className={`w-5 h-5 ${plan.highlight ? 'text-primary' : 'text-gray-600'} shrink-0`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feat}
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleSelectPlan(plan)}
              className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-lg ${
              plan.highlight 
                ? 'bg-primary text-white hover:bg-blue-600 shadow-blue-900/20' 
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
            }`}>
              {plan.cta}
            </button>
            
            {/* Payment Icons */}
            {plan.highlight && (
               <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                  <svg className="h-6" viewBox="0 0 24 24" fill="white"><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/></svg>
                  <span className="font-bold text-white text-sm">G Pay</span>
               </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center text-xs text-gray-600 pb-8">
         <p>Secure payment processing. Cancel anytime.</p>
         <p className="mt-2">Enterprise needs? Contact sales for custom API integration.</p>
      </div>

      {/* ================= PAYMENT MODAL SIMULATION ================= */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-300">
           <div className="bg-[#1f1f1f] w-full max-w-md rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl border border-white/10 relative animate-in slide-in-from-bottom-10 duration-500">
              
              {/* Payment Sheet Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#252525]">
                 <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/></svg>
                    <span className="font-bold text-gray-200">Google Pay</span>
                 </div>
                 <div className="text-xs text-gray-500">{t('login.guest').split(' ')[0]}@gmail.com</div>
              </div>

              {/* Body */}
              <div className="p-8">
                 {paymentStatus === 'idle' && (
                    <div className="space-y-6">
                       <div className="text-center">
                          <p className="text-gray-400 text-sm mb-1">Total to pay</p>
                          <p className="text-4xl font-bold text-white">${calculatePrice(selectedPlan.price)}.00</p>
                          <p className="text-xs text-gray-500 mt-1">Klutch {selectedPlan.name} ({billing})</p>
                       </div>

                       <div className="bg-[#2a2a2a] rounded-xl p-4 flex items-center justify-between border border-white/5 cursor-pointer hover:bg-[#333] transition-colors">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-6 bg-gradient-to-r from-yellow-600 to-yellow-400 rounded flex items-center justify-center shadow-sm">
                                <div className="w-4 h-4 rounded-full border border-white/50 opacity-50 -mr-2"></div>
                                <div className="w-4 h-4 rounded-full border border-white/50 opacity-50"></div>
                             </div>
                             <div>
                                <p className="text-sm font-bold text-white">Mastercard •••• 8842</p>
                                <p className="text-[10px] text-gray-500">Default Method</p>
                             </div>
                          </div>
                          <span className="text-primary text-xs font-bold">Change</span>
                       </div>

                       <button 
                         onClick={handleGooglePay}
                         className="w-full py-4 bg-[#252525] hover:bg-[#303030] text-white rounded-full font-bold flex items-center justify-center gap-2 transition-all border border-white/10 active:scale-95 shadow-lg relative overflow-hidden group"
                       >
                          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span>Pay with</span>
                          <span className="font-bold">G Pay</span>
                       </button>
                    </div>
                 )}

                 {paymentStatus === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                       <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-sm font-mono text-gray-400 animate-pulse">Contacting Bank...</p>
                    </div>
                 )}

                 {paymentStatus === 'verified' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                       <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                       </div>
                       <p className="text-sm font-mono text-green-400">Payment Verified!</p>
                    </div>
                 )}
                 
                 {paymentStatus === 'success' && (
                    <div className="flex flex-col items-center justify-center py-4 space-y-2">
                       <h3 className="text-2xl font-bold text-white">You're In.</h3>
                       <p className="text-gray-400 text-sm text-center">Subscription activated. Welcome to {selectedPlan.name}.</p>
                    </div>
                 )}
              </div>

              {/* Footer */}
              <div className="bg-[#1a1a1a] p-4 text-center border-t border-white/5">
                 <button onClick={() => setSelectedPlan(null)} className="text-xs text-gray-500 hover:text-white transition-colors">Cancel Transaction</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};