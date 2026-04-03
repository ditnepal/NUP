import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Login } from './components/Login';
import { CampaignsView } from './components/CampaignsView';
import { SupportersView } from './components/SupportersView';
import { BoothsView } from './components/BoothsView';
import { HierarchyAdmin } from './components/HierarchyAdmin';
import { MembershipAdmin } from './components/MembershipAdmin';
import RenewalsManagement from './pages/admin/RenewalsManagement';
import { VolunteerAdmin } from './components/VolunteerAdmin';
import { VolunteerEnrollment } from './components/VolunteerEnrollment';
import { DocumentsView } from './components/DocumentsView';
import { CmsAdmin } from './components/CmsAdmin';
import { CommunicationAdmin } from './components/CommunicationAdmin';
import { NoticeAdmin } from './components/NoticeAdmin';
import { TrainingPortal } from './components/TrainingPortal';
import { TrainingAdmin } from './components/TrainingAdmin';
import { NotificationCenter } from './components/NotificationCenter';
import { AppEventsAdmin } from './components/AppEventsAdmin';
import { EventsAdmin } from './components/EventsAdmin';
import { FinanceAdmin } from './components/FinanceAdmin';
import { FundraiserAdmin } from './components/FundraiserAdmin';
import { DonationPortal } from './components/DonationPortal';
import { ElectionAdmin } from './components/ElectionAdmin';
import { CandidateDashboard } from './components/CandidateDashboard';
import { GrievancePortal } from './components/GrievancePortal';
import { SurveyPolls } from './components/SurveyPolls';
import { PgisDashboard } from './components/PgisDashboard';
import { PublicPortal } from './components/PublicPortal';
import { PublicLayout } from './components/PublicLayout';
import MembershipPublic from './components/MembershipPublic';
import { PublicDocumentsView } from './components/PublicDocumentsView';
import { PublicCandidatesView } from './components/PublicCandidates';
import { PublicCampaignsView } from './components/PublicCampaigns';
import { WarRoomDashboard } from './components/WarRoomDashboard';
import { DashboardHome } from './components/DashboardHome';
import { CentralizedPublicDashboard } from './components/CentralizedPublicDashboard';
import { PublicEntry } from './components/PublicEntry';
import PublicAbout from './components/PublicAbout';
import { UserAdmin } from './components/UserAdmin';
import { PortalCenter } from './components/PortalCenter';
import { UserProfileDashboard } from './components/UserProfileDashboard';
import { EventDetailView } from './components/EventDetailView';
import { ApplicantStatusPortal } from './components/ApplicantStatusPortal';
import { PublicIdentityHub } from './components/PublicIdentityHub';
import { NoticePopup } from './components/NoticePopup';
import { SystemSettings } from './components/SystemSettings';
import { Toaster } from 'sonner';
import { UserProfile, Campaign, Supporter, Booth, AppModule, AppAction } from './types';
import { api } from './lib/api';
import { usePermissions } from './hooks/usePermissions';
import { ROLE_PERMISSIONS } from './lib/permissions';
import { LayoutDashboard, Megaphone, Users, MapPin, LogOut, Globe, GitGraph, UserPlus, Heart, Layout, ExternalLink, MessageSquare, GraduationCap, Calendar, DollarSign, Vote, UserCheck, ShieldAlert, ClipboardList, Shield, Menu, X as CloseIcon, Award, FileText, Clock, Bell, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity, Target, ListTodo, Settings, User, Zap } from 'lucide-react';

type View = 'dashboard' | 'portal-center' | 'users' | 'campaigns' | 'supporters' | 'booths' | 'hierarchy' | 'membership' | 'renewals' | 'fundraiser' | 'volunteers' | 'volunteer-hub' | 'cms' | 'documents' | 'communication' | 'notices' | 'training' | 'events' | 'field-events' | 'finance' | 'election' | 'candidate-dashboard' | 'donations' | 'donate' | 'public' | 'public-portal' | 'membership-public' | 'grievances' | 'surveys' | 'pgis' | 'warroom' | 'profile' | 'member-dashboard' | 'applicant-dashboard' | 'event-detail' | 'public-documents' | 'applicant-status' | 'settings' | 'public-candidates' | 'public-campaigns' | 'public-auth' | 'volunteer-enrollment' | 'public-about' | 'public-identity-hub';

