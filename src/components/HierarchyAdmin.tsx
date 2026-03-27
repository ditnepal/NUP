import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { OrganizationUnit, OrgCommittee, OrgOfficeBearer, Office, UserProfile } from '../types';
import { Plus, ChevronRight, ChevronDown, MapPin, Building2, Users, Edit2, Trash2, X, Loader2, AlertCircle, CheckCircle2, Shield, UserPlus, Calendar, GitGraph, AlertTriangle, ExternalLink } from 'lucide-react';
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
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      address: formData.get('address') as string,
      contactNumber: formData.get('contactNumber') as string || null,
      email: formData.get('email') as string || null,
      latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
      longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,
      description: formData.get('description') as string || null,
      province: formData.get('province') as string || null,
      district: formData.get('district') as string || null,
      locality: formData.get('locality') as string || null,
      ward: formData.get('ward') ? parseInt(formData.get('ward') as string) : null,
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
                {!unit.isActive && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] bg-red-50 text-red-600 rounded-full font-bold uppercase">
                    Inactive
                  </span>
                )}
                {unit.code && (
                  <span className="ml-2 text-[10px] text-gray-400 font-mono">#{unit.code}</span>
                )}
              </div>
              {unit.description && (
                <p className="text-[10px] text-gray-400 mt-0.5 italic line-clamp-1">{unit.description}</p>
              )}
              <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1"><Building2 size={10} /> Offices: {unit.offices?.length || 0}</span>
                <span className="flex items-center gap-1"><Users size={10} /> Users: {unit.users?.length || 0}</span>
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => openUserScopeModal(unit)}
                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                title="Manage Scoped Users"
              >
                <Users size={16} />
              </button>
              <button 
                onClick={() => openOfficesModal(unit)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                title="Manage Offices"
              >
                <MapPin size={16} />
              </button>
              <button 
                onClick={() => openGovernanceModal(unit)}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                title="Manage Governance"
              >
                <Shield size={16} />
              </button>
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
          )}
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
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('structure')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'structure'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
        >
          <GitGraph size={16} />
          Structure
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('offices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'offices'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin size={16} />
            Offices
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shield size={16} />
            Users & Roles
          </button>
        )}
      </div>

      {activeTab === 'structure' && (
        <>
          <div className="flex justify-end">
            {isAdmin && can('HIERARCHY', 'CREATE') && (
              <button 
                onClick={() => openAddModal(null)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 shadow-sm transition-all"
              >
                <Plus size={20} />
                Add Root Unit
              </button>
            )}
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
        </>
      )}

      {activeTab === 'offices' && isAdmin && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Building2 size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">HQ Coverage</div>
                <div className="text-2xl font-bold text-slate-800">
                  {allOffices.filter(o => o.type === 'HEADQUARTERS').length}
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <MapPin size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Regional Presence</div>
                <div className="text-2xl font-bold text-slate-800">
                  {allOffices.filter(o => o.type === 'REGIONAL').length}
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Users size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Points</div>
                <div className="text-2xl font-bold text-slate-800">
                  {allOffices.filter(o => o.type === 'CONTACT_POINT').length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Global Office Inventory</h3>
                <p className="text-sm text-slate-500">Overview of all organizational locations across the hierarchy.</p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                  Total: {allOffices.length}
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                  Active: {allOffices.filter(o => o.isActive).length}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Office Name</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Unit / Level</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingAllOffices ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="animate-spin text-blue-600 mx-auto" size={24} />
                      </td>
                    </tr>
                  ) : allOffices.length > 0 ? (
                    allOffices.map(office => (
                      <tr key={office.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{office.name}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin size={10} /> {office.address}
                          </div>
                          {office.latitude && office.longitude && (
                            <a 
                              href={`https://www.google.com/maps?q=${office.latitude},${office.longitude}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5"
                            >
                              <ExternalLink size={8} /> View on Map
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-700">{(office as any).orgUnit?.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{(office as any).orgUnit?.level}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full uppercase">
                            {office.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-600">{office.contactNumber || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400">{office.email || ''}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {office.isActive ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100">Active</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full border border-red-100">Inactive</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingOffice(office);
                                setSelectedUnitForOffices((office as any).orgUnit);
                                setIsOfficesModalOpen(true);
                                setIsOfficeFormOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => handleDeleteOffice(office.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                        No offices registered in the system.
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
        <UserAdmin />
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

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingUnit?.description} 
                    placeholder="Brief description of the unit's purpose..."
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Contact Email</label>
                    <input 
                      type="email"
                      name="contactEmail" 
                      defaultValue={editingUnit?.contactEmail} 
                      placeholder="unit@party.org"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Contact Phone</label>
                    <input 
                      type="tel"
                      name="contactPhone" 
                      defaultValue={editingUnit?.contactPhone} 
                      placeholder="+1234567890"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Sort Order</label>
                  <input 
                    type="number"
                    name="sortOrder" 
                    defaultValue={editingUnit?.sortOrder || 0} 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  />
                </div>
                
                <div className="flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    name="isActive" 
                    defaultChecked={editingUnit ? editingUnit.isActive : true}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Active Unit</label>
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

      <AnimatePresence>
        {isGovernanceModalOpen && selectedUnitForGovernance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Unit Governance</h3>
                  <p className="text-sm text-slate-500">{selectedUnitForGovernance.name} ({selectedUnitForGovernance.level})</p>
                </div>
                <button onClick={() => setIsGovernanceModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Committees Section */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Shield className="text-indigo-600" size={20} />
                      Committees
                    </h4>
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
                        className="text-sm flex items-center gap-1 text-indigo-600 font-bold hover:underline"
                      >
                        <Plus size={16} /> Add Committee
                      </button>
                    )}
                  </div>

                  {loadingCommittees ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                  ) : committees.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {committees.map(committee => (
                        <div key={committee.id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-bold text-slate-800">{committee.name}</h5>
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{committee.type}</span>
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
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                title="Add Office Bearer"
                              >
                                <UserPlus size={16} />
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            {committee.bearers && committee.bearers.length > 0 ? (
                              committee.bearers.map(bearer => (
                                <div key={bearer.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                                  <div>
                                    <p className="font-semibold text-slate-700">{bearer.fullName}</p>
                                    <p className="text-xs text-slate-500">{bearer.position}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                      bearer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      {bearer.status}
                                    </span>
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-end gap-1">
                                      <Calendar size={10} /> {new Date(bearer.termStart).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-400 italic text-center py-2">No office bearers assigned</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500">No committees found for this unit.</p>
                    </div>
                  )}
                </section>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setIsGovernanceModalOpen(false)}
                  className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors"
                >
                  Close
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
                  <form onSubmit={handleOfficeSubmit} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-800">{editingOffice ? 'Edit Office' : 'Add New Office'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Office Name</label>
                        <input name="name" defaultValue={editingOffice?.name} required className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                        <select name="type" defaultValue={editingOffice?.type || 'CONTACT_POINT'} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="HEADQUARTERS">Headquarters</option>
                          <option value="REGIONAL">Regional</option>
                          <option value="CONTACT_POINT">Contact Point</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Address</label>
                        <input name="address" defaultValue={editingOffice?.address} required className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Contact Number</label>
                        <input name="contactNumber" defaultValue={editingOffice?.contactNumber || ''} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                        <input name="email" type="email" defaultValue={editingOffice?.email || ''} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Latitude (Optional)</label>
                        <input name="latitude" type="number" step="any" defaultValue={editingOffice?.latitude || ''} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Longitude (Optional)</label>
                        <input name="longitude" type="number" step="any" defaultValue={editingOffice?.longitude || ''} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 py-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="officeIsActive" name="isActive" defaultChecked={editingOffice ? editingOffice.isActive : true} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                        <label htmlFor="officeIsActive" className="text-sm font-semibold text-slate-700">Active</label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setIsOfficeFormOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-all">
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (editingOffice ? 'Update Office' : 'Save Office')}
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
                    ) : offices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {offices.map(office => (
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

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Add User Section */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 uppercase mb-3">Assign New User</h4>
                  <div className="flex gap-2">
                    <select 
                      id="userSelect"
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Select a user to assign...</option>
                      {allUsers
                        .filter(u => u.orgUnitId !== selectedUnitForUserScope?.id)
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.displayName} ({u.email}) - Current: {u.orgUnit?.name || 'Global'}
                          </option>
                        ))
                      }
                    </select>
                    <button 
                      onClick={() => {
                        const select = document.getElementById('userSelect') as HTMLSelectElement;
                        if (select.value) handleAssignUser(select.value);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
                    >
                      <UserPlus size={18} /> Assign
                    </button>
                  </div>
                </div>

                {/* Current Users Section */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 uppercase mb-3">Users Scoped to this Unit</h4>
                  {loadingUsers ? (
                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
                  ) : unitUsers.length > 0 ? (
                    <div className="space-y-2">
                      {unitUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-100 transition-colors shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold">
                              {u.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{u.displayName}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full uppercase">{u.role}</span>
                            <button 
                              onClick={() => handleRemoveUser(u.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove from scope"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500">No users are currently scoped to this unit.</p>
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
