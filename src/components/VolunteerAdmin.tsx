import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Users, Briefcase, ClipboardList, CheckCircle, Clock, Plus, Search, Edit2, Trash2, X, Loader2, AlertTriangle, BarChart, Award, FileText } from 'lucide-react';
import { Volunteer } from '../types';
import { VolunteerProfileView } from './VolunteerProfileView';
import { toast } from 'sonner';

export const VolunteerAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'volunteers' | 'applications' | 'reports'>('volunteers');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [assigningVolunteer, setAssigningVolunteer] = useState<Volunteer | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    skills: '',
    availability: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'PENDING'
  });
  const [assignFormData, setAssignFormData] = useState({
    taskName: '',
    description: '',
    campaignId: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (activeTab === 'volunteers') {
      fetchVolunteers();
    } else if (activeTab === 'applications') {
      fetchApplications();
    } else {
      fetchReports();
    }
  }, [activeTab]);

  const fetchCampaigns = async () => {
    try {
      const data = await api.get('/campaigns');
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.get('/volunteers/reports');
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/volunteers?all=true');
      setVolunteers(data);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await api.get('/volunteers/applications');
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveApplication = async (id: string) => {
    try {
      await api.post(`/volunteers/${id}/approve`, {});
      toast.success('Application approved! Volunteer created.');
      await fetchApplications();
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast.error(error.message || 'Failed to approve application.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/volunteers/${id}`, { status: 'ACTIVE' });
      toast.success('Volunteer approved successfully');
      await fetchVolunteers();
    } catch (error: any) {
      console.error('Error approving volunteer:', error);
      toast.error(error.message || 'Failed to approve volunteer.');
    }
  };

  const handleOpenModal = (volunteer?: Volunteer) => {
    if (volunteer) {
      setEditingVolunteer(volunteer);
      setFormData({
        fullName: volunteer.fullName,
        email: volunteer.email || '',
        phone: volunteer.phone || '',
        skills: volunteer.skills,
        availability: volunteer.availability || '',
        status: volunteer.status
      });
    } else {
      setEditingVolunteer(null);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        skills: '',
        availability: '',
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenAssignModal = (volunteer: Volunteer) => {
    setAssigningVolunteer(volunteer);
    setAssignFormData({
      taskName: '',
      description: '',
      campaignId: ''
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningVolunteer) return;
    setSubmitting(true);
    try {
      await api.post('/volunteers/assign', {
        volunteerId: assigningVolunteer.id,
        ...assignFormData
      });
      toast.success('Task assigned successfully');
      setIsAssignModalOpen(false);
      await fetchVolunteers();
    } catch (error: any) {
      console.error('Error assigning task:', error);
      toast.error(error.message || 'Failed to assign task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingVolunteer) {
        await api.put(`/volunteers/${editingVolunteer.id}`, formData);
      } else {
        await api.post('/volunteers', formData);
      }
      await fetchVolunteers();
      toast.success(editingVolunteer ? 'Volunteer updated successfully' : 'Volunteer added successfully');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving volunteer:', error);
      toast.error('Failed to save volunteer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/volunteers/${deleteTarget}`);
      toast.success('Volunteer deleted successfully');
      await fetchVolunteers();
    } catch (error: any) {
      console.error('Error deleting volunteer:', error);
      toast.error(error.message || 'Failed to delete volunteer.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const metrics = {
    totalVolunteers: volunteers.length,
    pendingApps: applications.length,
    totalHours: volunteers.reduce((acc, v) => acc + (v.totalHours || 0), 0),
    completedProjects: volunteers.reduce((acc, v) => acc + (v.projectsCount || 0), 0)
  };

  const filteredVolunteers = (volunteers || []).filter(v => 
    v.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.skills.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.email && v.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (selectedVolunteerId) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <VolunteerProfileView 
          volunteerId={selectedVolunteerId} 
          onBack={() => setSelectedVolunteerId(null)} 
        />
      </div>
    );
  }

  if (loading && volunteers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Management</h1>
          <p className="text-gray-500">Manage party volunteers, skills, and task assignments.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('volunteers')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'volunteers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Volunteers
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'applications' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Public Apps
              {applications.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px]">
                  {applications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'reports' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Reports
            </button>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search volunteers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            Register
          </button>
        </div>
      </div>
    </div>

    {/* Metrics Overview */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={20} />
          </div>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Volunteers</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{metrics.totalVolunteers}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <ClipboardList size={20} />
          </div>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Apps</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{metrics.pendingApps}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Clock size={20} />
          </div>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Hours</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{metrics.totalHours}</p>
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <CheckCircle size={20} />
          </div>
          <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Completed Projects</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{metrics.completedProjects}</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'volunteers' ? (
          filteredVolunteers?.map((volunteer) => (
            <div key={volunteer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                    {volunteer.fullName.charAt(0)}
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      volunteer.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 
                      volunteer.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {volunteer.status}
                    </span>
                    {volunteer.status === 'PENDING' && (
                      <button 
                        onClick={() => handleApprove(volunteer.id)}
                        className="p-1 text-amber-500 hover:text-amber-600 transition-colors"
                        title="Approve Volunteer"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleOpenModal(volunteer)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(volunteer.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{volunteer.fullName}</h3>
                <p className="text-sm text-gray-500 mt-1">{volunteer.email || volunteer.phone || 'No contact info'}</p>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase size={16} className="text-gray-400" />
                    <span className="font-medium">Skills:</span> {volunteer.skills}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span className="font-medium">Availability:</span> {volunteer.availability || 'Not specified'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ClipboardList size={16} className="text-gray-400" />
                    <span className="font-medium">Active Tasks:</span> {volunteer.assignments?.length || 0}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Hours</p>
                    <p className="text-sm font-bold text-blue-600">{volunteer.totalHours || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Completed</p>
                    <p className="text-sm font-bold text-blue-600">{volunteer.projectsCount || 0}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => setSelectedVolunteerId(volunteer.id)}
                    className="flex-1 bg-gray-50 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    View Profile
                  </button>
                  <button 
                    onClick={() => handleOpenAssignModal(volunteer)}
                    className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Assign Task
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : activeTab === 'applications' ? (
          applications?.map((app) => (
            <div key={app.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 font-bold text-xl">
                    {app.fullName.charAt(0)}
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-widest border ${
                      app.source === 'MEMBER_DASHBOARD' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-700 border-slate-100'
                    }`}>
                      {app.source === 'MEMBER_DASHBOARD' ? 'MEMBER' : 'PUBLIC'}
                    </span>
                    <span className="px-2 py-1 text-[10px] font-black rounded uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                      {app.status}
                    </span>
                    <button 
                      onClick={() => handleApproveApplication(app.id)}
                      className="p-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                      title="Approve Application"
                    >
                      <CheckCircle size={20} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{app.fullName}</h3>
                <p className="text-sm text-gray-500 mt-1">{app.email || app.phone || 'No contact info'}</p>
                
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase size={16} className="text-gray-400" />
                    <span className="font-medium">Skills:</span> {app.skills}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} className="text-gray-400" />
                    <span className="font-medium">Availability:</span> {app.availability || 'Not specified'}
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    onClick={() => handleApproveApplication(app.id)}
                    className="w-full bg-emerald-600 text-white font-semibold py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Approve & Register
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          reports?.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                    <FileText size={20} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{report.assignment?.taskName || 'Unknown Task'}</h3>
                <p className="text-xs text-blue-600 font-semibold mb-3">By: {report.volunteer?.fullName || 'Unknown Volunteer'}</p>
                
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                  <p className="text-xs text-slate-600 line-clamp-3 italic">"{report.content}"</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock size={14} />
                    <span className="text-xs font-bold">{report.hoursSpent || 0} Hours</span>
                  </div>
                  <button 
                    onClick={() => setSelectedVolunteerId(report.volunteerId)}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
                  >
                    View Volunteer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        {activeTab === 'volunteers' && filteredVolunteers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            {searchTerm ? 'No volunteers match your search.' : 'No volunteers found. Start by registering your first volunteer.'}
          </div>
        )}
        {activeTab === 'applications' && applications.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            No pending public applications found.
          </div>
        )}
        {activeTab === 'reports' && reports.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            No activity reports submitted yet.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-bottom border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVolunteer ? 'Edit Volunteer' : 'Register New Volunteer'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Social Media, Event Planning"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.skills}
                  onChange={e => setFormData({ ...formData, skills: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <input
                  type="text"
                  placeholder="e.g. Weekends, Evenings"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.availability}
                  onChange={e => setFormData({ ...formData, availability: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin" size={18} />}
                  {editingVolunteer ? 'Update' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {isAssignModalOpen && assigningVolunteer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Assign Task to {assigningVolunteer.fullName}
              </h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAssignTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign (Optional)</label>
                <select
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={assignFormData.campaignId}
                  onChange={e => setAssignFormData({ ...assignFormData, campaignId: e.target.value })}
                >
                  <option value="">No specific campaign</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title || c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Social Media Management"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={assignFormData.taskName}
                  onChange={e => setAssignFormData({ ...assignFormData, taskName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the responsibilities..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={assignFormData.description}
                  onChange={e => setAssignFormData({ ...assignFormData, description: e.target.value })}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin" size={18} />}
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Volunteer</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete this volunteer? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