export default function App() {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<View>(
    window.location.search.includes('view=public') ? 'public' : 'dashboard'
  );
  const [publicIntent, setPublicIntent] = useState<View | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [initialTrackingCode, setInitialTrackingCode] = useState<string>('');
  const [initialMobile, setInitialMobile] = useState<string>('');
  const [initialIsRegistering, setInitialIsRegistering] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { can } = usePermissions(user);
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const config = await api.get('/public/config');
      setSystemConfig(config);
    } catch (error) {
      console.error('Error fetching system config:', error);
    }
  };

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
          if (userData.requirePasswordChange) {
            // Force re-login to change password
            localStorage.removeItem('token');
            setUser(null);
          } else {
            setUser(userData);
            setCurrentView('dashboard');
            fetchData(userData);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const fetchData = async (userOverride?: UserProfile | null) => {
    const activeUser = userOverride || user;
    if (!activeUser) return;
    
    try {
      // Helper to check permission without relying on the hook's stale state
      const hasPermission = (module: AppModule, action: AppAction): boolean => {
        if (activeUser.role === 'ADMIN') return true;
        const allowedActions = ROLE_PERMISSIONS[activeUser.role]?.[module] || [];
        return allowedActions.includes(action);
      };

      // Only fetch data the user has permission to see
      const promises: Promise<any>[] = [];
      const keys: string[] = [];

      if (hasPermission('FUNDRAISING', 'VIEW')) {
        promises.push(api.get('/campaigns').catch(() => []));
        keys.push('campaigns');
      }
      
      if (hasPermission('SUPPORTERS', 'VIEW')) {
        promises.push(api.get('/supporters').catch(() => ({ data: [] })));
        keys.push('supporters');
      }
      
      if (hasPermission('BOOTHS', 'VIEW')) {
        promises.push(api.get('/booths').catch(() => []));
        keys.push('booths');
      }
      
      if (hasPermission('DASHBOARD', 'VIEW')) {
        promises.push(api.get('/dashboard/summary').catch(() => null));
        keys.push('summary');
      }

      if (promises.length === 0) return;

      const results = await Promise.all(promises);
      
      results.forEach((data, index) => {
        const key = keys[index];
        if (key === 'campaigns') setCampaigns(data);
        if (key === 'supporters') setSupporters(data.data || []);
        if (key === 'booths') setBooths(data);
        if (key === 'summary') setSummary(data);
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLoginSuccess = (userData: UserProfile) => {
    setUser(userData);
    
    // Route based on preserved intent, otherwise default to dashboard
    if (publicIntent === 'volunteer-enrollment') {
      setCurrentView('volunteer-hub');
    } else if (publicIntent === 'grievances') {
      setCurrentView('grievances');
    } else if (publicIntent === 'membership-public') {
      setCurrentView('membership');
    } else {
      setCurrentView('dashboard');
    }
    setPublicIntent(null);
    
    fetchData(userData);
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

  const renderPublicLayout = (children: React.ReactNode, onBack?: () => void, fullWidth?: boolean) => (
    <PublicLayout
      user={user}
      onBack={onBack || (() => setCurrentView('public'))}
      onPortalClick={() => {
        if (!user) {
          setCurrentView('public-identity-hub');
        } else {
          setCurrentView('dashboard');
        }
      }}
      onDocumentsClick={() => setCurrentView('public-documents')}
      onTrainingClick={() => setCurrentView('training')}
      onJoinClick={() => setCurrentView('membership-public')}
      onStatusClick={() => {
        setInitialTrackingCode('');
        setInitialMobile('');
        setCurrentView('public-identity-hub');
      }}
      onCandidatesClick={() => setCurrentView('public-candidates')}
      onCampaignsClick={() => setCurrentView('public-campaigns')}
      onAboutClick={() => setCurrentView('public-about')}
      onHomeClick={() => setCurrentView('public')}
      onNewsClick={() => setCurrentView('public-portal')}
      onLoginClick={() => setCurrentView('public-identity-hub')}
      onLogout={handleLogout}
    >
      {fullWidth ? children : (
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      )}
    </PublicLayout>
  );

  if (currentView === 'public') {
    return renderPublicLayout(
      <PublicEntry 
        user={user}
        systemConfig={systemConfig}
        setCurrentView={setCurrentView}
        onAccessClick={() => {
          setCurrentView('public-identity-hub');
        }}
      />,
      undefined,
      true
    );
  }

  if (currentView === 'public-portal') {
    return renderPublicLayout(
      <div className="relative">
        <PublicPortal 
          user={user} 
          onBack={() => setCurrentView('public')}
          onPortalClick={() => {
            if (!user) {
              setCurrentView('public-identity-hub');
            } else {
              setCurrentView('dashboard');
            }
          }} 
          onDocumentsClick={() => setCurrentView('public-documents')} 
          onTrainingClick={() => setCurrentView('training')}
          onJoinClick={() => setCurrentView('membership-public')}
          onDonateClick={() => setCurrentView('donations')}
          onGrievanceClick={() => setCurrentView('grievances')}
          onCandidatesClick={() => setCurrentView('public-candidates')}
          onCampaignsClick={() => setCurrentView('public-campaigns')}
          onAboutClick={() => setCurrentView('public-about')}
          onHomeClick={() => setCurrentView('public')}
          onStatusClick={() => {
            setInitialTrackingCode('');
            setInitialMobile('');
            setCurrentView('public-identity-hub');
          }}
        />
        {user && (
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl z-50 flex items-center gap-2 hover:scale-105 transition-all"
          >
            <LayoutDashboard size={20} />
            Back to Dashboard
          </button>
        )}
      </div>,
      undefined,
      true
    );
  }

  if (['public-documents', 'public-candidates', 'public-campaigns', 'public-about'].includes(currentView)) {
    return renderPublicLayout(
      <div className="relative">
        {currentView === 'public-documents' && <PublicDocumentsView onBack={() => setCurrentView('public')} />}
        {currentView === 'public-candidates' && <PublicCandidatesView onBack={() => setCurrentView('public')} />}
        {currentView === 'public-campaigns' && <PublicCampaignsView onBack={() => setCurrentView('public')} />}
        {currentView === 'public-about' && <PublicAbout onBack={() => setCurrentView('public')} />}
        {user && (
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="fixed bottom-8 right-8 bg-slate-900 text-white p-4 rounded-full shadow-2xl z-50 flex items-center gap-2 hover:scale-105 transition-all"
          >
            <LayoutDashboard size={20} />
            Back to Dashboard
          </button>
        )}
      </div>
    );
  }

  if (!user) {
    if (currentView === 'public-identity-hub') {
      return (
        <PublicIdentityHub 
          onRegisterClick={() => {
            setInitialIsRegistering(true);
            setCurrentView('public-auth');
          }}
          onLoginClick={() => {
            setInitialIsRegistering(false);
            setCurrentView('public-auth');
          }}
          onStatusClick={() => {
            setInitialTrackingCode('');
            setInitialMobile('');
            setCurrentView('applicant-status');
          }}
          onBack={() => setCurrentView('public')}
        />
      );
    }

    if (currentView === 'applicant-status') {
      return renderPublicLayout(
        <ApplicantStatusPortal 
          onBack={() => setCurrentView('public')} 
          onLoginClick={() => {
            setCurrentView('public-auth'); // Use public-auth for public entry
          }}
          initialTrackingCode={initialTrackingCode}
          initialMobile={initialMobile}
        />
      );
    }

    if (['membership-public', 'volunteer-enrollment', 'grievances'].includes(currentView)) {
      // Render the new unified identity hub instead
      return (
        <PublicIdentityHub 
          onRegisterClick={() => {
            setPublicIntent(currentView);
            setInitialIsRegistering(true);
            setCurrentView('public-auth');
          }}
          onLoginClick={() => {
            setPublicIntent(currentView);
            setInitialIsRegistering(false);
            setCurrentView('public-auth');
          }}
          onStatusClick={() => {
            setInitialTrackingCode('');
            setInitialMobile('');
            setCurrentView('applicant-status');
          }}
          onBack={() => setCurrentView('public')}
        />
      );
    }

    if (currentView === 'donations') {
      return renderPublicLayout(<DonationPortal onBack={() => setCurrentView('public')} />);
    }

    if (currentView === 'training') {
      return renderPublicLayout(<TrainingPortal user={user} onBack={() => setCurrentView('public')} />);
    }

    if (currentView === 'public-auth') {
      return (
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          onGoToPublic={() => setCurrentView('public')} 
          t={t} 
          isPublicMode={true}
          initialIsRegistering={initialIsRegistering}
          variant="public"
        />
      );
    }
    return <Login 
      onLoginSuccess={handleLoginSuccess} 
      onGoToPublic={() => setCurrentView('public')} 
      t={t} 
      isPublicMode={false}
      initialIsRegistering={initialIsRegistering}
      variant="admin"
    />;
  }

  const navItems = [
    { id: 'dashboard', label: ['MEMBER', 'PUBLIC', 'APPLICANT_MEMBER'].includes(user.role) ? 'Workspace Home' : 'Dashboard', icon: LayoutDashboard, show: true },
    { id: 'portal-center', label: 'Portal Center', icon: Globe, show: ['ADMIN', 'STAFF'].includes(user.role) },
    { id: 'users', label: 'System Users', icon: Users, show: ['ADMIN', 'STAFF'].includes(user.role) },
    { id: 'profile', label: user.role === 'ADMIN' || user.role === 'STAFF' ? 'Admin Profile' : 'My Profile', icon: User, show: true },
    { id: 'warroom', label: 'War Room', icon: ShieldAlert, show: can('WAR_ROOM', 'VIEW') && systemConfig['ENABLE_WAR_ROOM'] !== 'false' },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone, show: can('COMMUNICATION', 'VIEW') && ['ADMIN', 'STAFF', 'FIELD_COORDINATOR'].includes(user.role) },
    { id: 'supporters', label: 'Supporters', icon: Users, show: can('SUPPORTERS', 'VIEW') },
    { id: 'booths', label: 'Booths', icon: MapPin, show: can('BOOTHS', 'VIEW') },
    { id: 'hierarchy', label: 'Organization', icon: GitGraph, show: can('HIERARCHY', 'VIEW') },
    { id: 'membership', label: 'Membership', icon: UserPlus, show: true },
    { id: 'renewals', label: 'Renewals', icon: Clock, show: can('MEMBERSHIP', 'RENEW') },
    { id: 'fundraiser', label: 'Fundraiser', icon: Heart, show: can('FUNDRAISING', 'VIEW') },
    { id: 'volunteers', label: 'Volunteers', icon: Heart, show: ['ADMIN', 'STAFF'].includes(user.role) },
    { id: 'volunteer-hub', label: 'Volunteer Hub', icon: Zap, show: ['MEMBER', 'PUBLIC', 'APPLICANT_MEMBER'].includes(user.role) },
    { id: 'donations', label: 'Donation Portal', icon: Heart, show: true },
    { id: 'cms', label: 'CMS', icon: Layout, show: can('CMS', 'VIEW') },
    { id: 'documents', label: 'Documents', icon: FileText, show: can('CMS', 'VIEW') },
    { id: 'communication', label: 'Communication', icon: MessageSquare, show: can('COMMUNICATION', 'VIEW') && !['MEMBER', 'PUBLIC', 'APPLICANT_MEMBER'].includes(user.role) },
    { id: 'notices', label: ['MEMBER', 'PUBLIC', 'APPLICANT_MEMBER'].includes(user.role) ? 'Official Notices' : 'Notice & Popup', icon: Bell, show: true },
    { id: 'training', label: 'Training Portal', icon: GraduationCap, show: true },
    { id: 'events', label: ['MEMBER', 'PUBLIC', 'APPLICANT_MEMBER'].includes(user.role) ? 'Announcements' : 'App Announcements', icon: Megaphone, show: true },
    { id: 'field-events', label: 'Field Events', icon: Calendar, show: can('COMMUNICATION', 'CREATE') && ['ADMIN', 'STAFF'].includes(user.role) },
    { id: 'finance', label: 'Finance', icon: DollarSign, show: can('FINANCE', 'VIEW') },
    { id: 'election', label: 'Election', icon: Vote, show: can('ELECTION', 'VIEW') && !['MEMBER', 'PUBLIC', 'APPLICANT_MEMBER'].includes(user.role) },
    { id: 'candidate-dashboard', label: 'Candidate', icon: UserCheck, show: can('ELECTION', 'VIEW') || user.role === 'MEMBER' || user.role === 'PUBLIC' },
    { id: 'grievances', label: 'Help Desk', icon: ShieldAlert, show: true },
    { id: 'surveys', label: 'Surveys & Polls', icon: ClipboardList, show: true },
    { id: 'pgis', label: 'PGIS', icon: Shield, show: can('PGIS', 'VIEW') && systemConfig['ENABLE_PGIS'] !== 'false' },
    { id: 'settings', label: 'Settings', icon: Settings, show: user.role === 'ADMIN' },
  ];

  const filteredNavItems = navItems.filter(item => item.show);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Toaster position="top-right" richColors />
      <NoticePopup user={user} currentPath={currentView} />
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 text-emerald-600">
          <Globe size={24} />
          <span className="font-black text-xl tracking-tight text-slate-800">{systemConfig['PARTY_NAME'] || 'PPOS'}</span>
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
            <span className="font-black text-xl tracking-tight text-slate-800">{systemConfig['PARTY_NAME'] || 'PPOS'}</span>
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
        {currentView !== 'dashboard' && 
         currentView !== 'member-dashboard' && 
         currentView !== 'applicant-dashboard' && 
         !['membership', 'volunteer-hub', 'donations', 'notices', 'training', 'events', 'grievances', 'surveys', 'profile'].includes(currentView) && (
          <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                  Welcome, {user.displayName}
                </h1>
                {user.orgUnitName && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {user.orgUnitLevel}: {user.orgUnitName}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
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
        )}

        {currentView === 'dashboard' && (
          ['ADMIN', 'STAFF', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER'].includes(user.role) 
            ? <DashboardHome user={user} setCurrentView={setCurrentView} />
            : <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} />
        )}

        {currentView === 'portal-center' && <PortalCenter user={user} setCurrentView={setCurrentView} />}
        {currentView === 'users' && <UserAdmin />}
        {currentView === 'campaigns' && <CampaignsView campaigns={campaigns} />}
        {currentView === 'supporters' && <SupportersView supporters={supporters} onRefresh={fetchData} user={user} />}
        {currentView === 'booths' && <BoothsView booths={booths} onRefresh={fetchData} user={user} />}
        {currentView === 'hierarchy' && <HierarchyAdmin user={user} />}
        {currentView === 'membership' && (
          ['ADMIN', 'STAFF', 'FIELD_COORDINATOR'].includes(user.role)
            ? <MembershipAdmin user={user} />
            : <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="membership" />
        )}
        {currentView === 'renewals' && <RenewalsManagement user={user} />}
        {currentView === 'volunteers' && <VolunteerAdmin />}
        {currentView === 'volunteer-hub' && (
          <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="volunteer" />
        )}
        {currentView === 'volunteer-enrollment' && (
          <VolunteerEnrollment 
            user={user} 
            onSuccess={() => setCurrentView('dashboard')} 
          />
        )}
        {currentView === 'membership-public' && (
          <MembershipPublic 
            user={user}
            onBack={() => setCurrentView('membership')}
            onStatusClick={(code, mobile) => {
              setCurrentView('membership');
            }} 
          />
        )}
        {currentView === 'cms' && <CmsAdmin user={user} />}
        {currentView === 'documents' && <DocumentsView user={user} />}
        {currentView === 'communication' && <CommunicationAdmin user={user} />}
        {currentView === 'notices' && (
          (can('NOTICE_POPUP', 'CREATE') || can('NOTICE_POPUP', 'UPDATE')) 
            ? <NoticeAdmin user={user} /> 
            : <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="notices" />
        )}
        {currentView === 'training' && (
          (can('TRAINING', 'CREATE') || can('TRAINING', 'UPDATE')) 
            ? <TrainingAdmin user={user} /> 
            : <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="training" />
        )}
        {currentView === 'events' && (
          (can('COMMUNICATION', 'CREATE') || can('COMMUNICATION', 'UPDATE'))
            ? <AppEventsAdmin user={user} />
            : <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="events" />
        )}
        {currentView === 'field-events' && <EventsAdmin user={user} />}
        {currentView === 'donations' && (
          ['ADMIN', 'STAFF'].includes(user.role)
            ? <DonationPortal />
            : <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="donations" />
        )}
        {currentView === 'donate' && <DonationPortal />}
        {currentView === 'finance' && <FinanceAdmin user={user} />}
        {currentView === 'fundraiser' && <FundraiserAdmin user={user} />}
        {currentView === 'election' && <ElectionAdmin user={user} key="election-admin" />}
        {currentView === 'candidate-dashboard' && (
          (user.role === 'ADMIN' || user.role === 'STAFF') 
            ? <ElectionAdmin user={user} key="candidate-admin" defaultTab="candidates" /> 
            : <CandidateDashboard />
        )}
        {currentView === 'grievances' && (
          (can('GRIEVANCES', 'UPDATE') || can('GRIEVANCES', 'DELETE'))
            ? <GrievancePortal user={user} />
            : <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="grievances" />
        )}
        {currentView === 'surveys' && (
          (can('SURVEYS', 'CREATE') || can('SURVEYS', 'UPDATE'))
            ? <SurveyPolls user={user} />
            : <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="surveys" />
        )}
        {currentView === 'pgis' && <PgisDashboard />}
        {currentView === 'warroom' && <WarRoomDashboard />}
        {currentView === 'settings' && <SystemSettings />}
        {currentView === 'profile' && (
          ['ADMIN', 'STAFF'].includes(user.role)
            ? <UserProfileDashboard user={user} onLogout={handleLogout} />
            : <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="profile" />
        )}
        {currentView === 'member-dashboard' && (
          <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="overview" />
        )}
        {currentView === 'applicant-dashboard' && (
          <CentralizedPublicDashboard user={user} setCurrentView={setCurrentView} onLogout={handleLogout} initialTab="overview" />
        )}
        {currentView === 'event-detail' && selectedEventId && (
          <EventDetailView 
            eventId={selectedEventId} 
            user={user}
            onBack={() => setCurrentView('dashboard')} 
          />
        )}
      </main>
    </div>
  );
}
