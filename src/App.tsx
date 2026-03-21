import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Login } from './components/Login';
import { CampaignsView } from './components/CampaignsView';
import { SupportersView } from './components/SupportersView';
import { BoothsView } from './components/BoothsView';
import { HierarchyAdmin } from './components/HierarchyAdmin';
import { MembershipAdmin } from './components/MembershipAdmin';
import { VolunteerAdmin } from './components/VolunteerAdmin';
import { CmsAdmin } from './components/CmsAdmin';
import { CommunicationAdmin } from './components/CommunicationAdmin';
import { TrainingPortal } from './components/TrainingPortal';
import { NotificationCenter } from './components/NotificationCenter';
import { EventsAdmin } from './components/EventsAdmin';
import { FinanceAdmin } from './components/FinanceAdmin';
import { DonationPortal } from './components/DonationPortal';
import { ElectionAdmin } from './components/ElectionAdmin';
import { CandidateDashboard } from './components/CandidateDashboard';
import { GrievancePortal } from './components/GrievancePortal';
import { SurveyPolls } from './components/SurveyPolls';
import { PgisDashboard } from './components/PgisDashboard';
import { PublicPortal } from './components/PublicPortal';
import { WarRoomDashboard } from './components/WarRoomDashboard';
import { UserProfile, Campaign, Supporter, Booth } from './types';
import { api } from './lib/api';
import { LayoutDashboard, Megaphone, Users, MapPin, LogOut, Globe, GitGraph, UserPlus, Heart, Layout, ExternalLink, MessageSquare, GraduationCap, Calendar, DollarSign, Vote, UserCheck, ShieldAlert, ClipboardList, Shield } from 'lucide-react';

type View = 'dashboard' | 'campaigns' | 'supporters' | 'booths' | 'hierarchy' | 'membership' | 'volunteers' | 'cms' | 'communication' | 'training' | 'events' | 'finance' | 'election' | 'candidate-dashboard' | 'donations' | 'public' | 'grievances' | 'surveys' | 'pgis' | 'warroom';

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // In a real app, we'd verify the token and get user info
          // For now, we'll assume it's valid if present
          const userData = await api.get('/auth/me');
          setUser(userData);
          fetchData();
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const fetchData = async () => {
    try {
      const [campaignsData, supportersResponse, boothsData] = await Promise.all([
        api.get('/campaigns'),
        api.get('/supporters'),
        api.get('/booths')
      ]);
      setCampaigns(campaignsData);
      setSupporters(supportersResponse.data || []);
      setBooths(boothsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLoginSuccess = (userData: UserProfile) => {
    setUser(userData);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ne' : 'en';
    i18n.changeLanguage(newLang);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} t={t} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'warroom', label: 'War Room', icon: ShieldAlert },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'supporters', label: 'Supporters', icon: Users },
    { id: 'booths', label: 'Booths', icon: MapPin },
    { id: 'hierarchy', label: 'Hierarchy', icon: GitGraph },
    { id: 'membership', label: 'Membership', icon: UserPlus },
    { id: 'volunteers', label: 'Volunteers', icon: Heart },
    { id: 'cms', label: 'CMS', icon: Layout },
    { id: 'communication', label: 'Communication', icon: MessageSquare },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'election', label: 'Election', icon: Vote },
    { id: 'candidate-dashboard', label: 'Candidate', icon: UserCheck },
    { id: 'grievances', label: 'Grievances', icon: ShieldAlert },
    { id: 'surveys', label: 'Surveys', icon: ClipboardList },
    { id: 'pgis', label: 'PGIS', icon: Shield },
  ];

  if (currentView === 'public') {
    return (
      <div className="relative">
        <PublicPortal />
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl z-50 flex items-center gap-2 hover:scale-105 transition-all"
        >
          <LayoutDashboard size={20} />
          Back to Admin
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Globe size={24} />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800">PPOS</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button 
            onClick={() => setCurrentView('donations')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-all"
          >
            <Heart size={20} />
            Donation Portal
          </button>
          <button 
            onClick={() => setCurrentView('public')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-all"
          >
            <ExternalLink size={20} />
            View Public Portal
          </button>
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-all"
          >
            <Globe size={20} />
            {i18n.language === 'en' ? 'नेपाली' : 'English'}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Welcome, {user.displayName}
            </h1>
            <p className="text-slate-500 mt-1">
              {user.role.replace('_', ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} | Political Party Organization System
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">{user.displayName}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="w-12 h-12 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
              <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                alt="Avatar"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </header>

        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Total Supporters</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{supporters.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Active Campaigns</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {campaigns.filter(c => c.phase === 'active').length}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Total Booths</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{booths.length}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Ready Booths</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {booths.filter(b => b.status === 'ready').length}
              </p>
            </div>
          </div>
        )}

        {currentView === 'campaigns' && <CampaignsView campaigns={campaigns} />}
        {currentView === 'supporters' && <SupportersView supporters={supporters} />}
        {currentView === 'booths' && <BoothsView booths={booths} />}
        {currentView === 'hierarchy' && <HierarchyAdmin />}
        {currentView === 'membership' && <MembershipAdmin />}
        {currentView === 'volunteers' && <VolunteerAdmin />}
        {currentView === 'cms' && <CmsAdmin />}
        {currentView === 'communication' && <CommunicationAdmin />}
        {currentView === 'training' && <TrainingPortal />}
        {currentView === 'events' && <EventsAdmin />}
        {currentView === 'finance' && <FinanceAdmin />}
        {currentView === 'election' && <ElectionAdmin />}
        {currentView === 'candidate-dashboard' && <CandidateDashboard />}
        {currentView === 'grievances' && <GrievancePortal />}
        {currentView === 'surveys' && <SurveyPolls />}
        {currentView === 'pgis' && <PgisDashboard />}
        {currentView === 'warroom' && <WarRoomDashboard />}
        {currentView === 'donations' && <DonationPortal />}
      </main>
    </div>
  );
}
