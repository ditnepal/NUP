import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Booth } from '../types';
import { Search, MapPin, Users, AlertCircle, Plus, X, CheckCircle2, Edit2, Trash2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
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

export const BoothsView = ({ booths, onRefresh }: { booths: Booth[], onRefresh?: () => void }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooth, setEditingBooth] = useState<Booth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const filteredBooths = useMemo(() => {
    return booths.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           b.localLevel.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [booths, searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name') as string,
      pollingStationId: formData.get('pollingStationId') as string,
      ward: Number(formData.get('ward')),
      localLevel: formData.get('localLevel') as string,
      district: formData.get('district') as string,
      province: formData.get('province') as string,
      totalVoters: Number(formData.get('totalVoters')),
      targetVotes: Number(formData.get('targetVotes')),
      status: formData.get('status') as 'READY' | 'NEEDS_ATTENTION' | 'CRITICAL',
    };

    try {
      if (editingBooth) {
        await api.put(`/booths/${editingBooth.id}`, data);
        setMessage({ type: 'success', text: 'Booth updated successfully' });
      } else {
        await api.post('/booths', data);
        setMessage({ type: 'success', text: 'Booth added successfully' });
      }
      setIsModalOpen(false);
      setEditingBooth(null);
      onRefresh?.();
    } catch (error) {
      console.error("Error saving booth:", error);
      setMessage({ type: 'error', text: 'Failed to save booth' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this booth?')) return;
    
    setIsLoading(true);
    try {
      await api.delete(`/booths/${id}`);
      setMessage({ type: 'success', text: 'Booth deleted successfully' });
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting booth:", error);
      setMessage({ type: 'error', text: 'Failed to delete booth' });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = (booth: Booth) => {
    setEditingBooth(booth);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingBooth(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Booth Management</h2>
          <p className="text-slate-500">Track booth-level organization and election readiness</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={20} />
          Add Booth
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto p-1 hover:bg-black/5 rounded-full">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Ready Booths</p>
            <p className="text-2xl font-bold text-slate-800">
              {booths.filter(b => b.status === 'READY').length}
            </p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Needs Attention</p>
            <p className="text-2xl font-bold text-slate-800">
              {booths.filter(b => b.status === 'NEEDS_ATTENTION').length}
            </p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Critical Booths</p>
            <p className="text-2xl font-bold text-slate-800">
              {booths.filter(b => b.status === 'CRITICAL').length}
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
              placeholder="Search booths..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="READY">Ready</option>
            <option value="NEEDS_ATTENTION">Needs Attention</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="pb-3 font-semibold">Booth Name</th>
                <th className="pb-3 font-semibold">Location</th>
                <th className="pb-3 font-semibold">Voters/Target</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredBooths.map((booth) => (
                <tr key={booth.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3">
                    <div className="font-semibold text-slate-800">{booth.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">Station ID: {booth.pollingStationId || 'N/A'}</div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin size={14} />
                      {booth.localLevel}, Ward {booth.ward}
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5 ml-5">{booth.district}</div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      <span className="font-medium text-slate-700">{booth.targetVotes || 0}</span>
                      <span className="text-slate-400">/ {booth.totalVoters || 0}</span>
                    </div>
                    {booth.totalVoters > 0 && (
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${Math.min(100, (booth.targetVotes / booth.totalVoters) * 100)}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                      ${booth.status === 'READY' ? 'bg-emerald-100 text-emerald-700' :
                        booth.status === 'NEEDS_ATTENTION' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}
                    >
                      {booth.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(booth)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(booth.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredBooths.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No booths found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100 flex-shrink-0">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingBooth ? 'Edit Booth' : 'Add New Booth'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Booth Name</label>
                      <input name="name" defaultValue={editingBooth?.name} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Polling Station ID</label>
                      <input name="pollingStationId" defaultValue={editingBooth?.pollingStationId} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Province</label>
                      <input name="province" defaultValue={editingBooth?.province} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">District</label>
                      <input name="district" defaultValue={editingBooth?.district} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Local Level</label>
                      <input name="localLevel" defaultValue={editingBooth?.localLevel} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Ward No.</label>
                      <input type="number" name="ward" defaultValue={editingBooth?.ward} required min="1" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Status</label>
                      <select name="status" defaultValue={editingBooth?.status || 'NEEDS_ATTENTION'} required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                        <option value="READY">Ready</option>
                        <option value="NEEDS_ATTENTION">Needs Attention</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Total Voters</label>
                      <input type="number" name="totalVoters" defaultValue={editingBooth?.totalVoters} min="0" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold text-slate-700">Target Votes</label>
                      <input type="number" name="targetVotes" defaultValue={editingBooth?.targetVotes} min="0" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-slate-100 flex-shrink-0 bg-white">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (editingBooth ? 'Update Booth' : 'Save Booth')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
