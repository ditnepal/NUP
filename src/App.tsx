import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Login } from './components/Login';
import { CampaignsView } from './components/CampaignsView';
import { SupportersView } from './components/SupportersView';
import { BoothsView } from './components/BoothsView';
import { HierarchyAdmin } from './components/HierarchyAdmin';
import { MembershipAdmin } from './components/MembershipAdmin';
import { VolunteerAdmin } from './components/VolunteerAdmin';
import { DocumentsView } from './components/DocumentsView';
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
import MembershipPublic from './components/MembershipPublic';
import { PublicDocumentsView } from './components/PublicDocumentsView';
import { WarRoomDashboard } from './components/WarRoomDashboard';
import { UserProfileDashboard } from './components/UserProfileDashboard';
import { MemberDashboard } from './components/MemberDashboard';
import { EventDetailView } from './components/EventDetailView';
import { UserProfile, Campaign, Supporter, Booth } from './types';
import { api } from './lib/api';
import { LayoutDashboard, Megaphone, Users, MapPin, LogOut, Globe, GitGraph, UserPlus, Heart, Layout, ExternalLink, MessageSquare, GraduationCap, Calendar, DollarSign, Vote, UserCheck, ShieldAlert, ClipboardList, Shield, Menu, X as CloseIcon, Award, FileText } from 'lucide-react';

type View = 'dashboard' | 'campaigns' | 'supporters' | 'booths' | 'hierarchy' | 'membership' | 'volunteers' | 'cms' | 'documents' | 'communication' | 'training' | 'events' | 'finance' | 'election' | 'candidate-dashboard' | 'donations' | 'public' | 'membership-public' | 'grievances' | 'surveys' | 'pgis' | 'warroom' | 'profile' | 'member-dashboard' | 'event-detail' | 'public-documents';

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);

  useEffect(() => {
    // Close sidebar on view change on mobile
    setIsSidebarOpen(false);
  }, [currentView]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.get('/auth/me');
          setUser(userData);
          if (userData.role === 'MEMBER') {
            setCurrentView('member-dashboard');
          } else {
            setCurrentView('dashboard');
          }
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
    if (userData.role === 'MEMBER') {
      setCurrentView('member-dashboard');
    } else {
      setCurrentView('dashboard');
    }
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentView('dashboard');
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'FIELD_COORDINATOR'] },
    { id: 'member-dashboard', label: 'Member Portal', icon: Award, roles: ['MEMBER'] },
    { id: 'warroom', label: 'War Room', icon: ShieldAlert, roles: ['ADMIN', 'STAFF'] },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone, roles: ['ADMIN', 'STAFF', 'FIELD_COORDINATOR'] },
    { id: 'supporters', label: 'Supporters', icon: Users, roles: ['ADMIN', 'STAFF', 'FIELD_COORDINATOR'] },
    { id: 'booths', label: 'Booths', icon: MapPin, roles: ['ADMIN', 'STAFF', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR'] },
    { id: 'hierarchy', label: 'Hierarchy', icon: GitGraph, roles: ['ADMIN'] },
    { id: 'membership', label: 'Membership', icon: UserPlus, roles: ['ADMIN', 'STAFF'] },
    { id: 'volunteers', label: 'Volunteers', icon: Heart, roles: ['ADMIN', 'STAFF'] },
    { id: 'cms', label: 'CMS', icon: Layout, roles: ['ADMIN', 'STAFF'] },
    { id: 'documents', label: 'Documents', icon: FileText, roles: ['ADMIN', 'STAFF', 'MEMBER'] },
    { id: 'communication', label: 'Communication', icon: MessageSquare, roles: ['ADMIN', 'STAFF'] },
    { id: 'training', label: 'Training', icon: GraduationCap, roles: ['ADMIN', 'STAFF', 'MEMBER', 'FIELD_COORDINATOR'] },
    { id: 'events', label: 'Events', icon: Calendar, roles: ['ADMIN', 'STAFF', 'MEMBER'] },
    { id: 'finance', label: 'Finance', icon: DollarSign, roles: ['ADMIN', 'FINANCE_OFFICER'] },
    { id: 'election', label: 'Election', icon: Vote, roles: ['ADMIN', 'STAFF'] },
    { id: 'candidate-dashboard', label: 'Candidate', icon: UserCheck, roles: ['ADMIN', 'STAFF'] },
    { id: 'grievances', label: 'Grievances', icon: ShieldAlert, roles: ['ADMIN', 'STAFF', 'MEMBER'] },
    { id: 'surveys', label: 'Surveys', icon: ClipboardList, roles: ['ADMIN', 'STAFF', 'MEMBER'] },
    { id: 'pgis', label: 'PGIS', icon: Shield, roles: ['ADMIN', 'STAFF'] },
  ];

  const filteredNavItems = navItems.filter(item => !item.roles || item.roles.includes(user.role));

  if (currentView === 'public') {
    return (
      <div className="relative">
        <PublicPortal user={user} onPortalClick={() => setCurrentView(user.role === 'MEMBER' ? 'member-dashboard' : 'dashboard')} onDocumentsClick={() => setCurrentView('public-documents')} onJoinClick={() => setCurrentView('membership-public')} />
        <button 
          onClick={() => setCurrentView(user.role === 'MEMBER' ? 'member-dashboard' : 'dashboard')}
          className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl z-50 flex items-center gap-2 hover:scale-105 transition-all"
        >
          <LayoutDashboard size={20} />
          Back to Portal
        </button>
      </div>
    );
  }

  if (currentView === 'membership-public') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <button onClick={() => setCurrentView('public')} className="mb-6 text-slate-600 hover:text-slate-900 font-bold">← Back to Public Portal</button>
        <MembershipPublic />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 text-emerald-600">
          <Globe size={24} />
          <span className="font-black text-xl tracking-tight text-slate-800">PPOS</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50 transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100 hidden lg:block">
          <div className="flex items-center gap-3 text-emerald-600">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Globe size={24} />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-800">PPOS</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-emerald-50 text-emerald-600' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <button 
            onClick={() => setCurrentView('donations')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-all"
          >
            <Heart size={18} />
            Donation Portal
          </button>
          <button 
            onClick={() => setCurrentView('public')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-all"
          >
            <ExternalLink size={18} />
            Public Portal
          </button>
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-slate-500 hover:bg-slate-50 transition-all"
          >
            <Globe size={18} />
            {i18n.language === 'en' ? 'नेपाली' : 'English'}
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Welcome, {user.displayName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {user.role.replace('_', ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} | Political Party Organization System
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationCenter />
            <button 
              onClick={() => setCurrentView('profile')}
              className="flex items-center gap-3 sm:gap-4 hover:bg-slate-100 p-1 rounded-2xl transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user.displayName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                />
              </div>
            </button>
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
                {campaigns.filter(c => c.status === 'ACTIVE').length}
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
        {currentView === 'documents' && <DocumentsView />}
        {currentView === 'public-documents' && <PublicDocumentsView />}
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
        {currentView === 'profile' && <UserProfileDashboard user={user} onLogout={handleLogout} />}
        {currentView === 'member-dashboard' && (
          <MemberDashboard 
            user={user} 
            onViewEvent={(id) => {
              setSelectedEventId(id);
              setCurrentView('event-detail');
            }}
          />
        )}
        {currentView === 'event-detail' && selectedEventId && (
          <EventDetailView 
            eventId={selectedEventId} 
            user={user}
            onBack={() => setCurrentView('member-dashboard')} 
          />
        )}
      </main>
    </div>
  );
}
