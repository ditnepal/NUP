import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  User, 
  FileText, 
  BarChart3, 
  MapPin, 
  Users, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Target,
  MessageSquare
} from 'lucide-react';

export function CandidateDashboard() {
  const [candidate, setCandidate] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [outreach, setOutreach] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidateData();
  }, []);

  const fetchCandidateData = async () => {
    try {
      const cycles = await api.get('/election/cycles');
      if (cycles?.length > 0) {
        const activeCycle = cycles.find((c: any) => c.status === 'ACTIVE') || cycles[0];
        const candidates = await api.get(`/election/candidates?cycleId=${activeCycle.id}`);
        if (candidates?.length > 0) {
          // NOTE: Blind candidate assignment (candidates[0]) was removed for security/truthfulness.
          // Full candidate-user linkage is deferred to a later dedicated phase.
          setCandidate(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch candidate data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
          <User size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Candidate Workspace</h2>
        <p className="text-slate-500 mt-3 max-w-md mx-auto leading-relaxed text-sm">
          You are not currently assigned as an official candidate in the system. 
          This workspace becomes available once your candidacy is approved and linked to your account by the party administration.
        </p>
        <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs inline-block text-left max-w-sm">
          <p className="font-black mb-2 flex items-center gap-2 uppercase tracking-widest">
            <AlertCircle size={14} />
            Are you an approved candidate?
          </p>
          <p className="leading-relaxed opacity-80">
            If you have been officially nominated but cannot see your dashboard, please contact your district or provincial administrator to link your profile to this account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Candidate Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 border-4 border-emerald-50 flex-shrink-0">
          <User size={48} className="sm:hidden" />
          <User size={64} className="hidden sm:block" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{candidate.name}</h1>
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold w-fit mx-auto md:mx-0 ${
              candidate.status === 'WON' ? 'bg-emerald-100 text-emerald-600' :
              candidate.status === 'ACTIVE' || candidate.status === 'NOMINATED' ? 'bg-blue-100 text-blue-600' :
              candidate.status === 'LOST' ? 'bg-red-100 text-red-600' :
              'bg-slate-100 text-slate-600'
            }`}>
              {candidate.status}
            </span>
          </div>
          <p className="text-base sm:text-lg text-slate-600 font-medium mb-4">{candidate.position} • {candidate.constituency?.name || 'N/A'}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
              <MapPin size={14} />
              {candidate.constituency?.province || 'Province'}, {candidate.constituency?.district || 'District'}
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
              <Calendar size={14} />
              Election Year: {candidate.electionCycle?.year || '2026'}
            </div>
          </div>
        </div>
        <div className="hidden md:flex flex-col gap-2 w-full md:w-auto">
          <div className="px-6 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-bold text-sm border border-slate-100 text-center">
            Candidate Profile
          </div>
        </div>
      </div>

      {/* Manifesto Section */}
      {candidate.manifesto && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <FileText size={20} className="text-emerald-600" />
            Manifesto Summary
          </h3>
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{candidate.manifesto}</p>
        </div>
      )}

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">+12% vs Goal</span>
          </div>
          <p className="text-sm text-slate-500">Target Votes</p>
          <p className="text-3xl font-bold text-slate-900">12,500</p>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full w-[65%]"></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">8,125 Supporters Identified</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Target size={24} />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">85% Coverage</span>
          </div>
          <p className="text-sm text-slate-500">Booth Readiness</p>
          <p className="text-3xl font-bold text-slate-900">42 / 50</p>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-[84%]"></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Booths with full teams</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <MessageSquare size={24} />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md">Active</span>
          </div>
          <p className="text-sm text-slate-500">Outreach Activities</p>
          <p className="text-3xl font-bold text-slate-900">1,240</p>
          <div className="mt-4 flex items-center gap-1">
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-emerald-500 rounded-full"></div>
            <div className="h-1 flex-1 bg-slate-200 rounded-full"></div>
            <div className="h-1 flex-1 bg-slate-200 rounded-full"></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Weekly Goal: 2,000</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-600" />
              Polling Station Results
            </h3>
            <button className="text-xs font-bold text-emerald-600 hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {results?.length > 0 ? results?.map(res => (
              <div key={res.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">{res.booth?.name || 'Booth'}</p>
                  <p className="text-xs text-slate-500">Verified: {res.verifiedAt ? 'Yes' : 'No'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{res.votesReceived.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Votes</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3">
                  <BarChart3 size={24} />
                </div>
                <p className="text-sm text-slate-500">No results recorded yet for this candidate.</p>
              </div>
            )}
          </div>
        </div>

        {/* Documents & Compliance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-blue-600" />
              Nomination & Compliance
            </h3>
            <button className="text-xs font-bold text-blue-600 hover:underline">Upload New</button>
          </div>
          <div className="space-y-3">
            {candidate.documents?.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{doc.title}</p>
                    <p className="text-xs text-slate-500">{doc.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' :
                  doc.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {doc.status}
                </span>
              </div>
            ))}
            {(!candidate.documents || candidate.documents.length === 0) && (
              <div className="text-center py-12">
                <AlertCircle size={32} className="text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No nomination documents uploaded yet.</p>
                <button className="mt-4 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100">
                  Upload Required Documents
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
