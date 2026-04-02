import React, { useState, useEffect } from 'react';
import MembershipPublicForm from './MembershipPublicForm';
import MembershipPublicVideo from './MembershipPublicVideo';
import MembershipPublicAssisted from './MembershipPublicAssisted';
import { api } from '../lib/api';
import { MessageSquare, Megaphone, Users, FileText, ArrowLeft, UserPlus, KeyRound, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface MembershipPublicProps {
  onStatusClick?: (trackingCode?: string, mobile?: string) => void;
  onBack?: () => void;
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

const MembershipPublic: React.FC<MembershipPublicProps> = ({ onStatusClick, onBack, onLoginClick, onRegisterClick }) => {
  const [mode, setMode] = useState<'FORM' | 'VIDEO' | 'ASSISTED' | null>(null);
  const [showGuestModes, setShowGuestModes] = useState(false);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);

  useEffect(() => {
    fetchRegistrationSurveysAndPolls();
  }, []);

  const fetchRegistrationSurveysAndPolls = async () => {
    try {
      const [surveysData, pollsData] = await Promise.all([
        api.get('/public/surveys?placementType=REGISTRATION_PRE_FORM'),
        api.get('/public/polls?placementType=REGISTRATION_PRE_FORM')
      ]);
      setSurveys(surveysData);
      setPolls(pollsData);
    } catch (error) {
      console.error('Error fetching registration surveys/polls:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {!mode && (
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12 text-center">
            {onBack && (
              <button 
                onClick={onBack}
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors text-[10px] font-black uppercase tracking-widest mb-6 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Return to Portal
              </button>
            )}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100 mb-4">
              <Users size={12} />
              Membership Start
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight mb-4">
              Begin Your Journey
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto mb-10">
              Join the movement. Create your digital identity to apply for membership, track your status, and access the member workspace.
            </p>

            {/* Auth Priority Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
              <button 
                onClick={onRegisterClick}
                className="flex flex-col items-center gap-4 p-8 bg-emerald-600 text-white rounded-[2rem] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 group"
              >
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus size={24} />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">New Member</span>
                  <span className="text-xl font-bold">Create Account</span>
                </div>
              </button>
              
              <button 
                onClick={onLoginClick}
                className="flex flex-col items-center gap-4 p-8 bg-white border-2 border-slate-200 text-slate-900 rounded-[2rem] hover:border-emerald-600 hover:text-emerald-600 transition-all group"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <KeyRound size={24} />
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Returning?</span>
                  <span className="text-xl font-bold">Sign In</span>
                </div>
              </button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Verification</p>
                <button 
                  onClick={() => onStatusClick?.()} 
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                >
                  <Search size={14} />
                  Check Application Status
                </button>
              </div>

              <button 
                onClick={() => setShowGuestModes(!showGuestModes)}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-all flex items-center gap-2 group"
              >
                <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-emerald-500 transition-colors" />
                {showGuestModes ? 'Hide Guest Options' : 'Alternative: Continue as Guest'}
              </button>
            </div>
          </div>

          {/* Guest Application Modes - Hidden by default */}
          {showGuestModes && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Guest Application Methods</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => setMode('FORM')} 
                  className="group p-8 bg-white border border-slate-200 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 transition-all text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Standard Form</h3>
                    <p className="text-slate-500 text-xs mt-1">Direct digital application</p>
                  </div>
                </button>

                <button 
                  onClick={() => setMode('VIDEO')} 
                  className="group p-8 bg-white border border-slate-200 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 transition-all text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Megaphone size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Video KYC</h3>
                    <p className="text-slate-500 text-xs mt-1">Verified video submission</p>
                  </div>
                </button>

                <button 
                  onClick={() => setMode('ASSISTED')} 
                  className="group p-8 bg-white border border-slate-200 rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 transition-all text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <MessageSquare size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 uppercase tracking-tight">Assisted</h3>
                    <p className="text-slate-500 text-xs mt-1">Support-guided process</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Surveys/Polls */}
        </div>
      )}
      {mode === 'FORM' && <MembershipPublicForm onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
      {mode === 'VIDEO' && <MembershipPublicVideo onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
      {mode === 'ASSISTED' && <MembershipPublicAssisted onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
    </div>
  );
};

export default MembershipPublic;
