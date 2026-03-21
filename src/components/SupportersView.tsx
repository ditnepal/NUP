import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Supporter, IssueCategory, SupporterLevel } from '../types';
import { Search, UserPlus, Phone, MapPin, HeartHandshake, X } from 'lucide-react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { StatCard } from './ui/StatCard';

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

export const SupportersView = ({ supporters }: { supporters: Supporter[] }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredSupporters = useMemo(() => {
    return supporters.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.phone.includes(searchTerm);
      const matchesLevel = levelFilter === 'all' || s.supportLevel === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [supporters, searchTerm, levelFilter]);

  const handleAddSupporter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await api.post('/supporters', {
        fullName: formData.get('fullName') as string,
        phone: formData.get('phone') as string,
        province: formData.get('province') as string,
        district: formData.get('district') as string,
        localLevel: formData.get('localLevel') as string,
        ward: Number(formData.get('ward')),
        supportLevel: formData.get('supportLevel') as SupporterLevel,
        issues: (formData.get('issues') as string).split(',').map(i => i.trim()) as IssueCategory[],
        notes: formData.get('notes') as string,
        createdAt: new Date().toISOString(),
        lastContactedAt: new Date().toISOString()
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding supporter:", error);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Supporter CRM</h2>
          <p className="text-slate-500">Manage contacts, volunteers, and issue-based outreach</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus size={20} />
          Add Supporter
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={supporters.length} icon={HeartHandshake} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Strong Supporters" value={supporters.filter(s => s.supportLevel === 'strong').length} icon={UserPlus} color="text-blue-600" bg="bg-blue-50" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Levels</option>
            <option value="strong">Strong Supporter</option>
            <option value="leaning">Leaning</option>
            <option value="neutral">Neutral</option>
            <option value="undecided">Undecided</option>
            <option value="volunteer">Volunteer</option>
            <option value="donor">Donor</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="pb-3 font-semibold">Name & Contact</th>
                <th className="pb-3 font-semibold">Location</th>
                <th className="pb-3 font-semibold">Support Level</th>
                <th className="pb-3 font-semibold">Key Issues</th>
                <th className="pb-3 font-semibold">Last Contact</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredSupporters.map((supporter) => (
                <tr key={supporter.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <div className="font-semibold text-slate-800">{supporter.fullName}</div>
                    <div className="text-slate-500 flex items-center gap-1 text-xs mt-0.5">
                      <Phone size={12} /> {supporter.phone}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin size={14} />
                      {supporter.localLevel}, Ward {supporter.ward}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${supporter.supportLevel === 'strong' ? 'bg-emerald-100 text-emerald-700' :
                        supporter.supportLevel === 'volunteer' ? 'bg-blue-100 text-blue-700' :
                        supporter.supportLevel === 'neutral' ? 'bg-slate-100 text-slate-700' :
                        'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {supporter.supportLevel}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {supporter.issues.slice(0, 2).map(issue => (
                        <span key={issue} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                          {issue}
                        </span>
                      ))}
                      {supporter.issues.length > 2 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                          +{supporter.issues.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 text-slate-500">
                    {supporter.lastContactedAt ? new Date(supporter.lastContactedAt).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
              {filteredSupporters.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No supporters found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Add New Supporter</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAddSupporter} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input name="fullName" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                    <input name="phone" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Province</label>
                    <input name="province" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">District</label>
                    <input name="district" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Local Level</label>
                    <input name="localLevel" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Ward No.</label>
                    <input type="number" name="ward" required min="1" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Support Level</label>
                    <select name="supportLevel" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                      <option value="strong">Strong Supporter</option>
                      <option value="leaning">Leaning</option>
                      <option value="neutral">Neutral</option>
                      <option value="undecided">Undecided</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="donor">Donor</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Key Issues (comma separated)</label>
                    <input name="issues" placeholder="e.g., road, water, education" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Outreach Notes</label>
                  <textarea name="notes" rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Supporter</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
