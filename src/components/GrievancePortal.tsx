import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search,
  Filter,
  User,
  ArrowRight,
  ShieldAlert,
  History
} from 'lucide-react';

import { api } from '../lib/api';
import { Grievance } from '../types';
import { GrievanceStatusBadge, GrievancePriorityBadge } from './ui/GrievanceBadges';
import { StatCard } from './ui/StatCard';

export const GrievancePortal: React.FC = () => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newGrievance, setNewGrievance] = useState({
    title: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Stagger API calls
      const gData = await api.get('/grievances');
      await new Promise(resolve => setTimeout(resolve, 300));
      const cData = await api.get('/grievances/categories');
      
      setGrievances(gData);
      setCategories(cData);
    } catch (error) {
      console.error('Error fetching grievances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/grievances', newGrievance);
      setShowNewModal(false);
      setNewGrievance({ title: '', description: '', categoryId: '', priority: 'MEDIUM' });
      fetchData();
    } catch (error) {
      console.error('Error submitting grievance:', error);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Grievance Portal</h1>
          <p className="text-slate-500 mt-2">Submit and track public complaints and internal issues.</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
        >
          <Plus size={20} />
          New Grievance
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open" value={grievances.filter(g => g.status === 'OPEN').length} icon={AlertCircle} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="In Progress" value={grievances.filter(g => ['ASSIGNED', 'IN_PROGRESS'].includes(g.status)).length} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard label="Escalated" value={grievances.filter(g => g.status === 'ESCALATED').length} icon={ShieldAlert} color="text-red-600" bg="bg-red-50" />
        <StatCard label="Resolved" value={grievances.filter(g => g.status === 'RESOLVED').length} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search grievances..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              <Filter size={18} />
              Filter
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
              <History size={18} />
              History
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Grievance</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Category</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Priority</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Reporter</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading grievances...</td>
                </tr>
              ) : grievances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">No grievances found.</td>
                </tr>
              ) : grievances.map((g) => (
                <motion.tr 
                  key={g.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{g.title}</div>
                    <div className="text-sm text-slate-500 line-clamp-1">{g.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{g.category.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <GrievanceStatusBadge status={g.status} />
                  </td>
                  <td className="px-6 py-4">
                    <GrievancePriorityBadge priority={g.priority} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                        <User size={14} />
                      </div>
                      <span className="text-sm text-slate-700">{g.reporter.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(g.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <ArrowRight size={18} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Submit Grievance</h2>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-900">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Title</label>
                <input 
                  required
                  type="text" 
                  value={newGrievance.title}
                  onChange={e => setNewGrievance({...newGrievance, title: e.target.value})}
                  placeholder="Brief summary of the issue"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                  <select 
                    required
                    value={newGrievance.categoryId}
                    onChange={e => setNewGrievance({...newGrievance, categoryId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 transition-all"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Priority</label>
                  <select 
                    value={newGrievance.priority}
                    onChange={e => setNewGrievance({...newGrievance, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 transition-all"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea 
                  required
                  rows={4}
                  value={newGrievance.description}
                  onChange={e => setNewGrievance({...newGrievance, description: e.target.value})}
                  placeholder="Provide detailed information about your grievance..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 transition-all resize-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg mt-4"
              >
                Submit Grievance
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
