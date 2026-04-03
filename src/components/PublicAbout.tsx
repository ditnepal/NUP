import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Info, 
  Users, 
  MapPin, 
  ChevronRight, 
  Building2, 
  Target, 
  History, 
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Search,
  ArrowLeft,
  Loader2,
  FileText
} from 'lucide-react';
import { api } from '../lib/api';
import Markdown from 'react-markdown';

interface Office {
  id: string;
  name: string;
  type: string;
  address: string;
  contactNumber?: string;
  email?: string;
  orgUnit: {
    name: string;
    level: string;
  };
}

interface OrgUnit {
  id: string;
  name: string;
  level: string;
  parentId: string | null;
  _count: {
    children: number;
    members: number;
  };
}

interface PublicAboutProps {
  onBack?: () => void;
}

export const PublicAbout: React.FC<PublicAboutProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'org' | 'offices'>('about');
  const [offices, setOffices] = useState<Office[]>([]);
  const [hierarchy, setHierarchy] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // CMS Content State
  const [aboutPage, setAboutPage] = useState<any>(null);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    if (activeTab === 'about') {
      fetchAboutPage();
    } else if (activeTab === 'offices') {
      fetchOffices();
    } else if (activeTab === 'org') {
      fetchHierarchy();
    }
  }, [activeTab]);

  const fetchAboutPage = async () => {
    setLoadingPage(true);
    try {
      // We use 'about-us' as the standard slug for the About page
      const data = await api.get('/public/pages/about-us');
      setAboutPage(data);
    } catch (error: any) {
      console.warn('[PublicAbout] CMS About page not found or unpublished:', error.message);
      setAboutPage(null);
    } finally {
      setLoadingPage(false);
    }
  };

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/offices');
      setOffices(res.data);
    } catch (error) {
      console.error('Error fetching offices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchy = async () => {
    setLoading(true);
    try {
      const res = await api.get('/public/hierarchy');
      setHierarchy(res.data);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOffices = (offices || []).filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.orgUnit.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="bg-slate-950 text-white py-24 rounded-[3rem] relative overflow-hidden mx-4 md:mx-0">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_50%)]"></div>
        </div>
        <div className="text-center px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            {onBack && (
              <button 
                onClick={onBack}
                className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Return to Portal
              </button>
            )}
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-10">
              <Info size={14} />
              Organizational Blueprint
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
              Our <span className="text-blue-500">Mission.</span> <br />
              Our <span className="text-blue-500">Structure.</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-tight font-medium tracking-tight">
              Discover the foundation of our movement, our national reach, and the decentralized architecture that powers our vision.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-slate-100 sticky top-20 z-10 rounded-[2rem] shadow-sm mx-4 md:mx-0">
        <div className="px-8 flex space-x-12 overflow-x-auto scrollbar-hide">
            {[
              { id: 'about', label: 'Mission & Vision', icon: Info },
              { id: 'org', label: 'Hierarchy', icon: Users },
              { id: 'offices', label: 'Office Network', icon: MapPin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-3 py-6 border-b-4 font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

      <div className="py-12">
        {activeTab === 'about' && (
          <div className="space-y-16">
            {loadingPage ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium uppercase tracking-widest text-[10px]">Retrieving Official Content...</p>
              </div>
            ) : aboutPage ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-12 md:p-16 rounded-[3rem] shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                    <Globe size={24} />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">{aboutPage.title}</h2>
                </div>
                
                <div className="prose prose-slate max-w-none prose-headings:uppercase prose-headings:font-black prose-headings:tracking-tight prose-p:text-slate-500 prose-p:font-medium prose-p:leading-relaxed prose-p:text-lg">
                  <Markdown>{aboutPage.content}</Markdown>
                </div>

                {aboutPage.updatedAt && (
                  <div className="mt-12 pt-8 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Official Publication</span>
                    <span>Last Updated: {new Date(aboutPage.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="space-y-16">
                {/* Fallback to original hardcoded content if CMS page is missing, but with a "Draft" or "Coming Soon" feel if preferred. 
                    Actually, the mission says "truthful empty or unpublished-state". 
                    I will show a clean empty state indicating content is being prepared. */}
                <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <FileText size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Content Under Review</h3>
                  <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
                    The official About Us content is currently being updated by the administration. 
                    Please check back soon for the latest mission, vision, and organizational history.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'org' && (
          <div className="space-y-8">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex items-start space-x-4">
              <Info className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-blue-900 font-semibold">Hierarchical Structure</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Our organization operates through a decentralized structure, from the Central Committee down to local Ward units. This ensures that every member has a voice and local issues are addressed effectively.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid gap-6">
                {hierarchy?.map((unit) => (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors border border-slate-100">
                        <Building2 size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{unit.name}</h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-widest">
                            {unit.level}
                          </span>
                          <span className="text-[10px] font-black text-slate-400 flex items-center uppercase tracking-widest">
                            <Users size={14} className="mr-2" />
                            {unit._count.members} Members
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'offices' && (
          <div className="space-y-8">
            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center space-x-6">
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, address, or unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                />
              </div>
              <button 
                onClick={fetchOffices}
                className="p-4 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all border border-slate-100"
              >
                <Globe size={20} />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredOffices?.map((office) => (
                  <motion.div
                    key={office.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-2xl transition-all group"
                  >
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-8">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:scale-110 transition-transform">
                          <MapPin size={28} />
                        </div>
                        <span className="text-[10px] font-black px-3 py-1 bg-blue-100 text-blue-700 rounded-lg uppercase tracking-widest">
                          {office.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{office.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 mb-8 flex items-center uppercase tracking-widest">
                        <Building2 size={12} className="mr-2" />
                        {office.orgUnit.name}
                      </p>
                      
                      <div className="space-y-4 pt-6 border-t border-slate-50">
                        <div className="flex items-start space-x-4 text-sm text-slate-500 font-medium">
                          <MapPin size={18} className="text-slate-300 mt-0.5 flex-shrink-0" />
                          <span>{office.address}</span>
                        </div>
                        {office.contactNumber && (
                          <div className="flex items-center space-x-4 text-sm text-slate-500 font-medium">
                            <Phone size={18} className="text-slate-300 flex-shrink-0" />
                            <span>{office.contactNumber}</span>
                          </div>
                        )}
                        {office.email && (
                          <div className="flex items-center space-x-4 text-sm text-slate-500 font-medium">
                            <Mail size={18} className="text-slate-300 flex-shrink-0" />
                            <span>{office.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-50 px-8 py-5 flex justify-between items-center border-t border-slate-100">
                      <button className="text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center uppercase tracking-widest">
                        View Map
                        <ExternalLink size={14} className="ml-2" />
                      </button>
                      <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest">
                        Contact
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {!loading && filteredOffices.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No offices found</h3>
                <p className="text-slate-500 mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-slate-950 text-white rounded-[3rem] py-20 relative overflow-hidden mx-4 md:mx-0">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,#3b82f6_0%,transparent_50%)]"></div>
        </div>
        <div className="text-center px-8 relative z-10">
          <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-4">Want to visit us?</h2>
          <p className="text-slate-400 font-medium text-lg mb-12">Our offices are open Sunday to Friday, 9:00 AM to 5:00 PM.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">
              Contact Central Office
            </button>
            <button className="px-10 py-5 bg-white/5 backdrop-blur-md text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
              Send an Inquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicAbout;
