import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  HeartHandshake, 
  DollarSign, 
  MessageSquare, 
  Map, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3, 
  FileText, 
  BrainCircuit, 
  RefreshCw,
  ChevronRight,
  Target,
  Globe
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { aiService } from '../services/ai.service';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'];

export function WarRoomDashboard() {
  const [data, setData] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/warroom/analytics');
      setData(response);
      setError(null);
      
      // Generate AI Summary on the frontend
      if (response && response.data) {
        const summary = await aiService.generateStrategicSummary(response.data);
        setAiSummary(summary);
      }
    } catch (err) {
      console.error('Failed to fetch War Room analytics', err);
      setError('Failed to load strategic data. Ensure you have NATIONAL_COMMAND permissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-slate-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-sm font-mono tracking-widest uppercase">Initializing National Command Interface...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center bg-slate-950 h-screen flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/30">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">{error}</p>
        <button 
          onClick={fetchAnalytics}
          className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all font-bold flex items-center gap-2"
        >
          <RefreshCw size={18} /> Retry Connection
        </button>
      </div>
    );
  }

  const { data: analytics } = data;

  // Prepare chart data
  const boothData = analytics.booths.map((b: any) => ({ name: b.status, value: b._count.id }));
  const grievanceData = analytics.grievances.map((g: any) => ({ name: `${g.status} (${g.priority})`, value: g._count.id }));
  const areaScores = analytics.areaScores.map((s: any) => ({ 
    name: s.orgUnit.name, 
    strength: s.partyStrength, 
    opposition: s.oppositionStrength,
    swing: s.swingVoters
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-6 font-sans">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-slate-800 pb-6">
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 flex-shrink-0">
              <ShieldAlert size={24} />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase italic leading-tight">National Command War Room</h1>
          </div>
          <p className="text-slate-500 font-mono text-[10px] sm:text-xs uppercase tracking-widest">
            Strategic Intelligence Dashboard • Real-time Aggregated Analytics • Nepal 2026
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Last Updated</p>
            <p className="text-sm font-mono text-emerald-500">{new Date(data.timestamp).toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={fetchAnalytics}
            disabled={refreshing}
            className={`p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-slate-400 ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
          <button className="flex-1 lg:flex-none px-4 sm:px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 text-sm">
            <FileText size={18} /> <span className="hidden sm:inline">Generate Executive Report</span><span className="sm:hidden">Report</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Core Metrics & Charts */}
        <div className="xl:col-span-8 space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Users size={20} />
                </div>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Volunteers</p>
              <p className="text-2xl font-black text-white">{analytics.volunteers.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                  <Target size={20} />
                </div>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase">82% Goal</span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booth Readiness</p>
              <p className="text-2xl font-black text-white">
                {analytics.booths.find((b: any) => b.status === 'READY')?._count.id || 0} / {analytics.booths.reduce((acc: number, curr: any) => acc + curr._count.id, 0)}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <DollarSign size={20} />
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Active</span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fundraising Goal</p>
              <p className="text-2xl font-black text-white">
                {Math.round((analytics.fundraising.reduce((acc: number, curr: any) => acc + curr.currentAmount, 0) / analytics.fundraising.reduce((acc: number, curr: any) => acc + curr.goalAmount, 1)) * 100)}%
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                  <AlertTriangle size={20} />
                </div>
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase">Critical</span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Incidents</p>
              <p className="text-2xl font-black text-white">
                {analytics.incidents.find((i: any) => i.status === 'REPORTED')?._count.id || 0}
              </p>
            </div>
          </div>

          {/* District Strength Chart */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-white uppercase tracking-wider flex items-center gap-2 italic">
                <BarChart3 size={20} className="text-emerald-500" />
                Regional Strength Analysis
              </h3>
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> NUP Strength
                </div>
                <div className="flex items-center gap-1.5 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div> Opposition
                </div>
                <div className="flex items-center gap-1.5 text-blue-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Swing Voters
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="strength" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opposition" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="swing" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booth Status Pie */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
              <h3 className="font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2 italic">
                <Map size={20} className="text-blue-500" />
                Booth Readiness Distribution
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={boothData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {boothData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {boothData.map((item: any, index: number) => (
                  <div key={item.name} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    {item.name}: {item.value}
                  </div>
                ))}
              </div>
            </div>

            {/* Grievance Status Bar */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
              <h3 className="font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2 italic">
                <MessageSquare size={20} className="text-purple-500" />
                Grievance & Issue Tracking
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={grievanceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} hide />
                    <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={8} width={100} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Strategic Summary & Alerts */}
        <div className="xl:col-span-4 space-y-6">
          {/* AI Strategic Summary */}
          <div className="bg-slate-900/50 border border-emerald-500/20 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit size={120} className="text-emerald-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-md">
                  <BrainCircuit size={18} />
                </div>
                <h3 className="font-black text-white uppercase tracking-wider italic">AI Strategic Summary</h3>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-slate-400 font-sans leading-relaxed">
                <ReactMarkdown>{aiSummary}</ReactMarkdown>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest">Powered by Gemini Strategic Engine</span>
                <button className="text-[10px] font-bold text-white uppercase tracking-widest hover:text-emerald-500 transition-colors flex items-center gap-1">
                  Full Analysis <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Risk Alerts */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2 italic">
              <AlertTriangle size={20} className="text-red-500" />
              Strategic Risk Alerts
            </h3>
            <div className="space-y-4">
              {analytics.incidents.length > 0 ? analytics.incidents.map((incident: any, idx: number) => (
                <div key={idx} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex gap-3">
                  <div className="mt-1 text-red-500">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                      {incident.severity} SEVERITY INCIDENT
                    </p>
                    <p className="text-xs text-slate-400">
                      {incident._count.id} incidents currently in {incident.status} status. Immediate attention required in affected districts.
                    </p>
                  </div>
                </div>
              )) : (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex gap-3">
                  <div className="mt-1 text-emerald-500">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">ALL CLEAR</p>
                    <p className="text-xs text-slate-400">No critical incidents reported in the last 24 hours.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* National Readiness Gauge */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
            <h3 className="font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2 italic">
              <Globe size={20} className="text-blue-500" />
              National Readiness Index
            </h3>
            <div className="flex flex-col items-center py-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-slate-800"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * 76) / 100}
                    strokeLinecap="round"
                    className="text-emerald-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white">76%</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ready</span>
                </div>
              </div>
              <div className="mt-6 w-full space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Voter Outreach</span>
                  <span className="text-[10px] font-mono text-emerald-500">64%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[64%]"></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Booth Verification</span>
                  <span className="text-[10px] font-mono text-blue-500">89%</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[89%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
