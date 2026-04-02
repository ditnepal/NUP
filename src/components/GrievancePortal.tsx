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
  MessageSquare,
  Settings
} from 'lucide-react';

import { api } from '../lib/api';
import { Grievance } from '../types';
import { GrievanceStatusBadge, GrievancePriorityBadge } from './ui/GrievanceBadges';
import { StatCard } from './ui/StatCard';
import { toast } from 'sonner';
import { usePermissions } from '../hooks/usePermissions';
import { AuditTrail } from './ui/AuditTrail';
import { PublicLayout } from './PublicLayout';

interface GrievancePortalProps {
  user: any;
}

export const GrievancePortal: React.FC<GrievancePortalProps> = ({ user }) => {
  const { can } = usePermissions(user);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'mine'>(
    can('GRIEVANCES', 'UPDATE') ? 'all' : 'mine'
  );
  
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
  const [decisionNote, setDecisionNote] = useState('');
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

      if (can('GRIEVANCES', 'UPDATE') || can('GRIEVANCES', 'ESCALATE')) {
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
      await api.post(`/grievances/${selectedGrievance.id}/assign`, { 
        userId: assigneeId,
        decisionNote 
      });
      setAssigneeId('');
      setDecisionNote('');
      const updated = await api.get('/grievances');
      setGrievances(updated);
      setSelectedGrievance(updated.find((g: any) => g.id === selectedGrievance.id) || null);
    } catch (error) {
      console.error('Error assigning grievance:', error);
    }
  };

  const handleStatusChange = async (action: 'resolve' | 'escalate') => {
    if (!selectedGrievance) return;
    if (action === 'resolve' && !decisionNote.trim()) {
      toast.error('Decision note is required for resolving a grievance.');
      return;
    }
    if (action === 'escalate' && !decisionNote.trim()) {
      toast.error('Decision note is required for escalating a grievance.');
      return;
    }
    try {
      await api.post(`/grievances/${selectedGrievance.id}/${action}`, { decisionNote });
      toast.success(`Grievance ${action === 'resolve' ? 'resolved' : 'escalated'} successfully`);
      setDecisionNote('');
      const updated = await api.get('/grievances');
      setGrievances(updated);
      setSelectedGrievance(updated.find((g: any) => g.id === selectedGrievance.id) || null);
    } catch (error: any) {
      console.error(`Error ${action} grievance:`, error);
      toast.error(error.message || `Failed to ${action} grievance`);
    }
  };

  const filteredGrievances = (grievances || []).filter(g => {
    if (activeFilter === 'mine') return g.reporter.id === user.id;
    return true;
  });

  if (user?.role === 'PUBLIC') {
    return (
      <PublicLayout user={user}>
        <div className="p-4 md:p-12 w-full max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-6 mb-16">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            >
              <MessageSquare size={14} />
              Citizen Feedback
            </motion.div>
            <h1 className="text-6xl font-black tracking-tight text-slate-900 leading-tight">Public Grievance <span className="text-emerald-600">Portal</span></h1>
            <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
              Submit your complaints, issues, or suggestions directly to our team. We are committed to addressing your concerns promptly and transparently.
            </p>
            <button 
              onClick={() => setShowNewModal(true)}
              className="mt-8 inline-flex items-center justify-center gap-3 bg-emerald-600 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:bg-emerald-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              <Plus size={28} />
              Submit New Grievance
            </button>
          </div>

          <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Your Submissions</h2>
              <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                {filteredGrievances.length} Total
              </div>
            </div>
            
            {loading ? (
              <div className="py-20 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              </div>
            ) : filteredGrievances.length === 0 ? (
              <div className="bg-white rounded-[3rem] border border-slate-200 p-20 text-center shadow-sm">
                <ShieldAlert className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No Submissions Yet</h3>
                <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">You haven't submitted any grievances. Your voice matters — click the button above to start.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredGrievances?.map((g) => (
                  <motion.div 
                    key={g.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedGrievance(g)}
                    className="bg-white rounded-[2rem] border border-slate-200 p-8 cursor-pointer hover:border-emerald-500 hover:shadow-2xl transition-all group relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                      <div className="flex items-center gap-4">
                        <GrievanceStatusBadge status={g.status} />
                        <span className="text-xs font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full uppercase tracking-widest border border-slate-100">{g.category.name}</span>
                      </div>
                      <div className="text-sm text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(g.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors leading-tight">{g.title}</h3>
                    <p className="text-slate-500 text-lg line-clamp-2 leading-relaxed opacity-80">{g.description}</p>
                    
                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <ArrowRight size={24} className="text-emerald-600" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* New Grievance Modal */}
          {showNewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] p-10 md:p-12 w-full max-w-2xl shadow-2xl space-y-10"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Submit Grievance</h2>
                    <p className="text-slate-500 font-medium">Please provide as much detail as possible.</p>
                  </div>
                  <button onClick={() => setShowNewModal(false)} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all">
                    <Plus size={32} className="rotate-45" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Grievance Title</label>
                    <input 
                      required
                      type="text" 
                      value={newGrievance.title}
                      onChange={e => setNewGrievance({...newGrievance, title: e.target.value})}
                      placeholder="e.g., Issue with local infrastructure"
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Category</label>
                      <select 
                        required
                        value={newGrievance.categoryId}
                        onChange={e => setNewGrievance({...newGrievance, categoryId: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg appearance-none cursor-pointer"
                      >
                        <option value="">Select Category</option>
                        {categories?.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Priority Level</label>
                      <select 
                        required
                        value={newGrievance.priority}
                        onChange={e => setNewGrievance({...newGrievance, priority: e.target.value as any})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-lg appearance-none cursor-pointer"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Detailed Description</label>
                    <textarea 
                      required
                      rows={6}
                      value={newGrievance.description}
                      onChange={e => setNewGrievance({...newGrievance, description: e.target.value})}
                      placeholder="Explain the situation in detail..."
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-lg"
                    />
                  </div>
                  
                  <div className="pt-6 flex justify-end gap-6">
                    <button 
                      type="button"
                      onClick={() => setShowNewModal(false)}
                      className="px-10 py-5 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-colors text-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-10 py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 text-lg"
                    >
                      Submit Grievance
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* View Grievance Modal */}
          {selectedGrievance && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-10 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <GrievanceStatusBadge status={selectedGrievance.status} />
                      <GrievancePriorityBadge priority={selectedGrievance.priority} />
                      <span className="text-xs font-black text-slate-400 bg-white px-4 py-1.5 rounded-full uppercase tracking-widest border border-slate-200">{selectedGrievance.category.name}</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{selectedGrievance.title}</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Submitted on {new Date(selectedGrievance.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <button onClick={() => setSelectedGrievance(null)} className="p-3 text-slate-400 hover:text-slate-900 bg-white rounded-full shadow-sm transition-all">
                    <Plus size={32} className="rotate-45" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 space-y-12">
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 whitespace-pre-wrap text-xl leading-relaxed opacity-90">{selectedGrievance.description}</p>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                      <MessageSquare size={24} className="text-emerald-600" />
                      <h3 className="font-black text-slate-900 text-xl tracking-tight">Updates & Responses</h3>
                    </div>
                    
                    {selectedGrievance.responses?.filter(r => !r.isInternal).length === 0 ? (
                      <div className="text-center py-16 text-slate-400 italic bg-slate-50 rounded-[2rem] border border-slate-100 border-dashed">
                        No responses yet. We will update you soon.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {selectedGrievance.responses?.filter(r => !r.isInternal)?.map(response => (
                          <div key={response.id} className={`p-8 rounded-[2rem] ${response.userId === user?.id ? 'bg-emerald-50 ml-12 border border-emerald-100' : 'bg-slate-50 mr-12 border border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 border border-slate-100">
                                  <User size={16} />
                                </div>
                                <span className="font-black text-sm text-slate-900 uppercase tracking-widest">{response.user?.displayName || 'System'}</span>
                              </div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(response.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-700 whitespace-pre-wrap text-lg leading-relaxed">{response.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-10 border-t border-slate-100 bg-slate-50">
                  <form onSubmit={handleResponseSubmit} className="space-y-6">
                    <textarea 
                      required
                      value={responseContent}
                      onChange={e => setResponseContent(e.target.value)}
                      placeholder="Add a comment or provide more details..."
                      className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-lg"
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        disabled={!responseContent.trim()}
                        className="px-10 py-5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-100 text-lg"
                      >
                        Send Message
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </PublicLayout>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Grievance Portal</h1>
          <p className="text-slate-500 mt-2">Submit and track public complaints and internal issues.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdminOrStaff && (
            <div className="flex bg-slate-100 p-1 rounded-xl mr-2">
              <button 
                onClick={() => setActiveFilter('mine')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === 'mine' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                My Grievances
              </button>
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                All Grievances
              </button>
            </div>
          )}
          {can('GRIEVANCES', 'UPDATE') && (
            <button 
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Settings size={20} />
              Categories
            </button>
          )}
          {can('GRIEVANCES', 'CREATE') && (
            <button 
              onClick={() => setShowNewModal(true)}
              className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-lg"
            >
              <Plus size={20} />
              New Grievance
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open" value={(grievances || []).filter(g => g.status === 'OPEN').length} icon={AlertCircle} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="In Progress" value={(grievances || []).filter(g => ['ASSIGNED', 'IN_PROGRESS'].includes(g.status)).length} icon={Clock} color="text-yellow-600" bg="bg-yellow-50" />
        <StatCard label="Escalated" value={(grievances || []).filter(g => g.status === 'ESCALATED').length} icon={ShieldAlert} color="text-red-600" bg="bg-red-50" />
        <StatCard label="Resolved" value={(grievances || []).filter(g => g.status === 'RESOLVED').length} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
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
              ) : filteredGrievances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <MessageSquare className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-lg font-medium text-slate-900">No grievances found</p>
                      <p className="text-sm text-slate-500 max-w-sm mt-1">
                        {activeFilter === 'mine' 
                          ? "You haven't submitted any grievances yet." 
                          : "There are no grievances to display."}
                      </p>
                      {can('GRIEVANCES', 'CREATE') && (
                        <button 
                          onClick={() => setShowNewModal(true)}
                          className="mt-4 text-emerald-600 font-medium hover:text-emerald-700"
                        >
                          Submit a Grievance
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : filteredGrievances?.map((g) => (
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
                    {categories?.map(c => (
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
      {showCategoryModal && can('GRIEVANCES', 'UPDATE') && (
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
              {categories?.map(c => (
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
              <button onClick={() => {
                setSelectedGrievance(null);
                setDecisionNote('');
              }} className="text-slate-400 hover:text-slate-900">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-8">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{selectedGrievance.description}</p>
              </div>

              {/* Admin Actions */}
              {(can('GRIEVANCES', 'UPDATE') || can('GRIEVANCES', 'ESCALATE')) && selectedGrievance.status !== 'RESOLVED' && selectedGrievance.status !== 'CLOSED' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Admin Actions</h3>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Decision Note (Required for Resolve and Escalate) *</label>
                    <textarea 
                      value={decisionNote}
                      onChange={e => setDecisionNote(e.target.value.substring(0, 300))}
                      maxLength={300}
                      placeholder="Explain the reason for assignment, resolution (Required), or escalation (Required)..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 outline-none"
                      rows={2}
                    />
                    <div className="text-[10px] text-slate-400 text-right">{decisionNote.length}/300</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {can('GRIEVANCES', 'UPDATE') && (
                      <div className="flex items-center gap-2">
                        <select 
                          value={assigneeId}
                          onChange={e => setAssigneeId(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="">Select Assignee...</option>
                          {staff?.map(s => (
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
                    )}
                    <div className="flex-1"></div>
                    {can('GRIEVANCES', 'ESCALATE') && (
                      <button 
                        onClick={() => handleStatusChange('escalate')}
                        disabled={!decisionNote.trim()}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          decisionNote.trim() ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Escalate
                      </button>
                    )}
                    {can('GRIEVANCES', 'UPDATE') && (
                      <button 
                        onClick={() => handleStatusChange('resolve')}
                        disabled={!decisionNote.trim()}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          decisionNote.trim() ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Mark Resolved
                      </button>
                    )}
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

                {/* Audit Trail Section */}
                <AuditTrail logs={selectedGrievance.auditTrail} className="pt-6 border-t border-slate-100" />

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
                      {can('GRIEVANCES', 'UPDATE') ? (
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
