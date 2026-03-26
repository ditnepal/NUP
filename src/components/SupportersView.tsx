import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Supporter, IssueCategory, SupporterLevel, UserProfile } from '../types';
import { Search, UserPlus, Phone, MapPin, HeartHandshake, X, Edit2, Trash2, Eye } from 'lucide-react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { StatCard } from './ui/StatCard';
import { usePermissions } from '../hooks/usePermissions';

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

export const SupportersView = ({ supporters, onRefresh, user }: { supporters: Supporter[], onRefresh: () => void, user: UserProfile }) => {
  const { t } = useTranslation();
  const { can } = usePermissions(user);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupporter, setEditingSupporter] = useState<Supporter | null>(null);
  const [viewingSupporter, setViewingSupporter] = useState<Supporter | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredSupporters = useMemo(() => {
    return supporters.filter(s => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.phoneNumber.includes(searchTerm);
      const matchesLevel = levelFilter === 'all' || s.supportLevel === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [supporters, searchTerm, levelFilter]);

  const handleAddSupporter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!can('SUPPORTERS', 'CREATE')) return;
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        fullName: formData.get('fullName') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        province: formData.get('province') as string,
        district: formData.get('district') as string,
        localLevel: formData.get('localLevel') as string,
        ward: Number(formData.get('ward')),
        supportLevel: (formData.get('supportLevel') as string).toUpperCase(),
        issues: formData.get('issues') as string,
        notes: formData.get('notes') as string,
      };

      await api.post('/supporters', payload);
      setIsModalOpen(false);
      onRefresh();
    } catch (error: any) {
      console.error("Error adding supporter:", error);
      setError(error.message || "Failed to add supporter");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSupporter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSupporter || !can('SUPPORTERS', 'UPDATE')) return;
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        fullName: formData.get('fullName') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        province: formData.get('province') as string,
        district: formData.get('district') as string,
        localLevel: formData.get('localLevel') as string,
        ward: Number(formData.get('ward')),
        supportLevel: (formData.get('supportLevel') as string).toUpperCase(),
        issues: formData.get('issues') as string,
        notes: formData.get('notes') as string,
      };

      await api.put(`/supporters/${editingSupporter.id}`, payload);
      setEditingSupporter(null);
      onRefresh();
    } catch (error: any) {
      console.error("Error editing supporter:", error);
      setError(error.message || "Failed to edit supporter");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupporter = async (id: string) => {
    if (!can('SUPPORTERS', 'DELETE')) return;
    if (!window.confirm("Are you sure you want to delete this supporter?")) return;
    setIsDeleting(id);
    try {
      await api.delete(`/supporters/${id}`);
      onRefresh();
    } catch (error) {
      console.error("Error deleting supporter:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Supporter CRM</h2>
          <p className="text-slate-500">Manage contacts, volunteers, and issue-based outreach</p>
        </div>
        {can('SUPPORTERS', 'CREATE') && (
          <Button onClick={() => setIsModalOpen(true)}>
            <UserPlus size={20} />
            Add Supporter
          </Button>
        )}
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
                {(can('SUPPORTERS', 'VIEW') || can('SUPPORTERS', 'UPDATE') || can('SUPPORTERS', 'DELETE')) && <th className="pb-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredSupporters.map((supporter) => (
                <tr key={supporter.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <div className="font-semibold text-slate-800">{supporter.fullName}</div>
                    <div className="text-slate-500 flex items-center gap-1 text-xs mt-0.5">
                      <Phone size={12} /> {supporter.phoneNumber}
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
                      ${supporter.supportLevel.toLowerCase() === 'strong' ? 'bg-emerald-100 text-emerald-700' :
                        supporter.supportLevel.toLowerCase() === 'volunteer' ? 'bg-blue-100 text-blue-700' :
                        supporter.supportLevel.toLowerCase() === 'neutral' ? 'bg-slate-100 text-slate-700' :
                        'bg-orange-100 text-orange-700'
                       }`}
                    >
                      {supporter.supportLevel}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {supporter.issues?.split(',').slice(0, 2).map(issue => (
                        <span key={issue} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                          {issue.trim()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 text-slate-500">
                    {supporter.lastContactedAt ? new Date(supporter.lastContactedAt).toLocaleDateString() : 'Never'}
                  </td>
                  {(can('SUPPORTERS', 'VIEW') || can('SUPPORTERS', 'UPDATE') || can('SUPPORTERS', 'DELETE')) && (
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {can('SUPPORTERS', 'VIEW') && (
                          <button 
                            onClick={() => setViewingSupporter(supporter)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {can('SUPPORTERS', 'UPDATE') && (
                          <button 
                            onClick={() => setEditingSupporter(supporter)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                        )}
                        {can('SUPPORTERS', 'DELETE') && (
                          <button 
                            onClick={() => handleDeleteSupporter(supporter.id!)}
                            disabled={isDeleting === supporter.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredSupporters.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
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
                    <input name="phoneNumber" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
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
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Supporter'}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingSupporter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Edit Supporter</h3>
                <button onClick={() => setEditingSupporter(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSupporter} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input name="fullName" defaultValue={editingSupporter.fullName} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                    <input name="phoneNumber" defaultValue={editingSupporter.phoneNumber} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Province</label>
                    <input name="province" defaultValue={editingSupporter.province} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">District</label>
                    <input name="district" defaultValue={editingSupporter.district} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Local Level</label>
                    <input name="localLevel" defaultValue={editingSupporter.localLevel} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Ward No.</label>
                    <input type="number" name="ward" defaultValue={editingSupporter.ward} required min="1" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Support Level</label>
                    <select name="supportLevel" defaultValue={editingSupporter.supportLevel.toLowerCase()} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
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
                    <input name="issues" defaultValue={editingSupporter.issues} placeholder="e.g., road, water, education" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Outreach Notes</label>
                  <textarea name="notes" defaultValue={editingSupporter.notes} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setEditingSupporter(null)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Update Supporter'}</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingSupporter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Supporter Details</h3>
                <button onClick={() => setViewingSupporter(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Full Name</p>
                    <p className="text-slate-800 font-medium">{viewingSupporter.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Phone</p>
                    <p className="text-slate-800 font-medium">{viewingSupporter.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Location</p>
                    <p className="text-slate-800 font-medium">{viewingSupporter.localLevel}, Ward {viewingSupporter.ward}</p>
                    <p className="text-xs text-slate-500">{viewingSupporter.district}, {viewingSupporter.province}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Support Level</p>
                    <p className="text-slate-800 font-medium">{viewingSupporter.supportLevel}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Key Issues</p>
                  <p className="text-slate-800">{viewingSupporter.issues || 'None specified'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase">Notes</p>
                  <p className="text-slate-800 whitespace-pre-wrap">{viewingSupporter.notes || 'No notes available'}</p>
                </div>
                {viewingSupporter.interactions && viewingSupporter.interactions.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Recent Interactions</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                      {viewingSupporter.interactions.map((interaction) => (
                        <div key={interaction.id} className="p-2 bg-slate-50 rounded-lg text-xs">
                          <div className="flex justify-between font-semibold text-slate-700">
                            <span>{interaction.type}</span>
                            <span>{new Date(interaction.date).toLocaleDateString()}</span>
                          </div>
                          {interaction.notes && <p className="text-slate-500 mt-1 italic">"{interaction.notes}"</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <p className="text-xs text-slate-400">Added on {new Date(viewingSupporter.createdAt).toLocaleDateString()}</p>
                  <Button variant="secondary" onClick={() => setViewingSupporter(null)}>Close</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
