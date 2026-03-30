import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UserProfile } from '../types';
import { 
  Users, 
  LayoutDashboard, 
  UserCheck, 
  Clock, 
  Award, 
  Heart, 
  Activity, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  ChevronRight,
  Globe,
  Zap,
  CheckCircle2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PortalCenterProps {
  user: UserProfile;
  setCurrentView: (view: any) => void;
}

export const PortalCenter: React.FC<PortalCenterProps> = ({ user, setCurrentView }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'journey' | 'health' | 'links'>('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, summaryData] = await Promise.all([
        api.get('/users'),
        api.get('/dashboard/summary')
      ]);
      setUsers(usersData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching Portal Center data:', error);
    } finally {
      setLoading(false);
    }
  };

  const registeredUsers = users.filter(u => u.role === 'PUBLIC');
  const filteredRegisteredUsers = registeredUsers.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const journeySteps = [
    { 
      id: 'public', 
      title: 'Registered Public User', 
      description: 'Initial entry point for citizens. Can report grievances and view public content.',
      icon: Users,
      color: 'slate',
      status: 'Entry Level'
    },
    { 
      id: 'applicant', 
      title: 'Membership Applicant', 
      description: 'Public users who have submitted a membership application. Awaiting verification.',
      icon: Clock,
      color: 'amber',
      status: 'Verification Phase'
    },
    { 
      id: 'member', 
      title: 'Approved Member', 
      description: 'Verified party members with full voting rights and official ID cards.',
      icon: Award,
      color: 'emerald',
      status: 'Official Status'
    },
    { 
      id: 'volunteer', 
      title: 'Volunteer', 
      description: 'Members or supporters who actively contribute skills to party campaigns.',
      icon: Heart,
      color: 'rose',
      status: 'Active Engagement'
    }
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Portal Center</h2>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <Globe size={16} className="text-emerald-500" />
            Admin Support for the Centralized Public User Dashboard
          </p>
        </div>
        
        <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200 shadow-inner overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'users', label: 'Registered Users', icon: Users },
            { id: 'journey', label: 'User Journey', icon: Zap },
            { id: 'health', label: 'Data Health', icon: Activity },
            { id: 'links', label: 'Quick Links', icon: ExternalLink },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                activeSection === tab.id 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registered Public Users</p>
              <h3 className="text-3xl font-black text-slate-900">{registeredUsers.length}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Independent active app users</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                <Clock size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Applications</p>
              <h3 className="text-3xl font-black text-slate-900">{users.filter(u => u.role === 'APPLICANT_MEMBER').length}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Awaiting membership verification</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                <Activity size={24} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Portal Engagement</p>
              <h3 className="text-3xl font-black text-slate-900">High</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">Based on recent user activity</p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tight">Centralized Public User Dashboard</h3>
                <p className="text-slate-400 max-w-xl font-medium">
                  This module provides administrative oversight for the public-facing dashboard. 
                  Monitor user registration, track the journey from public supporter to official member, 
                  and ensure data integrity across the self-service ecosystem.
                </p>
              </div>
              <button 
                onClick={() => window.open('/?view=public', '_blank')}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
              >
                View Public Dashboard <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'users' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search registered users..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Registration Date</th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredRegisteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500">
                            {u.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{u.displayName}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          u.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setCurrentView('users')}
                          className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          <ArrowRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRegisteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                        No registered users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'journey' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {journeySteps.map((step, i) => (
            <div key={step.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${step.color}-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform`} />
              <div className="relative z-10">
                <div className={`w-14 h-14 bg-${step.color}-50 text-${step.color}-600 rounded-2xl flex items-center justify-center mb-6`}>
                  <step.icon size={28} />
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {i + 1}</span>
                  <span className={`px-2 py-0.5 bg-${step.color}-100 text-${step.color}-700 text-[9px] font-black rounded-full uppercase tracking-widest`}>
                    {step.status}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{step.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeSection === 'health' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight flex items-center gap-3">
                <ShieldCheck size={24} className="text-emerald-500" />
                Verification Health
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-400">Email Verified</span>
                    <span className="text-emerald-600">92%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-400">Profile Completion</span>
                    <span className="text-blue-600">78%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-400">Identity Documents</span>
                    <span className="text-amber-600">64%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '64%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight flex items-center gap-3">
                <AlertCircle size={24} className="text-rose-500" />
                Data Integrity Alerts
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-rose-900">Duplicate Registrations</p>
                    <p className="text-xs text-rose-700">3 potential duplicate accounts detected based on mobile numbers.</p>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                  <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Incomplete Applications</p>
                    <p className="text-xs text-amber-700">12 users have started membership applications but not finished.</p>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">System Sync</p>
                    <p className="text-xs text-emerald-700">All portal data is currently synchronized with the core database.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'links' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'membership', label: 'Membership Management', icon: UserCheck, desc: 'Review and approve membership applications.' },
            { id: 'volunteers', label: 'Volunteer Management', icon: Heart, desc: 'Coordinate and assign tasks to active volunteers.' },
            { id: 'cms', label: 'CMS Admin', icon: LayoutDashboard, desc: 'Manage public content and announcements.' },
            { id: 'grievances', label: 'Grievance Portal', icon: ShieldCheck, desc: 'Respond to and track citizen grievances.' },
            { id: 'settings', label: 'System Settings', icon: Activity, desc: 'Configure portal features and permissions.' },
            { id: 'documents', label: 'Document Library', icon: Info, desc: 'Manage official party documents and resources.' },
          ].map((link) => (
            <button 
              key={link.id}
              onClick={() => setCurrentView(link.id)}
              className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <link.icon size={24} />
              </div>
              <h4 className="font-black text-slate-800 uppercase tracking-tight mb-1">{link.label}</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{link.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Go to Module <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
