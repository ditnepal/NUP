import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Campaign, CampaignPhase } from '../types';
import { Search, Filter, Flag, Calendar, Target, Plus, X, Activity } from 'lucide-react';
import { addDoc, Timestamp } from 'firebase/firestore';
import { campaignsRef } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  return (
    <button className={`${base} ${variants[variant as keyof typeof variants]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const CampaignsView = ({ campaigns }: { campaigns: Campaign[] }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPhase = phaseFilter === 'all' || c.phase === phaseFilter;
      return matchesSearch && matchesPhase;
    });
  }, [campaigns, searchTerm, phaseFilter]);

  const handleCreateCampaign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await addDoc(campaignsRef, {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        phase: formData.get('phase') as CampaignPhase,
        targetProvince: formData.get('targetProvince') as string,
        targetDistrict: formData.get('targetDistrict') as string,
        targetLocalLevel: formData.get('targetLocalLevel') as string,
        startDate: Timestamp.fromDate(new Date(formData.get('startDate') as string)),
        endDate: formData.get('endDate') ? Timestamp.fromDate(new Date(formData.get('endDate') as string)) : null,
        budget: Number(formData.get('budget')),
        managerId: 'current-user-id', // Replace with actual auth UID
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Campaign Management</h2>
          <p className="text-slate-500">Plan and track political campaigns and outreach programs</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={20} />
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Campaigns</p>
            <p className="text-2xl font-bold text-slate-800">
              {campaigns.filter(c => c.phase === 'active').length}
            </p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">In Planning</p>
            <p className="text-2xl font-bold text-slate-800">
              {campaigns.filter(c => c.phase === 'planning').length}
            </p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Flag size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <p className="text-2xl font-bold text-slate-800">
              {campaigns.filter(c => c.phase === 'completed').length}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search campaigns..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select 
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Phases</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6 hover:border-emerald-200 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Flag size={20} />
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                  ${campaign.phase === 'active' ? 'bg-emerald-100 text-emerald-700' :
                    campaign.phase === 'planning' ? 'bg-blue-100 text-blue-700' :
                    campaign.phase === 'completed' ? 'bg-slate-100 text-slate-700' :
                    'bg-orange-100 text-orange-700'
                  }`}
                >
                  {campaign.phase}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{campaign.title}</h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{campaign.description}</p>
              
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-slate-400" />
                  {campaign.targetLocalLevel || campaign.targetDistrict || campaign.targetProvince || 'National'}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  {new Date(campaign.startDate.toDate()).toLocaleDateString()}
                  {campaign.endDate && ` - ${new Date(campaign.endDate.toDate()).toLocaleDateString()}`}
                </div>
              </div>
            </Card>
          ))}
          {filteredCampaigns.length === 0 && (
            <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Flag className="mx-auto text-slate-300 mb-2" size={48} />
              <p className="text-slate-500">No campaigns found matching your criteria.</p>
            </div>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Create Campaign</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateCampaign} className="p-6 space-y-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Campaign Title</label>
                  <input name="title" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea name="description" required rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Phase</label>
                    <select name="phase" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Budget (NPR)</label>
                    <input type="number" name="budget" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Start Date</label>
                    <input type="date" name="startDate" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">End Date (Optional)</label>
                    <input type="date" name="endDate" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Target Province</label>
                    <input name="targetProvince" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Target District</label>
                    <input name="targetDistrict" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Target Local Level</label>
                    <input name="targetLocalLevel" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Campaign</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
