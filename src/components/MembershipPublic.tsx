import React, { useState, useEffect } from 'react';
import MembershipPublicForm from './MembershipPublicForm';
import MembershipPublicVideo from './MembershipPublicVideo';
import MembershipPublicAssisted from './MembershipPublicAssisted';
import { api } from '../lib/api';
import { MessageSquare, Megaphone, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface MembershipPublicProps {
  onStatusClick?: (trackingCode?: string, mobile?: string) => void;
}

const MembershipPublic: React.FC<MembershipPublicProps> = ({ onStatusClick }) => {
  const [mode, setMode] = useState<'FORM' | 'VIDEO' | 'ASSISTED' | null>(null);
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100 mb-4">
              <Users size={12} />
              Membership
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight mb-4">
              Join the Movement
            </h1>
            <p className="text-slate-500 max-w-xl mx-auto">
              Become a registered member and help shape the future of our nation. 
              Choose your preferred application method below.
            </p>
          </div>

          {/* Surveys/Polls */}
          {(surveys.length > 0 || polls.length > 0) && (
            <div className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Community Voice</h2>
                  <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Share your thoughts before applying</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {surveys.map(survey => (
                  <div key={survey.id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="font-bold text-white mb-1">{survey.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{survey.description}</p>
                    <button 
                      onClick={() => toast.info('Please log in or complete registration to participate.')} 
                      className="text-xs font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 transition-colors"
                    >
                      Take Survey →
                    </button>
                  </div>
                ))}
                {polls.map(poll => (
                  <div key={poll.id} className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50">
                    <h3 className="font-bold text-white mb-4">{poll.title}</h3>
                    <div className="grid gap-3">
                      {poll.options?.map((opt: string, idx: number) => (
                        <button 
                          key={idx} 
                          onClick={() => toast.info('Please log in or complete registration to participate.')} 
                          className="w-full py-3 px-4 bg-slate-800 border border-slate-700 text-slate-300 text-sm font-bold rounded-xl hover:bg-slate-700 hover:text-white transition-all text-left"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Application Modes */}
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

          <button 
            onClick={() => onStatusClick?.()} 
            className="w-full py-6 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 hover:border-slate-300 transition-all"
          >
            Already Applied? Check Status
          </button>
        </div>
      )}
      {mode === 'FORM' && <MembershipPublicForm onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
      {mode === 'VIDEO' && <MembershipPublicVideo onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
      {mode === 'ASSISTED' && <MembershipPublicAssisted onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
    </div>
  );
};

export default MembershipPublic;
