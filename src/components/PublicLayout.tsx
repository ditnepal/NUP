import React, { useState, useEffect } from 'react';
import { Globe, Menu, X, LogOut } from 'lucide-react';
import { api } from '../lib/api';

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
  onLogout,
  fullWidth = false
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({
    PARTY_NAME: 'Nagarik Unmukti Party',
    PARTY_TAGLINE: 'Empowering Citizens, Building the Future',
    CONTACT_EMAIL: 'info@nupos.org',
    CONTACT_PHONE: '+977-1-0000000'
  });

  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        const config = await api.get('/public/config');
        setSystemConfig(config);
      } catch (error) {
        console.error('Error fetching system config:', error);
      }
    };
    fetchSystemConfig();
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              {onBack && (
                <button 
                  onClick={onBack}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors flex items-center gap-1 group"
                  title="Go Back"
                >
                  <X size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Back</span>
                </button>
              )}
              <button onClick={onHomeClick} className="flex items-center gap-2 text-emerald-600 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                  <Globe size={18} />
                </div>
                <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">{systemConfig['PARTY_NAME'] || 'Nagarik Unmukti Party'}</span>
              </button>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Live</span>
              </div>
              <button onClick={onAboutClick} className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest">About</button>
              <button onClick={onNewsClick} className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest">News</button>
              <button onClick={onCandidatesClick} className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest">Candidates</button>
              <button onClick={onCampaignsClick} className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest">Campaigns</button>
              <button onClick={onDocumentsClick} className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest">Manifesto</button>
              <button onClick={onTrainingClick} className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest">Training</button>
              <button onClick={onStatusClick} className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors uppercase tracking-widest">Check Status</button>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-800">{user.displayName}</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{user.role}</span>
                  </div>
                  <button 
                    onClick={onLogout || (() => {
                      localStorage.removeItem('token');
                      window.location.reload();
                    })}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button onClick={onLoginClick || onPortalClick} className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors">Log In</button>
                  <button onClick={onJoinClick} className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
                    Join Us
                  </button>
                </div>
              )}
            </div>

            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden">
          <div className="flex flex-col gap-6">
            <button onClick={() => { onAboutClick?.(); setIsMenuOpen(false); }} className="text-2xl font-bold text-slate-800 text-left">About Us</button>
            <button onClick={() => { onNewsClick?.(); setIsMenuOpen(false); }} className="text-2xl font-bold text-slate-800 text-left">News</button>
            <button onClick={() => { onCandidatesClick?.(); setIsMenuOpen(false); }} className="text-2xl font-bold text-slate-800 text-left">Candidates</button>
            <button onClick={() => { onCampaignsClick?.(); setIsMenuOpen(false); }} className="text-2xl font-bold text-slate-800 text-left">Campaigns</button>
            <button onClick={() => { onDocumentsClick?.(); setIsMenuOpen(false); }} className="text-2xl font-bold text-slate-800 text-left">Manifesto</button>
            <button onClick={() => { onTrainingClick?.(); setIsMenuOpen(false); }} className="text-2xl font-bold text-slate-800 text-left">Training</button>
            <button onClick={() => { onStatusClick?.(); setIsMenuOpen(false); }} className="text-2xl font-bold text-slate-800 text-left">Check Status</button>
            {user ? (
              <button 
                onClick={() => { onPortalClick?.(); setIsMenuOpen(false); }}
                className="bg-slate-900 text-white w-full py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2"
              >
                Dashboard
              </button>
            ) : (
              <div className="flex flex-col gap-4 mt-4">
                <button onClick={() => { (onLoginClick || onPortalClick)?.(); setIsMenuOpen(false); }} className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl text-lg font-bold">Log In</button>
                <button onClick={() => { onJoinClick?.(); setIsMenuOpen(false); }} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-lg font-bold shadow-xl shadow-emerald-200">Join Us</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 bg-slate-50">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-24 pb-12 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 text-emerald-400 mb-8">
                <Globe size={32} />
                <span className="font-black text-3xl tracking-tight">{systemConfig['PARTY_NAME'] || 'NUP OS'}</span>
              </div>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                {systemConfig['PARTY_TAGLINE']}
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-lg mb-6 uppercase tracking-widest text-emerald-400">Organization</h4>
              <ul className="space-y-4 text-slate-400">
                <li><button onClick={onAboutClick} className="hover:text-white transition-colors text-left">About Us</button></li>
                <li><button onClick={onCandidatesClick} className="hover:text-white transition-colors text-left">Candidates</button></li>
                <li><button onClick={onCampaignsClick} className="hover:text-white transition-colors text-left">Campaigns</button></li>
                <li><button onClick={onDocumentsClick} className="hover:text-white transition-colors text-left">Manifesto</button></li>
                <li><button onClick={onTrainingClick} className="hover:text-white transition-colors text-left">Training</button></li>
                <li><button onClick={onStatusClick} className="hover:text-white transition-colors text-left">Check Status</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-lg mb-6 uppercase tracking-widest text-emerald-400">Contact</h4>
              <ul className="space-y-4 text-slate-400">
                <li>{systemConfig['CONTACT_ADDRESS'] || 'Kathmandu, Nepal'}</li>
                <li>{systemConfig['CONTACT_EMAIL']}</li>
                <li>{systemConfig['CONTACT_PHONE']}</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-sm">
              © 2026 {systemConfig['PARTY_NAME']}. All rights reserved.
            </p>
            <div className="flex gap-8 text-sm text-slate-500">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
