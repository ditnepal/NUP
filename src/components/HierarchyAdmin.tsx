import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { OrganizationUnit, OrgCommittee, OrgOfficeBearer, Office, UserProfile } from '../types';
import { Plus, ChevronRight, ChevronDown, MapPin, Building2, Users, Edit2, Trash2, X, Loader2, AlertCircle, CheckCircle2, Shield, UserPlus, Calendar, GitGraph, AlertTriangle, ExternalLink, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePermissions } from '../hooks/usePermissions';
import { UserAdmin } from './UserAdmin';
import { toast } from 'sonner';

interface HierarchyAdminProps {
  user?: UserProfile | null;
}

export const HierarchyAdmin: React.FC<HierarchyAdminProps> = ({ user }) => {
  const { can } = usePermissions(user);
  const [activeTab, setActiveTab] = useState<'structure' | 'users' | 'offices'>('structure');
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState(false);
  const [selectedUnitForGovernance, setSelectedUnitForGovernance] = useState<OrganizationUnit | null>(null);
  const [isOfficesModalOpen, setIsOfficesModalOpen] = useState(false);
  const [selectedUnitForOffices, setSelectedUnitForOffices] = useState<OrganizationUnit | null>(null);
  const [isUserScopeModalOpen, setIsUserScopeModalOpen] = useState(false);
  const [selectedUnitForUserScope, setSelectedUnitForUserScope] = useState<OrganizationUnit | null>(null);
  const [unitUsers, setUnitUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [isOfficeFormOpen, setIsOfficeFormOpen] = useState(false);
  const [committees, setCommittees] = useState<OrgCommittee[]>([]);
  const [loadingCommittees, setLoadingCommittees] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrganizationUnit | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN';

  const getReadinessStatus = (unit: any) => {
    const hasOffice = unit.offices && unit.offices?.length > 0;
    const hasUsers = unit.users && unit.users?.length > 0;
    
    if (hasOffice && hasUsers) return { label: 'Operational', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={12} /> };
    if (hasOffice || hasUsers) return { label: 'Partial Setup', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <AlertTriangle size={12} /> };
    return { label: 'Setup Required', color: 'bg-slate-50 text-slate-400 border-slate-100', icon: <AlertCircle size={12} /> };
  };

  useEffect(() => {
    if (activeTab === 'structure') {
      fetchHierarchy();
    }
  }, [activeTab]);

  const fetchHierarchy = async () => {
    try {
      // Use /scoped for non-admins to get their root, or / for admins to get all
      const endpoint = isAdmin ? '/hierarchy' : '/hierarchy/scoped';
      const data = await api.get(endpoint);
      setUnits(data);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommittees = async (unitId: string) => {
    setLoadingCommittees(true);
    try {
      const data = await api.get(`/hierarchy/${unitId}/committees`);
      setCommittees(data);
    } catch (error) {
      console.error('Error fetching committees:', error);
    } finally {
      setLoadingCommittees(false);
    }
  };

  const openGovernanceModal = (unit: OrganizationUnit) => {
    setSelectedUnitForGovernance(unit);
    setIsGovernanceModalOpen(true);
    fetchCommittees(unit.id);
  };

  const fetchOffices = async (unitId: string) => {
    setLoadingOffices(true);
    try {
      const data = await api.get(`/offices?unitId=${unitId}`);
      setOffices(data);
    } catch (error) {
      console.error('Error fetching offices:', error);
    } finally {
      setLoadingOffices(false);
    }
  };

  const openOfficesModal = (unit: OrganizationUnit) => {
    setSelectedUnitForOffices(unit);
    setIsOfficesModalOpen(true);
    fetchOffices(unit.id);
  };

  const fetchUnitUsers = async (unitId: string) => {
    setLoadingUsers(true);
    try {
      const data = await api.get(`/users?orgUnitId=${unitId}`);
      setUnitUsers(data);
    } catch (error) {
      console.error('Error fetching unit users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const data = await api.get('/users');
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const openUserScopeModal = (unit: OrganizationUnit) => {
    setSelectedUnitForUserScope(unit);
    setIsUserScopeModalOpen(true);
    fetchUnitUsers(unit.id);
    fetchAllUsers();
  };

  const handleAssignUser = async (userId: string) => {
    if (!selectedUnitForUserScope) return;
    try {
      await api.patch(`/users/${userId}/scope`, { orgUnitId: selectedUnitForUserScope.id });
      fetchUnitUsers(selectedUnitForUserScope.id);
      setMessage({ type: 'success', text: 'User assigned to unit successfully' });
    } catch (error) {
      console.error('Error assigning user:', error);
      setMessage({ type: 'error', text: 'Failed to assign user' });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedUnitForUserScope) return;
    try {
      await api.patch(`/users/${userId}/scope`, { orgUnitId: null });
      fetchUnitUsers(selectedUnitForUserScope.id);
      setMessage({ type: 'success', text: 'User removed from unit scope' });
    } catch (error) {
      console.error('Error removing user:', error);
      setMessage({ type: 'error', text: 'Failed to remove user' });
    }
  };

  const handleOfficeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUnitForOffices) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const parseNumber = (val: any) => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = parseFloat(val as string);
      return isNaN(parsed) ? null : parsed;
    };

    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      address: formData.get('address') as string,
      contactNumber: formData.get('contactNumber') as string || null,
      email: formData.get('email') as string || null,
      latitude: parseNumber(formData.get('latitude')),
      longitude: parseNumber(formData.get('longitude')),
      description: formData.get('description') as string || null,
      province: formData.get('province') as string || null,
      district: formData.get('district') as string || null,
      locality: formData.get('locality') as string || null,
      ward: parseNumber(formData.get('ward')),
      municipality: formData.get('municipality') as string || null,
      isActive: formData.get('isActive') === 'on',
      isPublic: formData.get('isPublic') === 'on',
      orgUnitId: selectedUnitForOffices.id
    };

    try {
      if (editingOffice) {
        await api.put(`/offices/${editingOffice.id}`, data);
        setMessage({ type: 'success', text: 'Office updated successfully' });
      } else {
        await api.post('/offices', data);
        setMessage({ type: 'success', text: 'Office created successfully' });
      }
      setIsOfficeFormOpen(false);
      fetchOffices(selectedUnitForOffices.id);
    } catch (error: any) {
      console.error('Error saving office:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save office' });
    } finally {
      setIsSubmitting(false);
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
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    
    setLoading(true);
    try {
      await api.delete(`/hierarchy/${deleteTarget}`);
      toast.success('Unit deleted successfully');
      fetchHierarchy();
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      toast.error(error.response?.data?.error || 'Failed to delete unit');
    } finally {
      setLoading(false);
      setDeleteTarget(null);
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
      code: formData.get('code') as string || null,
      parentId: parentId || null,
      isActive: formData.get('isActive') === 'on',
      description: formData.get('description') as string || null,
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      contactEmail: formData.get('contactEmail') as string || null,
      contactPhone: formData.get('contactPhone') as string || null,
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

  const handleDeleteOffice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this office?')) return;
    try {
      await api.delete(`/offices/${id}`);
      toast.success('Office deleted successfully');
      if (selectedUnitForOffices) {
        fetchOffices(selectedUnitForOffices.id);
      }
      if (activeTab === 'offices') {
        fetchAllOffices();
      }
    } catch (error) {
      console.error('Error deleting office:', error);
      toast.error('Failed to delete office');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const [allOffices, setAllOffices] = useState<Office[]>([]);
  const [loadingAllOffices, setLoadingAllOffices] = useState(false);

  const fetchAllOffices = async () => {
    setLoadingAllOffices(true);
    try {
      const data = await api.get('/offices');
      setAllOffices(data);
    } catch (error) {
      console.error('Error fetching all offices:', error);
    } finally {
      setLoadingAllOffices(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'offices') {
      fetchAllOffices();
    }
  }, [activeTab]);

  const renderUnit = (unit: any, depth = 0) => {
    const isExpanded = expanded[unit.id];
    const hasChildren = unit.children && unit.children?.length > 0;

    return (
      <div key={unit.id} className="ml-4">
        <div className="flex items-center p-3 hover:bg-slate-50/80 rounded-2xl group border-b border-slate-100 transition-colors">
          <div 
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => hasChildren && toggleExpand(unit.id)}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown size={18} className="text-slate-400 mr-2" /> : <ChevronRight size={18} className="text-slate-400 mr-2" />
            ) : (
              <div className="w-6" />
            )}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800">{unit.name}</span>
                  <span className="px-2 py-0.5 text-[9px] bg-blue-50 text-blue-600 rounded-full font-black uppercase tracking-widest border border-blue-100">
                    {unit.level}
                  </span>
                  {(() => {
                    const readiness = getReadinessStatus(unit);
                    return (
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-[9px] rounded-full font-black uppercase tracking-widest border ${readiness.color}`}>
                        {readiness.icon}
                        {readiness.label}
                      </span>
                    );
                  })()}
                  {!unit.isActive && (
                    <span className="px-2 py-0.5 text-[9px] bg-slate-100 text-slate-400 rounded-full font-black uppercase tracking-widest border border-slate-200">
                      Inactive
                    </span>
                  )}
                  {unit.code && (
                    <span className="text-[10px] text-slate-400 font-mono font-bold">#{unit.code}</span>
                  )}
                </div>
                {unit.description && (
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 max-w-md">{unit.description}</p>
                )}
                <div className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-4">
                  <span className={`flex items-center gap-1 font-bold ${(unit.offices?.length || 0) > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Building2 size={12} className={(unit.offices?.length || 0) > 0 ? 'text-blue-400' : 'text-slate-300'} /> 
                    {unit.offices?.length || 0} Offices
                  </span>
                  <span className={`flex items-center gap-1 font-bold ${(unit.users?.length || 0) > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <Users size={12} className={(unit.users?.length || 0) > 0 ? 'text-indigo-400' : 'text-slate-300'} /> 
                    {unit.users?.length || 0} Scoped Users
                  </span>
                  {(unit.children?.length || 0) > 0 && (
                    <span className="flex items-center gap-1 font-bold text-slate-400">
                      <GitGraph size={12} className="text-slate-300" /> 
                      {unit.children?.length || 0} Sub-units
                    </span>
                  )}
                </div>
              </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
              <button 
                onClick={() => openUserScopeModal(unit)}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Manage Scoped Users"
              >
                <Users size={16} />
              </button>
              <button 
                onClick={() => openOfficesModal(unit)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Manage Offices"
              >
                <MapPin size={16} />
              </button>
              <button 
                onClick={() => openGovernanceModal(unit)}
                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                title="Manage Governance"
              >
                <Shield size={16} />
              </button>
              <button 
                onClick={() => openAddModal(unit.id)}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Add Sub-entity"
              >
                <Plus size={16} />
              </button>
              <button 
                onClick={() => openEditModal(unit)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                title="Edit Entity"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(unit.id)}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                title="Delete Entity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div className="border-l-2 border-slate-100 ml-3 pl-1">
            {unit.children?.map((child: any) => renderUnit(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading && (!units || units?.length === 0)) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  const rootUnits = units?.filter(u => !u.parentId) || [];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Organization Management</h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Centralized control for organizational structure, geographic units, regional offices, and administrative access control.
          </p>
        </div>
      </div>

      {/* Tabs - Responsive Scrollable */}
      <div className="flex overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex space-x-1 bg-slate-100 p-1.5 rounded-2xl w-fit shrink-0">
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === 'structure'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
            }`}
          >
            <GitGraph size={18} />
            Organizational Structure
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('offices')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'offices'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              <MapPin size={18} />
              Regional Offices
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Shield size={18} />
              Administrative Access
            </button>
          )}
        </div>
      </div>

      {activeTab === 'structure' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          {/* Structure Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Units</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><GitGraph size={16} /></div>
              </div>
              <div className="text-3xl font-black text-slate-800">{units?.length || 0}</div>
              <div className="text-[10px] text-slate-400 mt-1">Active structural nodes</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Root Entities</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Building2 size={16} /></div>
              </div>
              <div className="text-3xl font-black text-slate-800">{rootUnits?.length || 0}</div>
              <div className="text-[10px] text-slate-400 mt-1">Top-level organizations</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Offices</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><MapPin size={16} /></div>
              </div>
              <div className="text-3xl font-black text-slate-800">
                {units?.reduce((acc, u) => acc + (u.offices?.length || 0), 0) || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Geographic contact points</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scoped Users</span>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Users size={16} /></div>
              </div>
              <div className="text-3xl font-black text-slate-800">
                {units?.reduce((acc, u) => acc + (u.users?.length || 0), 0) || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Assigned administrators</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Readiness</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={16} /></div>
              </div>
              <div className="text-3xl font-black text-slate-800">
                {units?.filter(u => (u.offices?.length || 0) > 0 && (u.users?.length || 0) > 0).length || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Units with office & users</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="text-blue-600" size={20} />
              Organizational Tree
            </h3>
            {isAdmin && can('HIERARCHY', 'CREATE') && (
              <button 
                onClick={() => openAddModal(null)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
              >
                <Plus size={20} />
                Add Root Entity
              </button>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="font-bold text-sm flex-1">{message.text}</p>
              <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full">
                <X size={16} />
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity Name & Governance Level</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Administrative Actions</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <div className="min-w-[500px]">
                {rootUnits?.length > 0 ? (
                  rootUnits?.map(unit => renderUnit(unit))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <GitGraph size={32} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">No Organizational Structure Defined</h4>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">Start by adding your first root entity to build the organizational hierarchy.</p>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => openAddModal(null)}
                        className="text-blue-600 font-bold text-sm hover:underline"
                      >
                        Add Root Entity Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'offices' && isAdmin && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Building2 size={28} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HQ Coverage</div>
                <div className="text-3xl font-black text-slate-800">
                  {(allOffices || []).filter(o => o.type === 'HEADQUARTERS').length || 0}
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <MapPin size={28} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regional Presence</div>
                <div className="text-3xl font-black text-slate-800">
                  {(allOffices || []).filter(o => o.type === 'REGIONAL').length || 0}
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Users size={28} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Points</div>
                <div className="text-3xl font-black text-slate-800">
                  {(allOffices || []).filter(o => o.type === 'CONTACT_POINT').length || 0}
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
                <AlertTriangle size={28} />
              </div>
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setup Needed</div>
                <div className="text-3xl font-black text-slate-800">
                  {(allOffices || []).filter(o => !o.isActive).length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/30">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Regional Office Inventory</h3>
                <p className="text-sm text-slate-500">Comprehensive list of all physical organizational locations.</p>
              </div>
              <div className="flex gap-2">
                <div className="px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-black border border-blue-100">
                  Total: {allOffices?.length || 0}
                </div>
                <div className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-100">
                  Active: {(allOffices || []).filter(o => o.isActive).length || 0}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Office Name</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit / Level</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingAllOffices ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin text-blue-600" size={32} />
                          <p className="text-sm text-slate-500">Loading office inventory...</p>
                        </div>
                      </td>
                    </tr>
                  ) : allOffices?.length > 0 ? (
                    allOffices?.map(office => (
                      <tr key={office.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-8 py-5">
                          <div className="font-bold text-slate-800">{office.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={12} className="text-slate-400" /> {office.address}
                          </div>
                          {office.latitude && office.longitude && (
                            <a 
                              href={`https://www.google.com/maps?q=${office.latitude},${office.longitude}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 mt-1.5"
                            >
                              <ExternalLink size={10} /> View on Map
                            </a>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-slate-700">{(office as any).orgUnit?.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{(office as any).orgUnit?.level}</div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-wider">
                            {office.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-xs font-bold text-slate-600">{office.contactNumber || 'No Phone'}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{office.email || 'No Email'}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex gap-1">
                            {office.isActive ? (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">Active</span>
                            ) : (
                              <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-full border border-slate-200 uppercase tracking-widest">Inactive</span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingOffice(office);
                                setSelectedUnitForOffices((office as any).orgUnit);
                                setIsOfficesModalOpen(true);
                                setIsOfficeFormOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Edit Office"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteOffice(office.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              title="Delete Office"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                          <Building2 size={24} />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">No regional offices registered in the system.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && isAdmin && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <UserAdmin />
        </div>
      )}

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
                  {editingUnit ? 'Edit Organizational Entity' : 'Register New Entity'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Entity Name</label>
                  <input 
                    name="name" 
                    defaultValue={editingUnit?.name} 
                    required 
                    placeholder="e.g. Central Committee"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Governance Level</label>
                  <select 
                    name="level" 
                    defaultValue={editingUnit?.level || 'NATIONAL'} 
                    required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                  >
                    <option value="NATIONAL">National / Federal</option>
                    <option value="PROVINCE">Province / State</option>
                    <option value="DISTRICT">District / Region</option>
                    <option value="CONSTITUENCY">Constituency / Area</option>
                    <option value="MUNICIPALITY">Municipality / Local</option>
                    <option value="WARD">Ward / Neighborhood</option>
                    <option value="BOOTH">Booth / Polling Unit</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Entity Code (Optional)</label>
                  <input 
                    name="code" 
                    defaultValue={editingUnit?.code} 
                    placeholder="e.g. NAT-001"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Description & Purpose</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingUnit?.description} 
                    placeholder="Brief description of the unit's organizational purpose..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact Email</label>
                    <input 
                      type="email"
                      name="contactEmail" 
                      defaultValue={editingUnit?.contactEmail} 
                      placeholder="unit@party.org"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
                    <input 
                      type="tel"
                      name="contactPhone" 
                      defaultValue={editingUnit?.contactPhone} 
                      placeholder="+1234567890"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Display Order</label>
                  <input 
                    type="number"
                    name="sortOrder" 
                    defaultValue={editingUnit?.sortOrder || 0} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm" 
                  />
                </div>
                
                <div className="flex items-center gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    name="isActive" 
                    defaultChecked={editingUnit ? editingUnit.isActive : true}
                    className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 transition-all"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Mark as Active Entity</label>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingUnit ? 'Update Entity' : 'Register Entity')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGovernanceModalOpen && selectedUnitForGovernance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
                    <Shield size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Governance & Leadership</h3>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-2">
                      <Building2 size={14} className="text-slate-400" />
                      {selectedUnitForGovernance.name} 
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-indigo-600 font-bold uppercase text-[10px] tracking-widest">{selectedUnitForGovernance.level}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsGovernanceModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Committees Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-lg font-black text-slate-800 flex items-center gap-2 tracking-tight">
                        Active Committees
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">Manage executive and advisory bodies within this unit.</p>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => {
                          const name = window.prompt('Enter Committee Name:');
                          const type = window.prompt('Enter Committee Type (e.g. EXECUTIVE, ADVISORY):');
                          if (name && type) {
                            api.post(`/hierarchy/${selectedUnitForGovernance.id}/committees`, { name, type })
                              .then(() => fetchCommittees(selectedUnitForGovernance.id));
                          }
                        }}
                        className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                      >
                        <Plus size={16} /> Add Committee
                      </button>
                    )}
                  </div>

                  {loadingCommittees ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                      <Loader2 className="animate-spin text-indigo-600" size={32} />
                      <p className="text-sm text-slate-500 font-bold">Loading governance structure...</p>
                    </div>
                  ) : committees?.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {committees?.map(committee => (
                        <div key={committee.id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md group">
                          <div className="flex items-center justify-between mb-6">
                            <div className="space-y-1">
                              <h5 className="font-black text-slate-800 text-lg tracking-tight">{committee.name}</h5>
                              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-indigo-100">
                                {committee.type}
                              </span>
                            </div>
                            {isAdmin && (
                              <button 
                                onClick={() => {
                                  const fullName = window.prompt('Enter Office Bearer Full Name:');
                                  const position = window.prompt('Enter Position (e.g. President, Secretary):');
                                  if (fullName && position) {
                                    api.post(`/hierarchy/committees/${committee.id}/bearers`, { 
                                      fullName, 
                                      position,
                                      termStart: new Date().toISOString()
                                    }).then(() => fetchCommittees(selectedUnitForGovernance.id));
                                  }
                                }}
                                className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100 opacity-0 group-hover:opacity-100"
                                title="Add Office Bearer"
                              >
                                <UserPlus size={18} />
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Office Bearers</div>
                            {committee.bearers && committee.bearers.length > 0 ? (
                              committee.bearers?.map(bearer => (
                                <div key={bearer.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-white hover:border-indigo-100 transition-all group/bearer">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black border border-slate-100 shadow-sm">
                                      {bearer.fullName.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-black text-slate-800 text-sm tracking-tight">{bearer.fullName}</p>
                                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{bearer.position}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                                      bearer.status === 'ACTIVE' 
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                        : 'bg-slate-100 text-slate-400 border-slate-200'
                                    } uppercase tracking-widest`}>
                                      {bearer.status}
                                    </span>
                                    <p className="text-[9px] text-slate-400 mt-1.5 font-bold flex items-center justify-end gap-1">
                                      <Calendar size={10} /> {new Date(bearer.termStart).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">No office bearers assigned</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200 space-y-4">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto text-slate-300 shadow-sm">
                        <Shield size={40} />
                      </div>
                      <div>
                        <h5 className="text-slate-800 font-black text-lg">No Committees Defined</h5>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">This unit does not have any active committees or leadership bodies registered yet.</p>
                      </div>
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            const name = window.prompt('Enter Committee Name:');
                            const type = window.prompt('Enter Committee Type:');
                            if (name && type) {
                              api.post(`/hierarchy/${selectedUnitForGovernance.id}/committees`, { name, type })
                                .then(() => fetchCommittees(selectedUnitForGovernance.id));
                            }
                          }}
                          className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline"
                        >
                          Create First Committee
                        </button>
                      )}
                    </div>
                  )}
                </section>
              </div>

              <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button 
                  onClick={() => setIsGovernanceModalOpen(false)}
                  className="px-10 py-3.5 bg-slate-900 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-lg shadow-slate-200 active:scale-95"
                >
                  Close Governance Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}


        {isOfficesModalOpen && selectedUnitForOffices && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Unit Offices</h3>
                  <p className="text-sm text-slate-500">{selectedUnitForOffices.name} ({selectedUnitForOffices.level})</p>
                </div>
                <button onClick={() => setIsOfficesModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isOfficeFormOpen ? (
                  <form onSubmit={handleOfficeSubmit} className="space-y-6 bg-slate-50/50 p-8 rounded-3xl border border-slate-200 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-black text-slate-800 tracking-tight">{editingOffice ? 'Update Office Details' : 'Register New Office'}</h4>
                      <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100 uppercase tracking-widest">
                        {editingOffice ? 'Editing' : 'New Entry'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Office Name</label>
                        <input 
                          name="name" 
                          defaultValue={editingOffice?.name} 
                          required 
                          placeholder="e.g. Regional Headquarters"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Office Type</label>
                        <select 
                          name="type" 
                          defaultValue={editingOffice?.type || 'CONTACT_POINT'} 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                        >
                          <option value="HEADQUARTERS">Headquarters</option>
                          <option value="REGIONAL">Regional Office</option>
                          <option value="CONTACT_POINT">Contact Point / Helpdesk</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Physical Address</label>
                        <input 
                          name="address" 
                          defaultValue={editingOffice?.address} 
                          required 
                          placeholder="Full street address, building, floor..."
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact Number</label>
                        <input 
                          name="contactNumber" 
                          defaultValue={editingOffice?.contactNumber || ''} 
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Official Email</label>
                        <input 
                          name="email" 
                          type="email" 
                          defaultValue={editingOffice?.email || ''} 
                          placeholder="office@organization.org"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Latitude</label>
                        <input 
                          name="latitude" 
                          type="number" 
                          step="any" 
                          defaultValue={editingOffice?.latitude ?? ''} 
                          placeholder="e.g. 27.7172"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Longitude</label>
                        <input 
                          name="longitude" 
                          type="number" 
                          step="any" 
                          defaultValue={editingOffice?.longitude ?? ''} 
                          placeholder="e.g. 85.3240"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Province</label>
                        <input 
                          name="province" 
                          defaultValue={editingOffice?.province || ''} 
                          placeholder="e.g. Bagmati"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">District</label>
                        <input 
                          name="district" 
                          defaultValue={editingOffice?.district || ''} 
                          placeholder="e.g. Kathmandu"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Municipality</label>
                        <input 
                          name="municipality" 
                          defaultValue={editingOffice?.municipality || ''} 
                          placeholder="e.g. Kathmandu Metropolitan"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Locality</label>
                        <input 
                          name="locality" 
                          defaultValue={editingOffice?.locality || ''} 
                          placeholder="e.g. New Baneshwor"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ward No.</label>
                        <input 
                          name="ward" 
                          type="number"
                          defaultValue={editingOffice?.ward ?? ''} 
                          placeholder="e.g. 1"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</label>
                        <textarea 
                          name="description" 
                          defaultValue={editingOffice?.description || ''} 
                          placeholder="Additional details about the office location..."
                          rows={2}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700" 
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 py-2">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="officeIsActive" 
                          name="isActive" 
                          defaultChecked={editingOffice ? editingOffice.isActive : true} 
                          className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 transition-all" 
                        />
                        <label htmlFor="officeIsActive" className="text-sm font-bold text-slate-700">Mark as Active Office</label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                      <button 
                        type="button" 
                        onClick={() => setIsOfficeFormOpen(false)} 
                        className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-2xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 transition-all"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingOffice ? 'Update Office' : 'Register Office')}
                      </button>
                    </div>
                  </form>

                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-bold text-slate-800">Offices List</h4>
                      <button onClick={() => { setEditingOffice(null); setIsOfficeFormOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-sm transition-all">
                        <Plus size={16} /> Add Office
                      </button>
                    </div>

                    {loadingOffices ? (
                      <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                    ) : offices?.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {offices?.map(office => (
                          <div key={office.id} className="border border-slate-200 rounded-2xl p-4 hover:border-blue-200 transition-colors bg-white shadow-sm">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                  <Building2 size={20} />
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-800">{office.name}</h5>
                                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <MapPin size={12} /> {office.address}
                                  </p>
                                  <div className="flex gap-2 mt-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full uppercase tracking-wider">{office.type}</span>
                                    {!office.isActive && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded-full uppercase tracking-wider">Inactive</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => copyToClipboard(office.address)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Copy Address"
                                >
                                  <GitGraph size={16} />
                                </button>
                                {office.latitude && office.longitude && (
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${office.latitude},${office.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="View on Map"
                                  >
                                    <MapPin size={16} />
                                  </a>
                                )}
                                <button onClick={() => { setEditingOffice(office); setIsOfficeFormOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteOffice(office.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete Office"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500">No offices found for this unit.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setIsOfficesModalOpen(false)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors">Close</button>
              </div>
            </motion.div>
          </div>
        )}

        {isUserScopeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Manage Unit Scope</h3>
                  <p className="text-sm text-slate-500">Assign or remove users from {selectedUnitForUserScope?.name}</p>
                </div>
                <button onClick={() => setIsUserScopeModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                {/* Add User Section */}
                <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <UserPlus size={18} />
                    </div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Assign New Administrator</h4>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select 
                      id="userSelect"
                      className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                    >
                      <option value="">Select a user to assign...</option>
                      {allUsers
                        ?.filter(u => u.orgUnitId !== selectedUnitForUserScope?.id)
                        ?.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.displayName} ({u.email}) — {u.orgUnit?.name || 'Global Access'}
                          </option>
                        ))
                      }
                    </select>
                    <button 
                      onClick={() => {
                        const select = document.getElementById('userSelect') as HTMLSelectElement;
                        if (select.value) handleAssignUser(select.value);
                      }}
                      className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                      Assign to Unit
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3 italic">
                    Note: Assigning a user to this unit will scope their administrative visibility to this branch and its descendants.
                  </p>
                </div>

                {/* Current Users Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Scoped Administrators</h4>
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black rounded-full border border-slate-200">
                      {unitUsers?.length || 0} Active
                    </span>
                  </div>
                  
                  {loadingUsers ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="animate-spin text-blue-600" size={32} />
                      <p className="text-sm text-slate-500 font-bold">Refreshing scoped users...</p>
                    </div>
                  ) : unitUsers?.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {unitUsers?.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 transition-all shadow-sm group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-600 font-black text-lg border border-slate-200 shadow-sm">
                              {u.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-base tracking-tight">{u.displayName}</p>
                              <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full uppercase tracking-widest border border-blue-100">
                                {u.role}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleRemoveUser(u.id)}
                              className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              title="Remove from scope"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 space-y-4">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-slate-300 shadow-sm">
                        <Users size={32} />
                      </div>
                      <div>
                        <p className="text-slate-800 font-bold">No Scoped Administrators</p>
                        <p className="text-xs text-slate-500 max-w-[240px] mx-auto mt-1">This unit currently has no administrators assigned to its specific scope.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button onClick={() => setIsUserScopeModalOpen(false)} className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors">Done</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Delete Unit</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Are you sure you want to delete this unit? This action cannot be undone and may affect associated data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-4 px-6 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-4 px-6 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
              >
                Delete Unit
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
