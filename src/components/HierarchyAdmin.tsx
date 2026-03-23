import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { OrganizationUnit } from '../types';
import { Plus, ChevronRight, ChevronDown, MapPin, Building2, Users, Edit2, Trash2, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HierarchyAdmin: React.FC = () => {
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrganizationUnit | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      const data = await api.get('/hierarchy');
      setUnits(data);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openAddModal = (pId: string | null = null) => {
    setEditingUnit(null);
    setParentId(pId);
    setIsModalOpen(true);
  };

  const openEditModal = (unit: OrganizationUnit) => {
    setEditingUnit(unit);
    setParentId(unit.parentId || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      await api.delete(`/hierarchy/${id}`);
      setMessage({ type: 'success', text: 'Unit deleted successfully' });
      fetchHierarchy();
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete unit' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      level: formData.get('level') as string,
      code: formData.get('code') as string || undefined,
      parentId: parentId || undefined,
    };

    try {
      if (editingUnit) {
        await api.put(`/hierarchy/${editingUnit.id}`, data);
        setMessage({ type: 'success', text: 'Unit updated successfully' });
      } else {
        await api.post('/hierarchy', data);
        setMessage({ type: 'success', text: 'Unit created successfully' });
      }
      setIsModalOpen(false);
      fetchHierarchy();
    } catch (error: any) {
      console.error('Error saving unit:', error);
      const errorMsg = error.response?.data?.error;
      const detail = Array.isArray(errorMsg) ? errorMsg[0]?.message : errorMsg;
      setMessage({ type: 'error', text: detail || 'Failed to save unit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderUnit = (unit: any, depth = 0) => {
    const isExpanded = expanded[unit.id];
    const hasChildren = unit.children && unit.children.length > 0;

    return (
      <div key={unit.id} className="ml-4">
        <div className="flex items-center p-2 hover:bg-gray-50 rounded group border-b border-gray-100">
          <div 
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => hasChildren && toggleExpand(unit.id)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={16} className="text-gray-400 mr-2" /> : <ChevronRight size={16} className="text-gray-400 mr-2" />
            ) : (
              <div className="w-6" />
            )}
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium text-gray-900">{unit.name}</span>
                <span className="ml-2 px-2 py-0.5 text-[10px] bg-blue-50 text-blue-600 rounded-full font-bold uppercase">
                  {unit.level}
                </span>
                {unit.code && (
                  <span className="ml-2 text-[10px] text-gray-400 font-mono">#{unit.code}</span>
                )}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1"><Building2 size={10} /> Offices: {unit.offices?.length || 0}</span>
                <span className="flex items-center gap-1"><Users size={10} /> Users: {unit.users?.length || 0}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => openAddModal(unit.id)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
              title="Add Sub-unit"
            >
              <Plus size={16} />
            </button>
            <button 
              onClick={() => openEditModal(unit)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Edit Unit"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => handleDelete(unit.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete Unit"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div className="border-l-2 border-gray-100 ml-2">
            {unit.children.map((child: any) => renderUnit(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading && units.length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  const rootUnits = units.filter(u => !u.parentId);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Hierarchy</h1>
          <p className="text-gray-500 text-sm">Manage structural units and geographic organizational scope.</p>
        </div>
        <button 
          onClick={() => openAddModal(null)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 shadow-sm transition-all"
        >
          <Plus size={20} />
          Add Root Unit
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Name & Level</span>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</span>
        </div>
        <div className="p-2 overflow-x-auto">
          <div className="min-w-[400px]">
            {rootUnits.length > 0 ? (
              rootUnits.map(unit => renderUnit(unit))
            ) : (
              <div className="py-12 text-center text-gray-500">
                No organizational units found. Start by adding a root unit.
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingUnit ? 'Edit Unit' : 'Add New Unit'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Unit Name</label>
                  <input 
                    name="name" 
                    defaultValue={editingUnit?.name} 
                    required 
                    placeholder="e.g. Central Committee"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Level</label>
                  <select 
                    name="level" 
                    defaultValue={editingUnit?.level || 'NATIONAL'} 
                    required 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    <option value="NATIONAL">National</option>
                    <option value="PROVINCE">Province</option>
                    <option value="DISTRICT">District</option>
                    <option value="CONSTITUENCY">Constituency</option>
                    <option value="MUNICIPALITY">Municipality</option>
                    <option value="WARD">Ward</option>
                    <option value="BOOTH">Booth</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Unit Code (Optional)</label>
                  <input 
                    name="code" 
                    defaultValue={editingUnit?.code} 
                    placeholder="e.g. NAT-001"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingUnit ? 'Update Unit' : 'Save Unit')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
