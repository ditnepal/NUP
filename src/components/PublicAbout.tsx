import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  Search
} from 'lucide-react';
import { api } from '../lib/api';

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

const PublicAbout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'about' | 'org' | 'offices'>('about');
  const [offices, setOffices] = useState<Office[]>([]);
  const [hierarchy, setHierarchy] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeTab === 'offices') {
      fetchOffices();
    } else if (activeTab === 'org') {
      fetchHierarchy();
    }
  }, [activeTab]);

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

  const filteredOffices = offices.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.orgUnit.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-16 rounded-3xl">
        <div className="text-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              About Our Organization
            </h1>
            <p className="mt-4 text-xl text-slate-400 max-w-2xl mx-auto">
              Learn about our mission, our structure, and how we operate across the nation.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-16 z-10 rounded-2xl">
        <div className="px-8 flex space-x-8 overflow-x-auto">
            {[
              { id: 'about', label: 'About Us', icon: Info },
              { id: 'org', label: 'Organization', icon: Users },
              { id: 'offices', label: 'Office Locator', icon: MapPin },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

      <div className="py-12">
        {activeTab === 'about' && (
          <div className="space-y-16">
            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
                <p className="text-slate-600 leading-relaxed">
                  To build a progressive, inclusive, and transparent political platform that empowers every citizen to participate in the democratic process. We strive to create sustainable solutions for national challenges through evidence-based policy and grassroots engagement.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Vision</h2>
                <p className="text-slate-600 leading-relaxed">
                  A nation where governance is truly by the people, for the people. We envision a future defined by social justice, economic prosperity, and environmental stewardship, supported by a technologically advanced and ethically grounded political organization.
                </p>
              </motion.div>
            </div>

            {/* History */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <History className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Our Journey</h2>
              </div>
              <div className="space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {[
                  { year: '2020', title: 'Foundation', desc: 'The organization was founded by a group of passionate activists and policy experts.' },
                  { year: '2022', title: 'National Expansion', desc: 'Established presence in all provinces and major districts across the country.' },
                  { year: '2024', title: 'Digital Transformation', desc: 'Launched the first-of-its-kind digital operating system for political management.' },
                  { year: '2026', title: 'Present Day', desc: 'Leading the way in modern, transparent, and data-driven political engagement.' },
                ].map((item, idx) => (
                  <div key={idx} className="relative pl-10">
                    <div className="absolute left-3 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <span className="text-sm font-bold text-blue-600">{item.year}</span>
                    <h3 className="text-lg font-semibold text-slate-900 mt-1">{item.title}</h3>
                    <p className="text-slate-600 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
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
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid gap-4">
                {hierarchy.map((unit) => (
                  <motion.div
                    key={unit.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{unit.name}</h4>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full uppercase tracking-wider">
                            {unit.level}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {unit._count.members} Members
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'offices' && (
          <div className="space-y-8">
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, address, or unit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
              <button 
                onClick={fetchOffices}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOffices.map((office) => (
                  <motion.div
                    key={office.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 rounded uppercase tracking-tighter">
                          {office.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900 mb-1">{office.name}</h4>
                      <p className="text-sm text-slate-500 mb-4 flex items-center">
                        <Building2 className="w-3 h-3 mr-1" />
                        {office.orgUnit.name}
                      </p>
                      
                      <div className="space-y-3 pt-4 border-t border-slate-50">
                        <div className="flex items-start space-x-3 text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span>{office.address}</span>
                        </div>
                        {office.contactNumber && (
                          <div className="flex items-center space-x-3 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>{office.contactNumber}</span>
                          </div>
                        )}
                        {office.email && (
                          <div className="flex items-center space-x-3 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>{office.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-slate-50 px-6 py-3 flex justify-between items-center">
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                        View on Map
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </button>
                      <button className="text-xs font-semibold text-slate-500 hover:text-slate-700">
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
      <div className="bg-white border border-slate-200 rounded-3xl py-12">
        <div className="text-center px-8">
          <h2 className="text-2xl font-bold text-slate-900">Want to visit us?</h2>
          <p className="mt-2 text-slate-600">Our offices are open Sunday to Friday, 9:00 AM to 5:00 PM.</p>
          <div className="mt-8 flex justify-center space-x-4">
            <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors">
              Contact Central Office
            </button>
            <button className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">
              Send an Inquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicAbout;
