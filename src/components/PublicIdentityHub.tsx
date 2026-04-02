import React from 'react';
import { UserPlus, LogIn, Search, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface PublicIdentityHubProps {
  onRegisterClick: () => void;
  onLoginClick: () => void;
  onStatusClick: () => void;
  onBack: () => void;
}

export const PublicIdentityHub: React.FC<PublicIdentityHubProps> = ({
  onRegisterClick,
  onLoginClick,
  onStatusClick,
  onBack
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center"
      >
        {/* Left Side: Branding & Context */}
        <div className="space-y-8 text-center md:text-left p-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest">
            <ShieldCheck size={14} />
            <span>Secure Identity Hub</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tighter uppercase">
              Access Your <br />
              <span className="text-emerald-600">Digital Workspace</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md">
              Join the movement, manage your membership, and track your progress within our unified digital ecosystem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest text-[10px] transition-all"
            >
              <Globe size={14} />
              Return to Portal
            </button>
          </div>
        </div>

        {/* Right Side: Action Cards */}
        <div className="space-y-4">
          {/* Create Account - Primary */}
          <button 
            onClick={onRegisterClick}
            className="group w-full bg-emerald-600 hover:bg-emerald-700 text-white p-6 rounded-[2rem] shadow-xl shadow-emerald-100 transition-all hover:scale-[1.02] active:scale-[0.98] text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <UserPlus size={80} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Create Account</h3>
                <p className="text-emerald-100 text-sm font-medium">New to the movement? Initialize your profile today.</p>
              </div>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-80">
                <span>Get Started</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Sign In - Secondary */}
          <button 
            onClick={onLoginClick}
            className="group w-full bg-white border border-slate-200 hover:border-emerald-200 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 text-slate-50 opacity-50 group-hover:scale-110 transition-transform">
              <LogIn size={80} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <LogIn size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Sign In</h3>
                <p className="text-slate-500 text-sm font-medium">Already a member? Access your workspace.</p>
              </div>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                <span>Authenticate</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Track Application - Tertiary */}
          <button 
            onClick={onStatusClick}
            className="group w-full bg-slate-900 hover:bg-slate-800 text-white p-6 rounded-[2rem] shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-left relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Search size={80} />
            </div>
            <div className="relative z-10 space-y-2">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Search size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Check Status</h3>
                <p className="text-slate-400 text-sm font-medium">Track your membership application progress.</p>
              </div>
              <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                <span>Track Progress</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Institutional Footer */}
      <div className="mt-12 flex items-center gap-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} />
          <span>Encrypted Session</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-200" />
        <span>Unified Identity Hub v2.0</span>
      </div>
    </div>
  );
};
