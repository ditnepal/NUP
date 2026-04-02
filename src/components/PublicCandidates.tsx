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
    <div className="space-y-12">
      {/* Header Section */}
      <div className="bg-slate-950 text-white rounded-[3rem] p-12 md:p-20 relative overflow-hidden mx-4 md:mx-0">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#10b981_0%,transparent_50%)]"></div>
        </div>
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-10">
            <UserCheck size={14} />
            Leadership Corps
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-8">
            Our <br />
            <span className="text-emerald-500">Candidates.</span>
          </h1>
          <p className="text-xl text-slate-400 font-medium leading-tight tracking-tight max-w-2xl">
            Meet the dedicated leaders representing our vision across the nation. 
            Each candidate is committed to transparency, integrity, and the future of Nepal.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-96 bg-slate-100 rounded-[3rem] animate-pulse" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <UserCheck size={48} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">No Candidates Listed</h3>
          <p className="text-slate-500 max-w-md mx-auto font-medium">
            We are currently finalizing our candidate roster for the upcoming elections. 
            Please check back soon for detailed profiles and manifestos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {candidates?.map((candidate) => (
            <div key={candidate.id} className="group bg-white border border-slate-100 rounded-[3rem] overflow-hidden hover:shadow-2xl transition-all flex flex-col shadow-sm">
              <div className="p-10 flex flex-col items-center text-center border-b border-slate-50">
                <div className="w-28 h-28 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-500 border border-slate-100">
                  <UserCheck size={56} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">
                  {candidate.name}
                </h3>
                <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100">
                  {candidate.position}
                </p>
              </div>
              
              <div className="p-10 space-y-6 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Region</span>
                  <span className="text-slate-900 font-black flex items-center gap-3 uppercase tracking-tight">
                    <MapPin size={16} className="text-emerald-500" />
                    {candidate.region}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Election Date</span>
                  <span className="text-slate-900 font-black flex items-center gap-3 uppercase tracking-tight">
                    <Calendar size={16} className="text-emerald-500" />
                    {candidate.electionDate}
                  </span>
                </div>
              </div>
              
              <div className="p-10 pt-0">
                <button className="w-full py-5 bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200">
                  View Full Profile <ArrowRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
