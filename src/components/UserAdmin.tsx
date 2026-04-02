import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UserProfile, OrganizationUnit, UserRole } from '../types';
import { Search, Filter, Plus, Edit2, Shield, Key, CheckCircle2, XCircle, Loader2, AlertCircle, X, Eye, EyeOff, UserCheck, UserX, Users, Building2, UserPlus, Save, ShieldAlert, ShieldCheck, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ROLE_PERMISSIONS } from '../lib/permissions';

const AccessPreviewPanel = ({ role, orgUnitId, units }: { role: UserRole, orgUnitId: string, units: OrganizationUnit[] }) => {
  const unit = units.find(u => u.id === orgUnitId);
  const permissions = ROLE_PERMISSIONS[role] || {};
  const modules = Object.keys(permissions);
  
  const warnings = [];
  if ((role === 'FIELD_COORDINATOR' || role === 'BOOTH_COORDINATOR') && !orgUnitId) {
    warnings.push({ text: 'CRITICAL: This role requires a specific organizational scope. Global assignment is not permitted.', critical: true });
  }
  if (role === 'MEMBER' && !orgUnitId) {
    warnings.push({ text: 'Members should typically be assigned to a specific unit for local representation.', critical: false });
  }
  if (role === 'ADMIN' && orgUnitId) {
    warnings.push({ text: 'Admins inherently have global access. The specific unit assignment will be ignored.', critical: false });
  }
  if (role === 'PUBLIC' && orgUnitId) {
    warnings.push({ text: 'Public users do not typically have an organizational scope until they apply for membership.', critical: false });
  }

  return (
    <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Shield size={14} className="text-indigo-600" />
          Access Preview
        </h4>
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-indigo-100">
          Live Validation
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <span className="text-slate-400 block text-[10px] uppercase tracking-widest font-black">Role Authority</span>
          <span className="font-black text-slate-800 text-sm tracking-tight">{role}</span>
        </div>
        <div className="space-y-1">
          <span className="text-slate-400 block text-[10px] uppercase tracking-widest font-black">Governance Scope</span>
          <span className="font-black text-slate-800 text-sm tracking-tight">{unit ? unit.name : 'Global System'}</span>
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-slate-400 block text-[10px] uppercase tracking-widest font-black">Authorized Modules</span>
        <div className="flex flex-wrap gap-1.5">
          {role === 'ADMIN' ? (
            <span className="px-3 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Full System Authority</span>
          ) : modules.length > 0 ? (
            modules?.map(m => (
              <span key={m} className="px-3 py-1 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">{m}</span>
            ))
          ) : (
            <span className="text-slate-400 text-[10px] font-bold italic">No specific modules assigned</span>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-2 pt-2">
          {warnings?.map((w, i) => (
            <div key={i} className={`flex items-start gap-3 p-3.5 rounded-2xl text-[11px] font-bold border ${w.critical ? 'text-red-700 bg-red-50 border-red-100' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">{w.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const UserAdmin: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterUnit, setFilterUnit] = useState<string>('ALL');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isTempPasswordModalOpen, setIsTempPasswordModalOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');
  const [activeTab, setActiveTab] = useState<'SYSTEM' | 'PUBLIC'>('SYSTEM');
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState<string>('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  
  const [previewRole, setPreviewRole] = useState<UserRole>('STAFF');
  const [previewOrgUnitId, setPreviewOrgUnitId] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const roles: UserRole[] = ['ADMIN', 'STAFF', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER', 'MEMBER', 'APPLICANT_MEMBER', 'PUBLIC'];
  const filteredRoles = activeTab === 'PUBLIC' 
    ? roles.filter(r => ['PUBLIC', 'MEMBER', 'APPLICANT_MEMBER'].includes(r))
    : roles.filter(r => !['PUBLIC', 'MEMBER', 'APPLICANT_MEMBER'].includes(r));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, unitsData] = await Promise.all([
        api.get('/users'),
        api.get('/hierarchy')
      ]);
      setUsers(usersData);
      setUnits(unitsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      displayName: formData.get('displayName') as string,
      phoneNumber: formData.get('phoneNumber') as string || undefined,
      role: formData.get('role') as string,
      orgUnitId: formData.get('orgUnitId') as string || undefined,
      isActive: formData.get('isActive') === 'on',
      decisionNote: formData.get('decisionNote') as string
    };

    try {
      const response = await api.post('/users', data);
      setTempPassword(response.tempPassword);
      setIsCreateModalOpen(false);
      setIsTempPasswordModalOpen(true);
      fetchData();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to create user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as string;
    const orgUnitId = formData.get('orgUnitId') as string || null;
    const isActive = formData.get('isActive') === 'on';
    const decisionNote = formData.get('decisionNote') as string;

    try {
      // Update scope
      if (role !== selectedUser.role || orgUnitId !== selectedUser.orgUnitId) {
        await api.patch(`/users/${selectedUser.id}/scope`, { role, orgUnitId, decisionNote });
      }
      
      // Update status
      if (isActive !== selectedUser.isActive) {
        await api.patch(`/users/${selectedUser.id}/status`, { isActive, decisionNote });
      }
      
      setMessage({ type: 'success', text: 'User updated successfully' });
      setIsEditModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    const decisionNote = formData.get('decisionNote') as string;

    try {
      const response = await api.post(`/users/${selectedUser.id}/reset-password`, { decisionNote });
      setTempPassword(response.tempPassword);
      setIsResetModalOpen(false);
      setIsTempPasswordModalOpen(true);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to reset password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const decisionNote = window.prompt(`Please provide a reason for ${user.isActive ? 'deactivating' : 'activating'} this user (Required):`);
    if (!decisionNote) return;
    
    try {
      await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive, decisionNote });
      setMessage({ type: 'success', text: `User ${user.isActive ? 'deactivated' : 'activated'} successfully` });
      fetchData();
    } catch (error: any) {
      console.error('Error toggling status:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update status' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || user.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? user.isActive : !user.isActive);
    const matchesUnit = filterUnit === 'ALL' || user.orgUnitId === filterUnit;
    
    const isPublicUser = ['PUBLIC', 'MEMBER', 'APPLICANT_MEMBER'].includes(user.role);
    const matchesTab = activeTab === 'PUBLIC' ? isPublicUser : !isPublicUser;
    
    return matchesSearch && matchesRole && matchesStatus && matchesUnit && matchesTab;
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admin: users.filter(u => ['ADMIN', 'STAFF', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER'].includes(u.role)).length,
    public: users.filter(u => ['PUBLIC', 'MEMBER', 'APPLICANT_MEMBER'].includes(u.role)).length,
    tabTotal: filteredUsers.length,
    tabActive: filteredUsers.filter(u => u.isActive).length
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase">User Governance</h2>
          <p className="text-slate-500 font-medium flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            Manage system access and public portal participants
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200 shadow-inner">
            <button 
              onClick={() => setActiveTab('SYSTEM')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SYSTEM' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              System Staff
            </button>
            <button 
              onClick={() => setActiveTab('PUBLIC')}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'PUBLIC' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Public Portal
            </button>
          </div>

          <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200 shadow-inner">
            <button 
              onClick={() => setViewMode('TABLE')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Table
            </button>
            <button 
              onClick={() => setViewMode('CARDS')}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Cards
            </button>
          </div>

          <button 
            onClick={() => {
              setPreviewRole(activeTab === 'PUBLIC' ? 'PUBLIC' : 'STAFF');
              setPreviewOrgUnitId('');
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 group"
          >
            <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
            Register {activeTab === 'PUBLIC' ? 'Public' : 'Staff'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: `Total ${activeTab === 'PUBLIC' ? 'Portal' : 'Staff'}`, value: stats.tabTotal, icon: Users, color: 'indigo' },
          { label: 'Active Access', value: stats.tabActive, icon: ShieldCheck, color: 'emerald' },
          { label: 'Global Admins', value: stats.admin, icon: ShieldAlert, color: 'blue' },
          { label: 'Public/Members', value: stats.public, icon: UserPlus, color: 'amber' }
        ]?.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
            <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-3xl flex items-center gap-4 border shadow-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
          }`}
        >
          <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          </div>
          <p className="font-black text-sm tracking-tight flex-1">{message.text}</p>
          <button onClick={() => setMessage(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={18} />
          </button>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-slate-50/50 p-6 rounded-[40px] border border-slate-200 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name or email authority..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 shadow-sm"
          />
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-3">
          <div className="flex-1 lg:w-48">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2 block">Role Authority</label>
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-slate-700 shadow-sm"
            >
              <option value="ALL">All Roles</option>
              {roles?.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex-1 lg:w-40">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2 block">Account Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-slate-700 shadow-sm"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="w-full lg:w-64">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2 block">Organization Scope</label>
            <select 
              value={filterUnit}
              onChange={(e) => setFilterUnit(e.target.value)}
              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-slate-700 shadow-sm"
            >
              <option value="ALL">All Units</option>
              {units?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Users View */}
      {viewMode === 'TABLE' ? (
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <p className="text-sm text-slate-500 font-black uppercase tracking-widest">Synchronizing Directory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-900">
                  <tr>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative User</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Role & Authority Scope</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Status</th>
                    <th className="px-8 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Security State</th>
                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Governance Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {filteredUsers?.map(user => {
                    const isAdministrative = ['ADMIN', 'STAFF', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER'].includes(user.role);
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-5">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl border shadow-sm transition-all ${
                              isAdministrative 
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white' 
                                : 'bg-slate-100 text-slate-400 border-slate-200 group-hover:bg-white group-hover:text-slate-600 group-hover:border-slate-300'
                            }`}>
                              {user.displayName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-base font-black text-slate-800 tracking-tight">{user.displayName}</div>
                              <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                              {user.phoneNumber && <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{user.phoneNumber}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-widest w-fit ${
                              isAdministrative ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {user.role}
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                              <Building2 size={12} className="text-slate-400" />
                              {user.orgUnit?.name || (user.role === 'ADMIN' ? 'Global System Authority' : 'No Assigned Scope')}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-widest ${
                            isAdministrative 
                              ? 'bg-blue-50 text-blue-600 border-blue-100' 
                              : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {isAdministrative ? 'Administrative' : 'Public/Member'}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-widest ${
                          user.isActive 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {user.requirePasswordChange ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-widest w-fit" title="User must change password on next login">
                              <AlertCircle size={14} /> Pending Reset
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest w-fit">
                              <CheckCircle2 size={14} /> Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            className={`p-3 rounded-2xl transition-all border shadow-sm active:scale-95 ${
                              user.isActive 
                                ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100' 
                                : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                            }`}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.isActive ? <UserX size={20} /> : <UserCheck size={20} />}
                          </button>
                          <button 
                            onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); }}
                            className="p-3 text-amber-600 bg-amber-50 border border-amber-100 rounded-2xl hover:bg-amber-100 transition-all shadow-sm active:scale-95"
                            title="Reset Password"
                          >
                            <Key size={20} />
                          </button>
                          <button 
                            onClick={() => { 
                              setSelectedUser(user); 
                              setPreviewRole(user.role);
                              setPreviewOrgUnitId(user.orgUnitId || '');
                              setIsEditModalOpen(true); 
                            }}
                            className="p-3 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm active:scale-95"
                            title="Edit Role/Scope"
                          >
                            <Edit2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-slate-200 border border-dashed border-slate-200">
                            <Users size={48} />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">No Users Found</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2 font-medium">
                              We couldn't find any users matching your current filters.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <p className="text-sm text-slate-500 font-black uppercase tracking-widest">Synchronizing Directory...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers?.map(user => {
              const isAdministrative = ['ADMIN', 'STAFF', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER'].includes(user.role);
              return (
                <motion.div 
                  layout
                  key={user.id}
                  className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center font-black text-2xl border shadow-sm transition-all ${
                        isAdministrative 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white' 
                          : 'bg-slate-100 text-slate-400 border-slate-200 group-hover:bg-white group-hover:text-slate-600 group-hover:border-slate-300'
                      }`}>
                        {user.displayName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">{user.displayName}</h3>
                        <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-widest ${
                      user.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Role Authority</p>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{user.role}</p>
                      </div>
                      <div className="h-8 w-[1px] bg-slate-200" />
                      <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{isAdministrative ? 'Admin' : 'Public'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-2">
                      <Building2 size={16} className="text-slate-400" />
                      <p className="text-xs text-slate-600 font-bold">
                        {user.orgUnit?.name || (user.role === 'ADMIN' ? 'Global System Authority' : 'No Assigned Scope')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleStatus(user)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border shadow-sm ${
                        user.isActive 
                          ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100' 
                          : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                      }`}
                    >
                      {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); }}
                      className="p-3 text-amber-600 bg-amber-50 border border-amber-100 rounded-2xl hover:bg-amber-100 transition-all shadow-sm"
                    >
                      <Key size={18} />
                    </button>
                    <button 
                      onClick={() => { 
                        setSelectedUser(user); 
                        setPreviewRole(user.role);
                        setPreviewOrgUnitId(user.orgUnitId || '');
                        setIsEditModalOpen(true); 
                      }}
                      className="p-3 text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-32 text-center">
              <Users size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-xl font-black text-slate-800 tracking-tight">No Users Found</h3>
            </div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Register {activeTab === 'PUBLIC' ? 'Public User' : 'System Staff'}</h3>
                    <p className="text-sm text-slate-500 font-medium">Create a new {activeTab === 'PUBLIC' ? 'public portal' : 'administrative'} account.</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Full Legal Name</label>
                    <input 
                      name="displayName" 
                      required 
                      placeholder="e.g. John Doe"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 shadow-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Email Authority</label>
                    <input 
                      name="email" 
                      type="email" 
                      required 
                      placeholder="e.g. john@organization.com"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 shadow-sm" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Contact Number (Optional)</label>
                    <input 
                      name="phoneNumber" 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 shadow-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Role Authority</label>
                    <select 
                      name="role" 
                      required 
                      value={previewRole}
                      onChange={(e) => setPreviewRole(e.target.value as UserRole)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-slate-700 shadow-sm"
                    >
                      {filteredRoles?.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Governance Scope</label>
                  <select 
                    name="orgUnitId" 
                    value={previewOrgUnitId}
                    onChange={(e) => setPreviewOrgUnitId(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-slate-700 shadow-sm"
                  >
                    <option value="">Global System Authority (No specific unit)</option>
                    {units?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                
                <AccessPreviewPanel role={previewRole} orgUnitId={previewOrgUnitId} units={units} />

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Governance Decision Note (Required)</label>
                  <textarea 
                    name="decisionNote" 
                    required 
                    maxLength={300} 
                    placeholder="Provide justification for granting administrative access..." 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 shadow-sm resize-none" 
                    rows={3} 
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    name="isActive" 
                    defaultChecked 
                    className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 focus:ring-indigo-500" 
                  />
                  <label htmlFor="isActive" className="text-sm font-black text-slate-700 uppercase tracking-widest">Activate Account Immediately</label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsCreateModalOpen(false)} 
                    className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || ((previewRole === 'FIELD_COORDINATOR' || previewRole === 'BOOTH_COORDINATOR') && !previewOrgUnitId)} 
                    className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50 flex items-center gap-3 active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <UserCheck size={20} /> Register User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shadow-sm">
                    <Edit2 size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Modify User Authority</h3>
                    <p className="text-sm text-slate-500 font-medium">Update profile and governance scope for {selectedUser.displayName}.</p>
                  </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleEditUser} className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                  <div>
                    <p className="font-black text-slate-800 text-lg tracking-tight">{selectedUser.displayName}</p>
                    <p className="text-sm text-slate-500 font-medium">{selectedUser.email}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                      Registered: {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedUser.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {selectedUser.isActive ? 'Active Status' : 'Inactive Status'}
                    </span>
                    {selectedUser.requirePasswordChange ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700" title="User must change password on next login">
                        <AlertCircle size={12} /> Pending Reset
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700">
                        <CheckCircle2 size={12} /> Password Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Role Authority</label>
                    <select 
                      name="role" 
                      required 
                      value={previewRole}
                      onChange={(e) => setPreviewRole(e.target.value as UserRole)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-slate-700 shadow-sm"
                    >
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Governance Scope</label>
                    <select 
                      name="orgUnitId" 
                      value={previewOrgUnitId}
                      onChange={(e) => setPreviewOrgUnitId(e.target.value)}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-black text-xs uppercase tracking-widest text-slate-700 shadow-sm"
                    >
                      <option value="">Global System Authority (No specific unit)</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <AccessPreviewPanel role={previewRole} orgUnitId={previewOrgUnitId} units={units} />

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Governance Decision Note (Required)</label>
                  <textarea 
                    name="decisionNote" 
                    required 
                    maxLength={300} 
                    placeholder="Provide justification for this administrative change..." 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-medium text-slate-800 shadow-sm resize-none" 
                    rows={3} 
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="editIsActive" 
                    name="isActive" 
                    defaultChecked={selectedUser.isActive} 
                    className="w-5 h-5 text-amber-600 rounded-lg border-slate-300 focus:ring-amber-500" 
                  />
                  <label htmlFor="editIsActive" className="text-sm font-black text-slate-700 uppercase tracking-widest">Account Active & Authorized</label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)} 
                    className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || ((previewRole === 'FIELD_COORDINATOR' || previewRole === 'BOOTH_COORDINATOR') && !previewOrgUnitId)} 
                    className="bg-amber-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-700 transition-all shadow-xl shadow-amber-200 disabled:opacity-50 flex items-center gap-3 active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <Save size={20} /> Update Authority
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Reset Password Modal */}
      <AnimatePresence>
        {isResetModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="flex items-center justify-between p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-sm">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Reset Authority Credentials</h3>
                    <p className="text-sm text-slate-500 font-medium">Generate a new temporary access key for {selectedUser.displayName}.</p>
                  </div>
                </div>
                <button onClick={() => setIsResetModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="p-8 space-y-8">
                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex gap-4 shadow-sm">
                  <AlertCircle className="text-rose-600 shrink-0" size={24} />
                  <div className="space-y-1">
                    <p className="text-sm font-black text-rose-900 uppercase tracking-widest">Security Protocol Warning</p>
                    <p className="text-sm text-rose-800 leading-relaxed font-medium">
                      This action will invalidate the current credentials for <strong>{selectedUser.displayName}</strong>. 
                      A temporary key will be generated, and the user will be mandated to update their credentials upon next system entry.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Governance Decision Note (Required)</label>
                  <textarea 
                    name="decisionNote" 
                    required 
                    maxLength={300} 
                    placeholder="Provide justification for credential reset..." 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-medium text-slate-800 shadow-sm resize-none" 
                    rows={3} 
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsResetModalOpen(false)} 
                    className="px-8 py-4 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 disabled:opacity-50 flex items-center gap-3 active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        <ShieldCheck size={20} /> Authorize Reset
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Temp Password Reveal Modal */}
      <AnimatePresence>
        {isTempPasswordModalOpen && tempPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-200"
            >
              <div className="p-10 text-center space-y-8">
                <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-[32px] flex items-center justify-center mx-auto mb-2 shadow-inner rotate-3">
                  <Key size={48} className="-rotate-3" />
                </div>
                
                <div>
                  <h3 className="text-3xl font-black text-slate-800 tracking-tight">Temporary Access Key</h3>
                  <p className="text-slate-500 font-medium mt-2">
                    Credentials generated successfully. Share this key securely with the authorized user.
                  </p>
                </div>

                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center justify-center gap-3">
                  <ShieldAlert className="text-rose-600" size={20} />
                  <p className="text-xs font-black text-rose-700 uppercase tracking-widest">Security Warning: Visible Once Only</p>
                </div>
                
                <div className="relative group">
                  <input 
                    type={showTempPassword ? "text" : "password"} 
                    value={tempPassword} 
                    readOnly 
                    className="w-full text-center text-3xl font-mono font-black tracking-[0.2em] px-8 py-8 bg-slate-50 border-2 border-slate-200 rounded-3xl outline-none shadow-inner text-slate-800"
                  />
                  <button 
                    onClick={() => setShowTempPassword(!showTempPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                  >
                    {showTempPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      setMessage({ type: 'success', text: 'Access key copied to clipboard!' });
                    }}
                    className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Copy size={20} /> Copy Access Key
                  </button>
                  
                  <button 
                    onClick={() => {
                      setIsTempPasswordModalOpen(false);
                      setTempPassword('');
                      setShowTempPassword(false);
                    }}
                    className="w-full py-5 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                  >
                    I have secured the key, close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
