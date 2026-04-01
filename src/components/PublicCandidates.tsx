import React, { useState, useEffect } from 'react';
import { UserCheck, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export const PublicCandidatesView = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await api.get('/public/candidates').catch(() => []);
        setCandidates(response);
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
            <UserCheck size={12} />
            Leadership
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">
            Our Candidates
          </h1>
          <p className="text-slate-500 text-lg">
            Meet the dedicated leaders representing our vision across the nation. 
            Each candidate is committed to transparency, integrity, and the future of Nepal.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserCheck size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">No Candidates Listed</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            We are currently finalizing our candidate roster for the upcoming elections. 
            Please check back soon for detailed profiles and manifestos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates?.map((candidate) => (
            <div key={candidate.id} className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col">
              <div className="p-8 flex flex-col items-center text-center border-b border-slate-50">
                <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <UserCheck size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">
                  {candidate.name}
                </h3>
                <p className="text-emerald-600 text-xs font-black uppercase tracking-widest">
                  {candidate.position}
                </p>
              </div>
              
              <div className="p-8 space-y-4 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Region</span>
                  <span className="text-slate-700 font-bold flex items-center gap-2">
                    <MapPin size={14} className="text-slate-300" />
                    {candidate.region}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Election Date</span>
                  <span className="text-slate-700 font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-slate-300" />
                    {candidate.electionDate}
                  </span>
                </div>
              </div>
              
              <div className="p-8 pt-0">
                <button className="w-full py-4 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                  View Full Profile <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
