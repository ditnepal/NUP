import React, { useState, useEffect } from 'react';
import MembershipPublicForm from './MembershipPublicForm';
import MembershipPublicVideo from './MembershipPublicVideo';
import MembershipPublicAssisted from './MembershipPublicAssisted';
import { api } from '../lib/api';
import { MessageSquare, Megaphone } from 'lucide-react';

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
        api.get('/v1/public/surveys?placementType=REGISTRATION_PRE_FORM'),
        api.get('/v1/public/polls?placementType=REGISTRATION_PRE_FORM')
      ]);
      setSurveys(surveysData);
      setPolls(pollsData);
    } catch (error) {
      console.error('Error fetching registration surveys/polls:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Membership Application</h1>
      
      {!mode && (
        <>
          {(surveys.length > 0 || polls.length > 0) && (
            <div className="mb-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="text-emerald-600" size={20} />
                Before you apply, please share your thoughts:
              </h2>
              <div className="space-y-6">
                {surveys.map(survey => (
                  <div key={survey.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800">{survey.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{survey.description}</p>
                    <button onClick={() => alert('Please log in or complete registration to participate.')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">Take Survey →</button>
                  </div>
                ))}
                {polls.map(poll => (
                  <div key={poll.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-3">{poll.title}</h3>
                    <div className="grid gap-2">
                      {poll.options?.map((opt: string, idx: number) => (
                        <button key={idx} onClick={() => alert('Please log in or complete registration to participate.')} className="w-full py-2 px-4 bg-slate-50 border border-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all text-left">
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <button onClick={() => setMode('FORM')} className="p-6 bg-blue-600 text-white rounded-xl text-xl">Apply by Form</button>
            <button onClick={() => setMode('VIDEO')} className="p-6 bg-green-600 text-white rounded-xl text-xl">Apply by Video</button>
            <button onClick={() => setMode('ASSISTED')} className="p-6 bg-purple-600 text-white rounded-xl text-xl">Apply with Help</button>
            <button onClick={() => onStatusClick?.()} className="p-4 bg-slate-200 text-slate-700 rounded-xl font-bold mt-4">Already Applied? Check Status</button>
          </div>
        </>
      )}
      {mode === 'FORM' && <MembershipPublicForm onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
      {mode === 'VIDEO' && <MembershipPublicVideo onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
      {mode === 'ASSISTED' && <MembershipPublicAssisted onBack={() => setMode(null)} onSuccess={(code, mobile) => onStatusClick?.(code, mobile)} />}
    </div>
  );
};

export default MembershipPublic;
