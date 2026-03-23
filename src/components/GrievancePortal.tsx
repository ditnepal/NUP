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
  History,
  MessageSquare,
  Settings
} from 'lucide-react';

import { api } from '../lib/api';
import { Grievance } from '../types';
import { GrievanceStatusBadge, GrievancePriorityBadge } from './ui/GrievanceBadges';
import { StatCard } from './ui/StatCard';

interface GrievancePortalProps {
  user: any;
}

export const GrievancePortal: React.FC<GrievancePortalProps> = ({ user }) => {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  
  const [newGrievance, setNewGrievance] = useState({
    title: '',
    description: '',
    categoryId: '',
    priority: 'MEDIUM'
  });
  
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [responseContent, setResponseContent] = useState('');
  const [isInternalResponse, setIsInternalResponse] = useState(false);
  const [assigneeId, setAssigneeId] = useState('');

  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const gData = await api.get('/grievances');
      const cData = await api.get('/grievances/categories');
      
      setGrievances(gData);
      setCategories(cData);

      if (isAdminOrStaff) {
        const sData = await api.get('/grievances/staff');
        setStaff(sData);
      }
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

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/grievances/categories', newCategory);
      setShowCategoryModal(false);
      setNewCategory({ name: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrievance || !responseContent.trim()) return;
    try {
      await api.post(`/grievances/${selectedGrievance.id}/responses`, {
        content: responseContent,
        isInternal: isInternalResponse
      });
      setResponseContent('');
      setIsInternalResponse(false);
      const updated = await api.get('/grievances');
      setGrievances(updated);
      setSelectedGrievance(updated.find((g: any) => g.id === selectedGrievance.id) || null);
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const handleAssign = async () => {
    if (!selectedGrievance || !assigneeId) return;
    try {
      await api.post(`/grievances/${selectedGrievance.id}/assign`, { userId: assigneeId });
      setAssigneeId('');
      const updated = await api.get('/grievances');
      setGrievances(updated);
      setSelectedGrievance(updated.find((g: any) => g.id === selectedGrievance.id) || null);
    } catch (error) {
      console.error('Error assigning grievance:', error);
    }
  };

  const handleStatusChange = async (action: 'resolve' | 'escalate') => {
    if (!selectedGrievance) return;
    try {
      await api.post(`/grievances/${selectedGrievance.id}/${action}`, {});
      const updated = await api.get('/grievances');
      setGrievances(updated);
      setSelectedGrievance(updated.find((g: any) => g.id === selectedGrievance.id) || null);
    } catch (error) {
      console.error(`Error ${action} grievance:`, error);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Grievance Portal</h1>
          <p className="text-slate-500 mt-2">Submit and track public complaints and internal issues.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdminOrStaff && (
            <button 
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Settings size={20} />
              Categories
            </button>
          )}
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
          >
            <Plus size={20} />
            New Grievance
          </button>
        </div>
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
                  onClick={() => setSelectedGrievance(g)}
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

      {/* New Grievance Modal */}
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

      {/* Manage Categories Modal */}
      {showCategoryModal && isAdminOrStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900">Manage Categories</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-900">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map(c => (
                <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="font-medium text-slate-700">{c.name}</span>
                  <span className="text-xs text-slate-400">{c._count?.grievances || 0} items</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-900">Add New Category</h3>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Name</label>
                <input 
                  required
                  type="text" 
                  value={newCategory.name}
                  onChange={e => setNewCategory({...newCategory, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <input 
                  type="text" 
                  value={newCategory.description}
                  onChange={e => setNewCategory({...newCategory, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 transition-all"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
              >
                Add Category
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Grievance Detail Modal */}
      {selectedGrievance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <GrievanceStatusBadge status={selectedGrievance.status} />
                  <GrievancePriorityBadge priority={selectedGrievance.priority} />
                  <span className="text-sm text-slate-500">• {selectedGrievance.category.name}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedGrievance.title}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <User size={14} />
                  <span>Reported by {selectedGrievance.reporter.displayName} on {new Date(selectedGrievance.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => setSelectedGrievance(null)} className="text-slate-400 hover:text-slate-900">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{selectedGrievance.description}</p>
              </div>

              {/* Admin Actions */}
              {isAdminOrStaff && selectedGrievance.status !== 'RESOLVED' && selectedGrievance.status !== 'CLOSED' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Admin Actions</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <select 
                        value={assigneeId}
                        onChange={e => setAssigneeId(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      >
                        <option value="">Select Assignee...</option>
                        {staff.map(s => (
                          <option key={s.id} value={s.id}>{s.displayName}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleAssign}
                        disabled={!assigneeId}
                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                    <div className="flex-1"></div>
                    <button 
                      onClick={() => handleStatusChange('escalate')}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      Escalate
                    </button>
                    <button 
                      onClick={() => handleStatusChange('resolve')}
                      className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
                    >
                      Mark Resolved
                    </button>
                  </div>
                  {selectedGrievance.assignments && selectedGrievance.assignments.length > 0 && (
                    <div className="text-sm text-slate-600 mt-2">
                      Currently assigned to: <span className="font-medium">{selectedGrievance.assignments[selectedGrievance.assignments.length - 1].user.displayName}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Responses */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <MessageSquare size={20} />
                  Responses & History
                </h3>
                
                <div className="space-y-4">
                  {selectedGrievance.responses?.map((resp: any) => (
                    <div key={resp.id} className={`p-4 rounded-xl ${resp.isInternal ? 'bg-amber-50 border border-amber-100' : 'bg-slate-50 border border-slate-100'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                            <User size={12} />
                          </div>
                          <span className="font-medium text-sm text-slate-900">{resp.user.displayName}</span>
                          {resp.isInternal && <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Internal Note</span>}
                        </div>
                        <span className="text-xs text-slate-500">{new Date(resp.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{resp.content}</p>
                    </div>
                  ))}
                  {(!selectedGrievance.responses || selectedGrievance.responses.length === 0) && (
                    <p className="text-sm text-slate-500 italic">No responses yet.</p>
                  )}
                </div>

                {/* Add Response Form */}
                {selectedGrievance.status !== 'CLOSED' && (
                  <form onSubmit={handleResponseSubmit} className="mt-6 space-y-3">
                    <textarea 
                      required
                      rows={3}
                      value={responseContent}
                      onChange={e => setResponseContent(e.target.value)}
                      placeholder="Type your response..."
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 transition-all resize-none"
                    />
                    <div className="flex items-center justify-between">
                      {isAdminOrStaff ? (
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={isInternalResponse}
                            onChange={e => setIsInternalResponse(e.target.checked)}
                            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                          />
                          Internal note (hidden from reporter)
                        </label>
                      ) : (
                        <div></div>
                      )}
                      <button 
                        type="submit"
                        disabled={!responseContent.trim()}
                        className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
                      >
                        Post Response
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
