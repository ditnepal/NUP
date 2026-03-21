import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  Map as MapIcon, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  MessageSquare, 
  Zap, 
  Target,
  ChevronRight,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  MapPin
} from 'lucide-react';

import { api } from '../lib/api';

interface Report {
  id: string;
  type: string;
  content: string;
  sentimentScore: number;
  priority: string;
  locationName: string;
  createdAt: string;
  reporter: { displayName: string };
}

interface StrategicOverview {
  avgSentiment: number;
  typeCounts: Record<string, number>;
  topPriorities: any[];
  areaStrengths: any[];
}

export const PgisDashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [overview, setOverview] = useState<StrategicOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'reports' | 'map'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rData, oData] = await Promise.all([
        api.get('/pgis/reports'),
        api.get('/pgis/overview')
      ]);
      setReports(rData);
      setOverview(oData);
    } catch (error) {
      console.error('Error fetching PGIS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 20) return 'text-green-600';
    if (score < -20) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'MEDIUM': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Ground Intelligence</h1>
            <p className="text-gray-500 mt-1">PGIS / War Room Strategic Overview</p>
          </div>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveView('overview')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeView === 'overview' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveView('reports')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeView === 'reports' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            Reports
          </button>
          <button 
            onClick={() => setActiveView('map')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeView === 'map' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            Map View
          </button>
        </div>
      </div>

      {activeView === 'overview' && overview && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-blue-600">
                <TrendingUp size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Avg Sentiment</span>
              </div>
              <div className="flex items-end gap-2">
                <p className={`text-4xl font-bold ${getSentimentColor(overview.avgSentiment)}`}>
                  {overview.avgSentiment > 0 ? '+' : ''}{Math.round(overview.avgSentiment)}
                </p>
                <span className="text-sm text-gray-400 mb-1">/ 100</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                <ArrowUpRight size={14} />
                <span>4.2% from last week</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-purple-600">
                <MessageSquare size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Reports</span>
              </div>
              <p className="text-4xl font-bold">{reports.length}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400 font-bold">
                <Activity size={14} />
                <span>Real-time updates active</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-red-600">
                <AlertTriangle size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Critical Issues</span>
              </div>
              <p className="text-4xl font-bold">{reports.filter(r => r.priority === 'CRITICAL').length}</p>
              <div className="flex items-center gap-1 text-xs text-red-600 font-bold">
                <Zap size={14} />
                <span>Immediate action required</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between text-green-600">
                <Target size={20} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Booth Readiness</span>
              </div>
              <p className="text-4xl font-bold">84%</p>
              <div className="flex items-center gap-1 text-xs text-green-600 font-bold">
                <ArrowUpRight size={14} />
                <span>+12% target coverage</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Community Priorities</h3>
                <button className="text-sm font-bold text-gray-400 hover:text-black">View All</button>
              </div>
              <div className="space-y-4">
                {overview.topPriorities.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 group hover:bg-gray-100 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-gray-400 group-hover:text-black shadow-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{p.issue}</h4>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{p.orgUnit.name}</p>
                    </div>
                    <ArrowUpRight size={18} className="text-gray-300 group-hover:text-black" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Area Strength Analysis</h3>
                <button className="text-sm font-bold text-gray-400 hover:text-black">Detailed Report</button>
              </div>
              <div className="space-y-6">
                {overview.areaStrengths.map((s) => (
                  <div key={s.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">{s.orgUnit.name}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.partyStrength}% Strength</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.partyStrength}%` }}
                        className="h-full bg-black"
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.swingVoters}%` }}
                        className="h-full bg-blue-400"
                      />
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${s.oppositionStrength}%` }}
                        className="h-full bg-red-400"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>Our Base</span>
                      <span>Swing</span>
                      <span>Opposition</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'reports' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search field reports..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black">
                <Filter size={18} />
                Filter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Report</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Location</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Sentiment</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Priority</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Reporter</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 line-clamp-1 font-medium">{r.content}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{r.type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin size={14} className="text-gray-400" />
                        {r.locationName || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${getSentimentColor(r.sentimentScore)}`}>
                        {r.sentimentScore > 0 ? '+' : ''}{r.sentimentScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getPriorityColor(r.priority)}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{r.reporter.displayName}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'map' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-6 min-h-[500px]">
          <div className="w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 shadow-inner">
            <MapIcon size={48} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Strategic Map View</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              Interactive PGIS map visualization is currently being integrated with the Ground Intelligence module.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg">
            Initialize Map Engine
            <ArrowUpRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
