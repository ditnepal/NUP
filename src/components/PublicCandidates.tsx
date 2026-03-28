import React, { useState, useEffect } from 'react';
import { UserCheck, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

export const PublicCandidatesView = () => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        // In a real implementation, this would fetch from a public endpoint
        // For now, we simulate fetching public candidate profiles
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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
          <UserCheck size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Our Candidates</h2>
          <p className="text-slate-500">Meet the leaders representing our vision across Nepal.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading candidates...</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserCheck size={40} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">No Candidates Listed Yet</h3>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            We are currently updating our candidate roster. Please check back soon for detailed profiles of our representatives.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <UserCheck size={32} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{candidate.name}</h3>
                  <p className="text-sm text-emerald-600 font-medium">{candidate.position}</p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-slate-400" />
                  {candidate.region}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={16} className="text-slate-400" />
                  Election: {candidate.electionDate}
                </div>
              </div>
              <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                View Profile <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
