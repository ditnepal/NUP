import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
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
  Globe,
  Activity,
  Zap,
  Printer,
  Copy,
  Check
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
  const [copied, setCopied] = useState(false);

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
      if (response) {
        const summary = await aiService.generateStrategicSummary(response);
        setAiSummary(summary);
      }
    } catch (err) {
      console.error('Failed to fetch War Room analytics', err);
      setError('Failed to load strategic data. Ensure you have sufficient permissions.');
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

  const analytics = data;

  // Prepare chart data
  const boothCounts = (analytics.booths || {}) as Record<string, number>;
  const boothData = Object.entries(boothCounts).map(([name, count]) => ({ name, value: count }));
  const totalBooths = Object.values(boothCounts).reduce((acc, curr) => acc + curr, 0);
  const readyBooths = boothCounts.READY || 0;
  const readinessPercent = totalBooths > 0 ? Math.round((readyBooths / totalBooths) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!data) return;
    
    const summary = `
STRATEGIC COMMAND SUMMARY - ${data.scopeName}
Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}

EXECUTIVE METRICS:
- Total Volunteers: ${data.volunteers.toLocaleString()}
- Booth Readiness: ${readyBooths} / ${totalBooths} (${readinessPercent}%)
- Open Incidents: ${data.incidents.find((i: any) => i.status === 'REPORTED')?._count.id || 0}
- Open Grievances: ${Object.values(data.grievances || {}).reduce((a: any, b: any) => a + b, 0)}

CRITICAL PRIORITIES:
${data.attentionNeeded?.slice(0, 3).map((item: any) => `- [${item.priority}] ${item.type}: ${item.title} (${item.location})`).join('\n') || 'None identified'}

TOP HOTSPOTS:
${data.hotspots?.slice(0, 3).map((spot: any) => `- ${spot.name}: ${spot.totalIssues} issues`).join('\n') || 'None detected'}

AI STRATEGIC SUMMARY:
${aiSummary || 'Analysis pending...'}
    `.trim();

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const grievanceData = Object.entries(analytics.grievances || {}).map(([name, count]) => ({ name, value: count }));
  const areaScores = (analytics.areaScores || []).map((s: any) => ({ 
    name: s.orgUnit.name, 
    strength: s.partyStrength, 
    opposition: s.oppositionStrength,
    swing: s.swingVoters
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-6 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-slate-800 pb-6"
      >
        <div className="w-full lg:w-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 flex-shrink-0">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase italic leading-tight">National Command War Room</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] font-black rounded uppercase tracking-widest border border-emerald-500/30">
                  Scope: {data?.scopeName || 'National'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest">
                  Strategic Intelligence Dashboard • Nepal 2026
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto print:hidden">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Last Updated</p>
            <p className="text-sm font-mono text-emerald-500">{new Date(data.timestamp).toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={fetchAnalytics}
            disabled={refreshing}
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-slate-400"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={handleCopySummary}
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-slate-400"
            title="Copy Summary"
          >
            {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
          </button>
          <button 
            onClick={handlePrint}
            className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all text-slate-400"
            title="Print Report"
          >
            <Printer size={20} />
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 lg:flex-none px-4 sm:px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 text-sm"
          >
            <FileText size={18} /> <span className="hidden sm:inline">Generate Executive Report</span><span className="sm:hidden">Report</span>
          </button>
        </div>
      </motion.header>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Leadership Snapshot / Executive Summary */}
        <motion.div
          variants={itemVariants}
          className="bg-slate-900/50 border border-emerald-500/30 p-6 rounded-2xl relative overflow-hidden print:border-slate-300 print:bg-white print:text-black"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 print:hidden">
            <FileText size={120} className="text-emerald-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg print:bg-slate-100">
                  <Activity className="w-5 h-5 text-emerald-500 print:text-slate-900" />
                </div>
                <h2 className="text-lg font-black text-white uppercase italic tracking-wider print:text-black">Executive Leadership Snapshot</h2>
              </div>
              <button 
                onClick={handleCopySummary}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all print:hidden"
              >
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy Summary'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 print:text-slate-700 print:border-slate-200">Operational Readiness</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 print:text-slate-600">Booth Deployment</span>
                  <span className="text-lg font-black text-white print:text-black">{readinessPercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 print:text-slate-600">Active Volunteers</span>
                  <span className="text-lg font-black text-white print:text-black">{data.volunteers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 print:text-slate-600">Fundraising Progress</span>
                  <span className="text-lg font-black text-white print:text-black">
                    {Math.round((data.fundraising.reduce((acc: number, curr: any) => acc + curr.currentAmount, 0) / data.fundraising.reduce((acc: number, curr: any) => acc + curr.goalAmount, 1)) * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 print:text-slate-700 print:border-slate-200">Critical Signals</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 print:text-slate-600">Open Incidents</span>
                  <span className="text-lg font-black text-red-500">{data.incidents.find((i: any) => i.status === 'REPORTED')?._count.id || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 print:text-slate-600">Pending Grievances</span>
                  <span className="text-lg font-black text-amber-500">{(Object.values(data.grievances || {}) as number[]).reduce((a: number, b: number) => a + b, 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 print:text-slate-600">Avg Sentiment</span>
                  <span className="text-lg font-black text-blue-500">
                    {Math.round(data.pgisOverview?.avgSentiment || 0)}/100
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2 print:text-slate-700 print:border-slate-200">Strategic Hotspots</h3>
                <div className="space-y-2">
                  {data.hotspots?.slice(0, 3).map((spot: any) => (
                    <div key={spot.id} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold print:text-slate-600">{spot.name}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono print:bg-slate-100 print:text-slate-900">{spot.totalIssues} Issues</span>
                    </div>
                  ))}
                  {(!data.hotspots || data.hotspots.length === 0) && (
                    <p className="text-xs text-slate-600 italic">No hotspots identified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Command Layer: Critical Priorities & Hotspots */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Critical Priorities / Attention Needed */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-900/50 border border-red-500/20 p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-black text-white uppercase italic tracking-wider">Critical Priorities</h2>
              </div>
              <span className="px-2 py-1 bg-red-500/20 text-red-500 text-[10px] font-black rounded uppercase tracking-widest animate-pulse">
                Immediate Action
              </span>
            </div>

            <div className="space-y-3">
              {data.attentionNeeded && data.attentionNeeded.length > 0 ? (
                data.attentionNeeded?.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-800 hover:border-red-500/30 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
                          item.type === 'INCIDENT' ? 'bg-orange-500/20 text-orange-500' : 'bg-blue-500/20 text-blue-500'
                        }`}>
                          {item.type}
                        </span>
                        <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">
                          {item.priority}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Map size={12} />
                          {item.location || 'Unknown'}
                        </span>
                        <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 font-mono text-xs uppercase tracking-widest">
                  No critical priorities identified
                </div>
              )}
            </div>
          </motion.div>

          {/* Unit-Level Hotspots */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-amber-500" />
                </div>
                <h2 className="text-lg font-black text-white uppercase italic tracking-wider">Unit-Level Hotspots</h2>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Top 5 by Volume</span>
            </div>

            <div className="space-y-3">
              {data.hotspots && data.hotspots.length > 0 ? (
                data.hotspots?.map((spot: any, idx: number) => (
                  <div key={spot.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-600 w-4">{idx + 1}</span>
                      <div>
                        <h3 className="text-sm font-bold text-white">{spot.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                            {spot.grievanceCount} Grievances
                          </span>
                          <span className="text-[9px] text-slate-700">•</span>
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
                            {spot.incidentCount} Incidents
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-amber-500 leading-none">{spot.totalIssues}</div>
                      <div className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Total</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 font-mono text-xs uppercase tracking-widest">
                  No hotspots detected
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Core Metrics & Charts */}
        <div className="xl:col-span-8 space-y-6">
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Volunteers</p>
              <p className="text-2xl font-black text-white">{data.volunteers.toLocaleString()}</p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg group-hover:scale-110 transition-transform">
                  <Target size={20} />
                </div>
                <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase">{readinessPercent}% Goal</span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Booth Readiness</p>
              <p className="text-2xl font-black text-white">
                {readyBooths} / {totalBooths}
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-emerald-500/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg group-hover:scale-110 transition-transform">
                  <DollarSign size={20} />
                </div>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">Active</span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fundraising Goal</p>
              <p className="text-2xl font-black text-white">
                {Math.round((analytics.fundraising.reduce((acc: number, curr: any) => acc + curr.currentAmount, 0) / analytics.fundraising.reduce((acc: number, curr: any) => acc + curr.goalAmount, 1)) * 100)}%
              </p>
            </motion.div>
            <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl hover:border-red-500/30 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg group-hover:scale-110 transition-transform">
                  <AlertTriangle size={20} />
                </div>
                <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase">Critical</span>
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Incidents</p>
              <p className="text-2xl font-black text-white">
                {analytics.incidents.find((i: any) => i.status === 'REPORTED')?._count.id || 0}
              </p>
            </motion.div>
          </div>

          {/* Unified Ground Signals Feed */}
          <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-black text-white uppercase tracking-wider flex items-center gap-2 italic">
                <Zap size={20} className="text-amber-500" />
                Unified Ground Signals
              </h3>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Intelligence Feed</span>
            </div>
            <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto scrollbar-hide">
              {analytics.recentSignals && analytics.recentSignals.length > 0 ? (
                analytics.recentSignals?.map((signal: any, idx: number) => (
                  <div key={idx} className="p-4 hover:bg-slate-800/30 transition-colors flex gap-4">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      signal.priority === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                      signal.priority === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{signal.source} • {signal.type}</span>
                        <span className="text-[10px] font-mono text-slate-600">{new Date(signal.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium leading-relaxed">{signal.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No active signals detected</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* District Strength Chart */}
          <motion.div variants={itemVariants} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
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
          </motion.div>

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
              {analytics.incidents?.length > 0 ? analytics.incidents?.map((incident: any, idx: number) => (
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
                    strokeDashoffset={440 - (440 * readinessPercent) / 100}
                    strokeLinecap="round"
                    className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{readinessPercent}%</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Operational</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full mt-6">
                <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Booths Ready</p>
                  <p className="text-sm font-black text-white">{readyBooths}</p>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800">
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Volunteers</p>
                  <p className="text-sm font-black text-white">{analytics.volunteers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);
}
