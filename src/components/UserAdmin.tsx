import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { UserProfile, OrganizationUnit, UserRole } from '../types';
import { Search, Filter, Plus, Edit2, Shield, Key, CheckCircle2, XCircle, Loader2, AlertCircle, X, Eye, EyeOff, UserCheck, UserX, Users } from 'lucide-react';
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
    warnings.push({ text: 'Members should typically be assigned to a specific unit.', critical: false });
  }
  if (role === 'ADMIN' && orgUnitId) {
    warnings.push({ text: 'Admins inherently have global access. The specific unit assignment will be ignored.', critical: false });
  }

  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <Shield size={16} className="text-blue-600" />
        Access Preview
      </h4>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold mb-1">Role</span>
          <span className="font-medium text-slate-800">{role}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold mb-1">Scope</span>
          <span className="font-medium text-slate-800">{unit ? unit.name : 'Global Scope'}</span>
        </div>
      </div>

      <div>
        <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold mb-1">Module Access</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {role === 'ADMIN' ? (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Full System Access</span>
          ) : modules.length > 0 ? (
            modules.map(m => (
              <span key={m} className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-medium">{m}</span>
            ))
          ) : (
            <span className="text-slate-500 text-xs">No specific modules assigned</span>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className={`flex items-start gap-2 p-2 rounded-lg text-xs font-medium border ${w.critical ? 'text-red-700 bg-red-50 border-red-200' : 'text-amber-700 bg-amber-50 border-amber-100'}`}>
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <p>{w.text}</p>
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
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [tempPassword, setTempPassword] = useState<string>('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  
  const [previewRole, setPreviewRole] = useState<UserRole>('STAFF');
  const [previewOrgUnitId, setPreviewOrgUnitId] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const roles: UserRole[] = ['ADMIN', 'STAFF', 'FIELD_COORDINATOR', 'BOOTH_COORDINATOR', 'FINANCE_OFFICER', 'MEMBER'];

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
    
    return matchesSearch && matchesRole && matchesStatus && matchesUnit;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Users & Roles</h2>
          <p className="text-sm text-gray-500">Manage system users, roles, and organizational scope.</p>
        </div>
        <button 
          onClick={() => {
            setPreviewRole('STAFF');
            setPreviewOrgUnitId('');
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-all"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-medium flex-1">{message.text}</p>
          <button onClick={() => setMessage(null)} className="p-1 hover:bg-black/5 rounded-full">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">All Roles</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select 
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none sm:max-w-[200px]"
          >
            <option value="ALL">All Units</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Scope</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Security</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {user.displayName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phoneNumber && <div className="text-xs text-gray-400">{user.phoneNumber}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 w-fit">
                          {user.role}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.orgUnit?.name || 'Global Scope'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {user.requirePasswordChange ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 w-fit" title="User must change password on next login">
                            <AlertCircle size={12} /> Pending Password Change
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 w-fit">
                            <CheckCircle2 size={12} /> Password Set
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                        <button 
                          onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Reset Password"
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
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Role/Scope"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users size={48} className="text-slate-200 mb-4" />
                        <p className="text-lg font-medium text-slate-900">No users found</p>
                        <p className="text-sm text-slate-500 max-w-sm mt-1">
                          No users match your current search criteria. Try adjusting your filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Create New User</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Full Name</label>
                  <input name="displayName" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Email Address</label>
                  <input name="email" type="email" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Phone Number (Optional)</label>
                  <input name="phoneNumber" type="tel" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Role</label>
                  <select 
                    name="role" 
                    required 
                    value={previewRole}
                    onChange={(e) => setPreviewRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Organization Scope (Optional)</label>
                  <select 
                    name="orgUnitId" 
                    value={previewOrgUnitId}
                    onChange={(e) => setPreviewOrgUnitId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Global Scope (No specific unit)</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                
                <AccessPreviewPanel role={previewRole} orgUnitId={previewOrgUnitId} units={units} />
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Decision Note (Required)</label>
                  <textarea name="decisionNote" required maxLength={300} placeholder="Reason for creating this user..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="isActive" name="isActive" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                  <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Active immediately</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || ((previewRole === 'FIELD_COORDINATOR' || previewRole === 'BOOTH_COORDINATOR') && !previewOrgUnitId)} 
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Create User'}
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
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Edit User Scope</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleEditUser} className="p-6 space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl mb-4">
                  <p className="font-semibold text-slate-800">{selectedUser.displayName}</p>
                  <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {selectedUser.requirePasswordChange ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800" title="User must change password on next login">
                        <AlertCircle size={12} /> Pending Password Change
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                        <CheckCircle2 size={12} /> Password Set
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Account created: {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Role</label>
                  <select 
                    name="role" 
                    required 
                    value={previewRole}
                    onChange={(e) => setPreviewRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Organization Scope</label>
                  <select 
                    name="orgUnitId" 
                    value={previewOrgUnitId}
                    onChange={(e) => setPreviewOrgUnitId(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Global Scope (No specific unit)</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                
                <AccessPreviewPanel role={previewRole} orgUnitId={previewOrgUnitId} units={units} />
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Decision Note (Required)</label>
                  <textarea name="decisionNote" required maxLength={300} placeholder="Reason for updating scope..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="editIsActive" name="isActive" defaultChecked={selectedUser.isActive} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                  <label htmlFor="editIsActive" className="text-sm font-semibold text-slate-700">Active Account</label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting || ((previewRole === 'FIELD_COORDINATOR' || previewRole === 'BOOTH_COORDINATOR') && !previewOrgUnitId)} 
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Save Changes'}
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
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Reset Password</h3>
                <button onClick={() => setIsResetModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleResetPassword} className="p-6 space-y-4">
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                  <AlertCircle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-sm text-amber-800">
                    You are about to reset the password for <strong>{selectedUser.displayName}</strong>. 
                    A new temporary password will be generated, and the user will be forced to change it on their next login.
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Decision Note (Required)</label>
                  <textarea name="decisionNote" required maxLength={300} placeholder="Reason for resetting password..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsResetModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="bg-amber-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Reset'}
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
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800">Temporary Password</h3>
                <p className="text-slate-500 text-sm">
                  Please copy this password and share it securely with the user. 
                  <strong className="block text-red-600 mt-1">This will only be shown once!</strong>
                </p>
                
                <div className="relative mt-6">
                  <input 
                    type={showTempPassword ? "text" : "password"} 
                    value={tempPassword} 
                    readOnly 
                    className="w-full text-center text-2xl font-mono tracking-wider px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none"
                  />
                  <button 
                    onClick={() => setShowTempPassword(!showTempPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showTempPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                  </button>
                </div>
                
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    setMessage({ type: 'success', text: 'Password copied to clipboard!' });
                  }}
                  className="w-full py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors mt-4"
                >
                  Copy to Clipboard
                </button>
                
                <button 
                  onClick={() => {
                    setIsTempPasswordModalOpen(false);
                    setTempPassword('');
                    setShowTempPassword(false);
                  }}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors mt-2"
                >
                  I have saved it, close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
