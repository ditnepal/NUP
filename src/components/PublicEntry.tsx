import React from 'react';
import { UserProfile } from '../types';
import { 
  Globe, 
  UserPlus, 
  Heart, 
  ShieldAlert, 
  ArrowRight, 
  LayoutDashboard, 
  CheckCircle2, 
  LogIn,
  UserCheck,
  ChevronRight,
  Shield,
  Activity,
  Zap,
  Megaphone,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react';
import { motion } from 'motion/react';

interface PublicEntryProps {
  user: UserProfile | null;
  systemConfig: Record<string, string>;
  setCurrentView: (view: any) => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const PublicEntry: React.FC<PublicEntryProps> = ({ 
  user, 
  systemConfig,
  setCurrentView, 
  onLoginClick, 
  onRegisterClick 
}) => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-slate-50 rounded-3xl">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider mb-8"
            >
              <Globe size={14} />
              Official Public Gateway
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.85] mb-8 tracking-tighter"
            >
              THE FUTURE <br />
              <span className="text-emerald-600">IS OPEN.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-600 mb-10 leading-tight max-w-xl font-medium tracking-tight"
            >
              Welcome to the next-generation operating system for civic engagement. Secure, transparent, and built for every citizen.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {user ? (
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 group"
                >
                  <LayoutDashboard size={18} />
                  Go to My Dashboard
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button 
                    onClick={onRegisterClick}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 group"
                  >
                    <UserPlus size={18} />
                    Register Now
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={onLoginClick}
                    className="bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn size={18} />
                    Sign In
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </div>
        
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-50 -skew-x-12 translate-x-1/4 z-0 hidden lg:block"></div>
      </section>

      {/* System Pulse / Live Stats */}
      <section className="py-12 bg-slate-900 border-y border-white/5 overflow-hidden rounded-3xl">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-wrap justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-white font-black uppercase tracking-widest text-xs">System Pulse: Live</span>
            </div>
            <div className="flex gap-12">
              {[
                { label: 'Active Members', value: '248K+' },
                { label: 'Verified Volunteers', value: '12K+' },
                { label: 'Provinces Covered', value: '7/7' },
                { label: 'Grievances Resolved', value: '94%' }
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-emerald-500 font-black text-xl leading-none mb-1 tracking-tighter">{stat.value}</span>
                  <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Journey Selection */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Choose Your Journey</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">Select the path that best fits your goals. Whether you want to lead, support, or seek help, we have a dedicated flow for you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Membership Journey */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-emerald-500 transition-all group cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => setCurrentView('membership-public')}>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserCheck size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Join as Member</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Become an official part of our organization. Gain voting rights, participate in internal elections, and lead from the front.</p>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
              Start Application <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* Volunteer Journey */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-rose-500 transition-all group cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => setCurrentView('volunteer-enrollment')}>
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Heart size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Apply as Volunteer</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Contribute your time and skills to our grassroots campaigns. Help us organize events and reach more citizens.</p>
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm uppercase tracking-wider">
              Join the Team <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* Support/Donate Journey */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-amber-500 transition-all group cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => setCurrentView('donations')}>
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Support & Donate</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Fuel our mission with your financial support. Every contribution helps us build a better future for everyone.</p>
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm uppercase tracking-wider">
              Contribute Now <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* Grievance/Help Journey */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-slate-900 transition-all group cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => setCurrentView('grievances')}>
            <div className="w-14 h-14 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Help & Grievance</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Report issues in your community or seek assistance from our legal and support teams. We are here to help.</p>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider">
              Submit Issue <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* Status Check Journey */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-500 transition-all group cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => setCurrentView('applicant-status')}>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Check Status</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Already applied? Track the real-time status of your membership or volunteer application using your tracking code.</p>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
              Track Progress <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* Documents/Manifesto Journey */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-indigo-500 transition-all group cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => setCurrentView('public-documents')}>
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Manifesto & Docs</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Read our official manifesto, policy papers, and public documents to understand our vision and commitments.</p>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
              Browse Documents <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* About Us Journey */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-emerald-500 transition-all group cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => setCurrentView('public-about')}>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">About Our Mission</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Learn about our history, core values, organizational structure, and find our local offices near you.</p>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
              Learn More <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* Candidates Journey */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-500 transition-all group cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => setCurrentView('public-candidates')}>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <UserCheck size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">Our Candidates</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Meet the leaders representing our party in upcoming elections and learn about their vision for your constituency.</p>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm uppercase tracking-wider">
              View Candidates <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* News & Updates Journey */}
          <div className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-emerald-500 transition-all group cursor-pointer shadow-sm hover:shadow-2xl" onClick={() => setCurrentView('public-portal')}>
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Megaphone size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight">News & Updates</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">Stay informed with the latest news, official notices, and upcoming events from our organization.</p>
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm uppercase tracking-wider">
              Read Latest News <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Social & Community Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-100 rounded-3xl">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Join the Conversation</h2>
          <p className="text-slate-500 max-w-2xl mx-auto mb-12">Connect with us on social media to stay updated with real-time news, live events, and community discussions.</p>
          
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: Facebook, label: 'Facebook', color: 'bg-blue-600' },
              { icon: Twitter, label: 'Twitter', color: 'bg-sky-500' },
              { icon: Instagram, label: 'Instagram', color: 'bg-pink-600' },
              { icon: Youtube, label: 'YouTube', color: 'bg-red-600' }
            ].map((social, idx) => (
              <motion.a
                key={idx}
                href="#"
                whileHover={{ y: -5 }}
                className="flex flex-col items-center gap-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all min-w-[160px]"
              >
                <div className={`w-12 h-12 ${social.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                  <social.icon size={24} />
                </div>
                <span className="font-bold text-slate-900">{social.label}</span>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Follow Us</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Verification Guidance */}
      {!user && (
        <section className="py-20 bg-slate-900 text-white rounded-3xl mb-12">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-black mb-6 leading-tight uppercase tracking-tight">Secure Your Identity</h2>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                  To ensure a safe and transparent environment for all citizens, we require identity verification for certain actions. Register today to start your verification process and unlock full access to the **Centralized Public User Dashboard**.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Step 1: Register</h4>
                      <p className="text-sm text-slate-500">Create your account with basic details.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Step 2: Verify</h4>
                      <p className="text-sm text-slate-500">Submit your identity documents for review.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold mb-1">Step 3: Access</h4>
                      <p className="text-sm text-slate-500">Unlock full self-service features.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10">
                <div className="text-center mb-8">
                  <Globe size={48} className="mx-auto text-emerald-500 mb-4" />
                  <h3 className="text-2xl font-black uppercase tracking-tight">Ready to Start?</h3>
                  <p className="text-slate-400 mt-2">Join thousands of citizens building the future.</p>
                </div>
                <button 
                  onClick={onRegisterClick}
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 mb-4"
                >
                  Create My Account
                </button>
                <button 
                  onClick={onLoginClick}
                  className="w-full bg-transparent text-white border-2 border-white/20 py-4 rounded-2xl font-bold hover:bg-white/5 transition-all"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
