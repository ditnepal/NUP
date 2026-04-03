import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Menu, 
  X, 
  LogOut, 
  Megaphone, 
  UserCheck, 
  Shield, 
  Activity, 
  Zap, 
  GraduationCap, 
  MapPin, 
  Mail, 
  Phone,
  ChevronRight,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  LayoutDashboard,
  LogIn,
  UserPlus,
  ShieldAlert,
  Linkedin,
  PlayCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../lib/api';
import { CmsNavigation, CmsFooterLink, CmsSocialLink } from '../types';

interface PublicLayoutProps {
  children: React.ReactNode;
  user?: any;
  onBack?: () => void;
  onPortalClick?: () => void;
  onDocumentsClick?: () => void;
  onTrainingClick?: () => void;
  onJoinClick?: () => void;
  onStatusClick?: () => void;
  onCandidatesClick?: () => void;
  onCampaignsClick?: () => void;
  onAboutClick?: () => void;
  onHomeClick?: () => void;
  onNewsClick?: () => void;
  onLoginClick?: () => void;
  onGrievanceClick?: () => void;
  onLogout?: () => void;
  fullWidth?: boolean;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  user,
  onBack,
  onPortalClick,
  onDocumentsClick,
  onTrainingClick,
  onJoinClick,
  onStatusClick,
  onCandidatesClick,
  onCampaignsClick,
  onAboutClick,
  onHomeClick,
  onNewsClick,
  onLoginClick,
  onGrievanceClick,
  onLogout,
  fullWidth = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({
    PARTY_NAME: 'Nagarik Unmukti Party',
    PARTY_TAGLINE: 'Empowering Citizens, Building the Future',
    CONTACT_EMAIL: 'info@nupos.org',
    CONTACT_PHONE: '+977-1-0000000',
    LOGO_URL: ''
  });
  const [navigation, setNavigation] = useState<CmsNavigation[]>([]);
  const [footerLinks, setFooterLinks] = useState<CmsFooterLink[]>([]);
  const [socialLinks, setSocialLinks] = useState<CmsSocialLink[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [config, navs, footers, socials] = await Promise.all([
          api.get('/public/config'),
          api.get('/public/navigation'),
          api.get('/public/footer-links'),
          api.get('/public/social-links')
        ]);
        setSystemConfig(config);
        setNavigation(navs);
        setFooterLinks(footers);
        setSocialLinks(socials);
      } catch (error) {
        console.error('Error fetching public layout data:', error);
      }
    };
    fetchData();
  }, []);

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook': return <Facebook size={18} />;
      case 'twitter': return <Twitter size={18} />;
      case 'instagram': return <Instagram size={18} />;
      case 'youtube': return <Youtube size={18} />;
      case 'linkedin': return <Linkedin size={18} />;
      case 'tiktok': return <PlayCircle size={18} />;
      default: return <Globe size={18} />;
    }
  };

  const handleLinkClick = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      // Handle internal routing if needed, for now just use window.location
      window.location.href = url;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-6">
              <button onClick={onHomeClick} className="flex items-center gap-3 group transition-all">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform overflow-hidden">
                  {systemConfig['LOGO_URL'] ? (
                    <img src={systemConfig['LOGO_URL']} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Globe size={22} className="text-white" />
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-black text-xl tracking-tighter text-slate-900 uppercase leading-none">
                    {systemConfig['PARTY_NAME'] || 'Nagarik Unmukti Party'}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1 opacity-80">
                    {systemConfig['PARTY_TAGLINE'] || 'Official Public Portal'}
                  </span>
                </div>
              </button>
            </div>
            
            <div className="hidden lg:flex items-center gap-1">
              <nav className="flex items-center mr-4 pr-4 border-r border-slate-200 gap-1">
                {navigation.length > 0 ? (
                  navigation.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => handleLinkClick(item.url)} 
                      className="px-4 py-2 text-[10px] font-black text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                      {item.label}
                    </button>
                  ))
                ) : (
                  [
                    { label: 'About', onClick: onAboutClick },
                    { label: 'News', onClick: onNewsClick },
                    { label: 'Candidates', onClick: onCandidatesClick },
                    { label: 'Manifesto', onClick: onDocumentsClick },
                    { label: 'Status', onClick: onStatusClick },
                  ].map((item) => (
                    <button 
                      key={item.label}
                      onClick={item.onClick} 
                      className="px-4 py-2 text-[10px] font-black text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                      {item.label}
                    </button>
                  ))
                )}
              </nav>

              {user ? (
                <div className="flex items-center gap-4 pl-2">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{user.displayName}</span>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest opacity-70">{user.role.replace('_', ' ')}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <button 
                    onClick={onLogout || (() => {
                      localStorage.removeItem('token');
                      window.location.reload();
                    })}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 pl-2">
                  <button 
                    onClick={onLoginClick || onPortalClick} 
                    className="px-6 py-2.5 text-[10px] font-black text-slate-900 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={onJoinClick} 
                    className="bg-slate-900 text-white px-7 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                  >
                    Join Movement
                  </button>
                </div>
              )}
            </div>

            <button 
              className="lg:hidden p-3 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white md:hidden overflow-y-auto">
          <div className="p-6 flex flex-col h-full">
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <Globe size={22} className="text-white" />
                </div>
                <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">Menu</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-slate-100 rounded-2xl">
                <X size={24} />
              </button>
            </div>

            <div className="flex flex-col gap-2 mb-8">
              <div className="grid grid-cols-2 gap-2 mb-4">
                {user ? (
                  <button 
                    onClick={() => { onPortalClick?.(); setIsMenuOpen(false); }}
                    className="col-span-2 flex items-center justify-between p-5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 group"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard size={20} />
                      <span className="text-xs font-black uppercase tracking-widest">Dashboard</span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => { (onLoginClick || onPortalClick)?.(); setIsMenuOpen(false); }}
                      className="flex flex-col items-center justify-center p-4 bg-slate-100 text-slate-900 rounded-2xl gap-2 border border-slate-200"
                    >
                      <LogIn size={20} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Log In</span>
                    </button>
                    <button 
                      onClick={() => { onJoinClick?.(); setIsMenuOpen(false); }}
                      className="flex flex-col items-center justify-center p-4 bg-emerald-600 text-white rounded-2xl gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <UserPlus size={20} />
                      <span className="text-[9px] font-black uppercase tracking-widest">Join Us</span>
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 px-2">Navigation</h3>
                  <div className="grid grid-cols-1 gap-1">
                    {navigation.length > 0 ? (
                      navigation.map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => { handleLinkClick(item.url); setIsMenuOpen(false); }} 
                          className="flex items-center gap-4 p-4 text-sm font-black text-slate-800 hover:bg-emerald-50 rounded-2xl transition-all group"
                        >
                          <Globe size={18} className="text-slate-400 group-hover:text-emerald-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      ))
                    ) : (
                      [
                        { label: 'About Us', onClick: onAboutClick, icon: Globe },
                        { label: 'Latest News', onClick: onNewsClick, icon: Megaphone },
                        { label: 'Our Candidates', onClick: onCandidatesClick, icon: UserCheck },
                        { label: 'Manifesto & Docs', onClick: onDocumentsClick, icon: Shield },
                      ].map((item) => (
                        <button 
                          key={item.label}
                          onClick={() => { item.onClick?.(); setIsMenuOpen(false); }} 
                          className="flex items-center gap-4 p-4 text-sm font-black text-slate-800 hover:bg-emerald-50 rounded-2xl transition-all group"
                        >
                          <item.icon size={18} className="text-slate-400 group-hover:text-emerald-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
              {user && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" referrerPolicy="no-referrer" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-black text-slate-900 uppercase tracking-tight text-xs truncate">{user.displayName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-slate-50/50">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-32 pb-12 border-t border-white/5 mt-auto relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/5 -skew-x-12 translate-x-1/4 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-24">
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 text-emerald-400 mb-8">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
                  <Globe size={28} />
                </div>
                <span className="font-black text-3xl tracking-tighter uppercase">{systemConfig['PARTY_NAME'] || 'NUP OS'}</span>
              </div>
              <p className="text-slate-400 text-xl max-w-md leading-relaxed font-medium tracking-tight mb-10">
                {systemConfig['PARTY_TAGLINE'] || 'Empowering citizens through digital transparency and grassroots organization.'}
              </p>
              <div className="flex gap-4">
                {socialLinks.length > 0 ? (
                  socialLinks.map((social) => (
                    <button 
                      key={social.id} 
                      onClick={() => handleLinkClick(social.url)}
                      className="w-10 h-10 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 px-2 py-1 rounded text-white pointer-events-none transition-opacity whitespace-nowrap">{social.platform}</span>
                      {getSocialIcon(social.platform)}
                    </button>
                  ))
                ) : (
                  ['Facebook', 'Twitter', 'Instagram', 'Youtube'].map((social) => (
                    <div key={social} className="w-10 h-10 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 border border-white/10 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 px-2 py-1 rounded text-white pointer-events-none transition-opacity whitespace-nowrap">{social}</span>
                      <Globe size={18} />
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="md:col-span-4">
              <h4 className="font-black text-[10px] mb-8 uppercase tracking-[0.3em] text-emerald-400 opacity-80">Quick Links</h4>
              <ul className="grid grid-cols-2 gap-x-8 gap-y-5 text-slate-400 text-sm font-bold">
                {footerLinks.length > 0 ? (
                  footerLinks.map((link) => (
                    <li key={link.id}>
                      <button onClick={() => handleLinkClick(link.url)} className="hover:text-emerald-400 transition-colors uppercase tracking-widest text-left">
                        {link.label}
                      </button>
                    </li>
                  ))
                ) : (
                  <>
                    <li><button onClick={onAboutClick} className="hover:text-emerald-400 transition-colors uppercase tracking-widest">About Us</button></li>
                    <li><button onClick={onCandidatesClick} className="hover:text-emerald-400 transition-colors uppercase tracking-widest">Candidates</button></li>
                    <li><button onClick={onCampaignsClick} className="hover:text-emerald-400 transition-colors uppercase tracking-widest">Campaigns</button></li>
                    <li><button onClick={onDocumentsClick} className="hover:text-emerald-400 transition-colors uppercase tracking-widest">Manifesto</button></li>
                    <li><button onClick={onTrainingClick} className="hover:text-emerald-400 transition-colors uppercase tracking-widest">Training</button></li>
                    <li><button onClick={onStatusClick} className="hover:text-emerald-400 transition-colors uppercase tracking-widest">Check Status</button></li>
                  </>
                )}
              </ul>
            </div>

            <div className="md:col-span-3">
              <h4 className="font-black text-[10px] mb-8 uppercase tracking-[0.3em] text-emerald-400 opacity-80">Contact Office</h4>
              <ul className="space-y-6 text-slate-400 text-sm font-bold">
                <li className="flex gap-3">
                  <MapPin size={18} className="text-emerald-500 shrink-0" />
                  <span className="leading-relaxed">{systemConfig['CONTACT_ADDRESS'] || 'Central Headquarters, Kathmandu, Nepal'}</span>
                </li>
                <li className="flex gap-3">
                  <Mail size={18} className="text-emerald-500 shrink-0" />
                  <span>{systemConfig['CONTACT_EMAIL'] || 'contact@nupos.org'}</span>
                </li>
                <li className="flex gap-3">
                  <Phone size={18} className="text-emerald-500 shrink-0" />
                  <span>{systemConfig['CONTACT_PHONE'] || '+977-1-0000000'}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                © 2026 {systemConfig['PARTY_NAME'] || 'NUP OS'}. ALL RIGHTS RESERVED.
              </p>
            </div>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              <span className="hover:text-white transition-colors cursor-pointer">Security</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
