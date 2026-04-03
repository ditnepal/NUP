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
  user?: any;
}

const MembershipPublic: React.FC<MembershipPublicProps> = ({ onStatusClick, onBack, onLoginClick, onRegisterClick, user }) => {
  const [mode, setMode] = useState<'FORM' | 'VIDEO' | 'ASSISTED' | null>(user ? 'FORM' : null);
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
    <div className="max-w-2xl mx-auto">
      {!mode && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10 text-center">
            {onBack && (
              <button 
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition-colors text-[9px] font-black uppercase tracking-widest mb-4 group"
              >
                <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                Return to Portal
              </button>
            )}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest border border-emerald-100 mb-3">
              <Users size={10} />
              Membership Start
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight mb-3">
              Begin Your Journey
            </h1>
            <p className="text-slate-500 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
              Join the movement. Create your digital identity to apply for membership, track your status, and access the member workspace.
            </p>

            {/* Auth Priority Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              <button 
                onClick={onRegisterClick}
                className="flex flex-col items-center gap-3 p-6 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 group"
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus size={20} />
                </div>
                <div className="text-center">
                  <span className="block text-[8px] font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">New Member</span>
                  <span className="text-lg font-bold">Create Account</span>
                </div>
              </button>
              
              <button 
                onClick={onLoginClick}
                className="flex flex-col items-center gap-3 p-6 bg-white border border-slate-200 text-slate-900 rounded-xl hover:border-emerald-600 hover:text-emerald-600 transition-all group"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <KeyRound size={20} />
                </div>
                <div className="text-center">
                  <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5">Returning?</span>
                  <span className="text-lg font-bold">Sign In</span>
                </div>
              </button>
            </div>
            
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Identity Verification</p>
                <button 
                  onClick={() => onStatusClick?.()} 
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Search size={12} />
                  Check Application Status
                </button>
              </div>

              <button 
                onClick={() => setShowGuestModes(!showGuestModes)}
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-all flex items-center gap-1.5 group"
              >
                <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-emerald-500 transition-colors" />
                {showGuestModes ? 'Hide Guest Options' : 'Alternative: Continue as Guest'}
              </button>
            </div>
          </div>

          {/* Guest Application Modes - Hidden by default */}
          {showGuestModes && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Guest Application Methods</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => setMode('FORM')} 
                  className="group p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Standard Form</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">Direct digital application</p>
                  </div>
                </button>

                <button 
                  onClick={() => setMode('VIDEO')} 
                  className="group p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Megaphone size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Video KYC</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">Verified video submission</p>
                  </div>
                </button>

                <button 
                  onClick={() => setMode('ASSISTED')} 
                  className="group p-6 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Assisted</h3>
                    <p className="text-slate-500 text-[10px] mt-0.5">Support-guided process</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Surveys/Polls */}
        </div>
      )}
      {mode === 'FORM' && <MembershipPublicForm onBack={() => user && onBack ? onBack() : setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} user={user} />}
      {mode === 'VIDEO' && <MembershipPublicVideo onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
      {mode === 'ASSISTED' && <MembershipPublicAssisted onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
    </div>
  );
};

export default MembershipPublic;
