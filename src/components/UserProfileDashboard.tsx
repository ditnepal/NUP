import React from 'react';
import { UserProfile } from '../types';
import { 
  User, 
  Mail, 
  Shield, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Award, 
  Clock,
  Settings,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  Camera
} from 'lucide-react';

interface UserProfileDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export const UserProfileDashboard: React.FC<UserProfileDashboardProps> = ({ user, onLogout }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stats = [
    { label: 'Campaigns Managed', value: '12', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Supporters Added', value: '450', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Reports Filed', value: '28', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-3xl border-4 border-white shadow-lg overflow-hidden">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button className="absolute bottom-2 right-2 p-2 bg-white rounded-xl shadow-md text-slate-600 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100">
                <Camera size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{user.displayName}</h1>
            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
              <Shield size={16} className="text-emerald-500" />
              {user.role.replace('_', ' ')}
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl">
                <Mail size={14} />
                {user.email}
              </div>
              {user.partyRole && (
                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl">
                  <Briefcase size={14} />
                  {user.partyRole}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl">
                <Calendar size={14} />
                Joined {formatDate(user.createdAt)}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
              Edit Profile
            </button>
            <button className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
                  <stat.icon size={24} />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Organizational Context */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Organizational Context</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Assigned Committee</label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Central Working Committee</p>
                      <p className="text-xs text-slate-500">National Level • Kathmandu</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reporting To</label>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=manager" alt="Manager" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">General Secretary</p>
                      <p className="text-xs text-slate-500">National Secretariat</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Primary Responsibilities</label>
                  <ul className="mt-2 space-y-2">
                    {['Strategic Planning', 'Field Coordination', 'Data Analysis'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Actions */}
        <div className="space-y-8">
          {/* Quick Settings */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Quick Settings</h3>
            </div>
            <div className="p-2">
              {[
                { label: 'Notifications', icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Security & Privacy', icon: Lock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Account Preferences', icon: Settings, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                      <item.icon size={20} />
                    </div>
                    <span className="font-bold text-slate-700">{item.label}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-all" />
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 p-4 text-rose-500 font-bold hover:bg-rose-50 rounded-2xl transition-all"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Activity Feed (Mini) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Recent Activity</h3>
            </div>
            <div className="p-6 space-y-6">
              {[
                { action: 'Updated Campaign', time: '2 hours ago', detail: 'National Outreach 2026' },
                { action: 'Added Supporter', time: '5 hours ago', detail: 'Ram Bahadur, Kaski' },
                { action: 'Logged In', time: 'Yesterday', detail: 'from Kathmandu, NP' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-2 h-2 bg-slate-200 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.detail}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
