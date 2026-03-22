import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Vote, 
  Flag, 
  AlertTriangle, 
  BarChart3, 
  Users, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Plus,
  Search,
  ChevronRight,
  FileText
} from 'lucide-react';

export function ElectionAdmin() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [readiness, setReadiness] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'incidents' | 'results' | 'readiness'>('overview');

  useEffect(() => {
    fetchCycles();
  }, []);

  useEffect(() => {
    if (selectedCycle) {
      fetchCycleData();
    }
  }, [selectedCycle]);

  const fetchCycles = async () => {
    try {
      const data = await api.get('/election/cycles');
      setCycles(data);
      if (data.length > 0) setSelectedCycle(data[0]);
    } catch (error) {
      console.error('Failed to fetch cycles', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCycleData = async () => {
    setLoading(true);
    try {
      // Stagger API calls
      const candData = await api.get(`/election/candidates?cycleId=${selectedCycle.id}`);
      await new Promise(resolve => setTimeout(resolve, 300));
      const incData = await api.get(`/election/incidents?cycleId=${selectedCycle.id}`);
      await new Promise(resolve => setTimeout(resolve, 300));
      const resData = await api.get(`/election/results?cycleId=${selectedCycle.id}`);
      await new Promise(resolve => setTimeout(resolve, 300));
      const readData = await api.get('/election/booth-readiness');
      
      setCandidates(candData);
      setIncidents(incData);
      setResults(resData);
      setReadiness(readData);
    } catch (error) {
      console.error('Failed to fetch cycle data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && cycles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Election Operations</h1>
          <p className="text-slate-500">Manage cycles, candidates, and real-time polling data</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedCycle?.id} 
            onChange={(e) => setSelectedCycle(cycles.find(c => c.id === e.target.value))}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
            ))}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all">
            <Plus size={18} />
            New Cycle
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Candidates</p>
              <p className="text-2xl font-bold text-slate-900">{candidates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Incidents</p>
              <p className="text-2xl font-bold text-slate-900">{incidents.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Booths Ready</p>
              <p className="text-2xl font-bold text-slate-900">
                {readiness.filter(r => r.status === 'READY').length} / {readiness.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Results Verified</p>
              <p className="text-2xl font-bold text-slate-900">
                {results.filter(r => r.verifiedAt).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 overflow-x-auto no-scrollbar pb-1">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'overview' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'candidates' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Candidates
        </button>
        <button 
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'incidents' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Incidents
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'results' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Results
        </button>
        <button 
          onClick={() => setActiveTab('readiness')}
          className={`px-4 py-2 font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'readiness' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Booth Readiness
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="text-amber-500" size={20} />
                  Recent Incidents
                </h3>
                <div className="space-y-3">
                  {incidents.slice(0, 3).map(inc => (
                    <div key={inc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                          inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-xs text-slate-500">{new Date(inc.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{inc.type}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{inc.description}</p>
                    </div>
                  ))}
                  {incidents.length === 0 && <p className="text-sm text-slate-500 italic">No incidents reported.</p>}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="text-emerald-500" size={20} />
                  Top Results
                </h3>
                <div className="space-y-3">
                  {results.slice(0, 5).map(res => (
                    <div key={res.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                          <Vote size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{res.candidate.name}</p>
                          <p className="text-xs text-slate-500">{res.constituency?.name || 'Global'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{res.votesReceived.toLocaleString()}</p>
                        <p className="text-xs text-slate-400">Votes</p>
                      </div>
                    </div>
                  ))}
                  {results.length === 0 && <p className="text-sm text-slate-500 italic">No results entered yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Constituency</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map(cand => (
                  <tr key={cand.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{cand.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{cand.position}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{cand.constituency?.name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        cand.status === 'WON' ? 'bg-emerald-100 text-emerald-600' :
                        cand.status === 'ACTIVE' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {cand.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <FileText size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-500">{cand.documents?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-emerald-600 hover:text-emerald-700 font-medium text-sm">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Incident Log</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-medium">
                <Plus size={16} />
                Report Incident
              </button>
            </div>
            <div className="space-y-3">
              {incidents.map(inc => (
                <div key={inc.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        inc.severity === 'CRITICAL' ? 'bg-red-50 text-red-600' :
                        inc.severity === 'HIGH' ? 'bg-orange-50 text-orange-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        <ShieldAlert size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{inc.type}</h4>
                        <p className="text-xs text-slate-500">
                          Reported by {inc.reporter.displayName} • {new Date(inc.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-600' :
                      inc.status === 'INVESTIGATING' ? 'bg-blue-100 text-blue-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">{inc.description}</p>
                </div>
              ))}
              {incidents.length === 0 && <p className="text-center py-12 text-slate-500">No incidents found.</p>}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Election Results</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all text-sm font-medium">
                <Plus size={16} />
                Enter Result
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map(res => (
                <div key={res.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all relative overflow-hidden">
                  {res.isWinner && (
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white px-3 py-1 text-[10px] font-bold rounded-bl-lg">
                      WINNER
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                      <Vote size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{res.candidate.name}</h4>
                      <p className="text-xs text-slate-500">{res.constituency?.name || 'Global'}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{res.votesReceived.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Votes</p>
                    </div>
                    <div className="text-right">
                      {res.verifiedAt ? (
                        <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                          <CheckCircle2 size={12} />
                          VERIFIED
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">PENDING VERIFICATION</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {results.length === 0 && <p className="text-center py-12 text-slate-500">No results recorded yet.</p>}
          </div>
        )}

        {activeTab === 'readiness' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Booth Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Deployments</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Outreach</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readiness.map(booth => (
                  <tr key={booth.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{booth.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        booth.status === 'READY' ? 'bg-emerald-100 text-emerald-600' :
                        booth.status === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {booth.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{booth.teamCount}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{booth.deploymentCount}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{booth.outreachCount}</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            booth.readinessScore > 80 ? 'bg-emerald-500' :
                            booth.readinessScore > 50 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${booth.readinessScore}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 mt-1 block">{booth.readinessScore}% Ready</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
