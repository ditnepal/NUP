import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Mail, MessageSquare, Send, Plus, Search, Filter, CheckCircle, Clock, AlertCircle, Users, Layout } from 'lucide-react';

export const CommunicationAdmin: React.FC = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'segments' | 'notices'>('campaigns');
  const [notices, setNotices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'campaigns') {
        const data = await api.get('/communication/campaigns');
        setCampaigns(data);
      } else if (activeTab === 'templates') {
        const data = await api.get('/communication/templates');
        setTemplates(data);
      } else if (activeTab === 'segments') {
        const data = await api.get('/communication/segments');
        setSegments(data);
      } else {
        const data = await api.get('/communication/notices');
        setNotices(data);
      }
    } catch (error) {
      console.error('Error fetching communication data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = () => {
    setEditingNotice(null);
    setIsModalOpen(true);
  };

  const handleEditNotice = (notice: any) => {
    setEditingNotice(notice);
    setIsModalOpen(true);
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/communication/notices/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Failed to delete notice');
    }
  };

  const handleToggleStatus = async (notice: any) => {
    try {
      await api.put(`/communication/notices/${notice.id}`, {
        ...notice,
        status: notice.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to update status');
    }
  };

  const handleTogglePin = async (notice: any) => {
    try {
      await api.put(`/communication/notices/${notice.id}`, {
        ...notice,
        isPinned: !notice.isPinned
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Failed to update pin status');
    }
  };

  const handleBroadcast = async (id: string) => {
    if (!window.confirm('Are you sure you want to broadcast this campaign now?')) return;
    try {
      await api.post(`/communication/campaigns/${id}/broadcast`, {});
      // In a real app, use a toast notification here
      alert('Broadcast started successfully');
      fetchData();
    } catch (error: any) {
      console.error('Broadcast failed:', error);
      alert(`Broadcast failed: ${error.message}`);
    }
  };

  const handleSaveNotice = async (noticeData: any) => {
    try {
      if (editingNotice) {
        await api.put(`/communication/notices/${editingNotice.id}`, noticeData);
      } else {
        await api.post('/communication/notices', noticeData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving notice:', error);
      alert('Failed to save notice');
    }
  };

  return (
    <div className="p-6">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingNotice ? 'Edit Notice' : 'Create Notice'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSaveNotice({
                title: formData.get('title'),
                summary: formData.get('summary'),
                content: formData.get('content'),
                audience: formData.get('audience'),
                status: formData.get('status'),
                isPinned: formData.get('isPinned') === 'true',
                publishAt: formData.get('publishAt'),
                expireAt: formData.get('expireAt'),
                externalUrl: formData.get('externalUrl'),
              });
            }}>
              <input name="title" defaultValue={editingNotice?.title} placeholder="Title" className="w-full p-2 border rounded mb-2" required />
              <input name="summary" defaultValue={editingNotice?.summary} placeholder="Summary" className="w-full p-2 border rounded mb-2" />
              <textarea name="content" defaultValue={editingNotice?.content} placeholder="Content" className="w-full p-2 border rounded mb-2" required />
              <select name="audience" defaultValue={editingNotice?.audience || 'PUBLIC'} className="w-full p-2 border rounded mb-2">
                <option value="PUBLIC">PUBLIC</option>
                <option value="MEMBERS">MEMBERS</option>
              </select>
              <select name="status" defaultValue={editingNotice?.status || 'DRAFT'} className="w-full p-2 border rounded mb-2">
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" name="isPinned" defaultChecked={editingNotice?.isPinned} value="true" /> Pinned
              </label>
              <input type="datetime-local" name="publishAt" defaultValue={editingNotice?.publishAt?.slice(0, 16)} className="w-full p-2 border rounded mb-2" />
              <input type="datetime-local" name="expireAt" defaultValue={editingNotice?.expireAt?.slice(0, 16)} className="w-full p-2 border rounded mb-2" />
              <input name="externalUrl" defaultValue={editingNotice?.externalUrl} placeholder="External URL" className="w-full p-2 border rounded mb-2" />
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Attachment</label>
                <input type="file" name="attachment" className="w-full p-2 border rounded" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication & Outreach</h1>
          <p className="text-gray-500">Manage broadcast campaigns, templates, and audience segments.</p>
        </div>
        <button 
          onClick={activeTab === 'notices' ? handleCreateNotice : undefined}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
        >
          <Plus size={20} />
          Create {activeTab.slice(0, -1)}
        </button>
      </div>

      <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg mb-8 w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'campaigns' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Campaigns
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'templates' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('segments')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'segments' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Segments
        </button>
        <button
          onClick={() => setActiveTab('notices')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'notices' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Notices
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === 'campaigns' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Segment</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent At</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Layout size={14} className="text-gray-400" />
                        {campaign.template.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-gray-400" />
                        {campaign.segment?.name || 'Manual Selection'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        campaign.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                        campaign.status === 'SENDING' ? 'bg-blue-50 text-blue-600' :
                        campaign.status === 'SCHEDULED' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {campaign.sentAt ? new Date(campaign.sentAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {campaign.status === 'DRAFT' && (
                        <button 
                          onClick={() => handleBroadcast(campaign.id)}
                          className="text-emerald-600 hover:text-emerald-700 font-bold text-sm flex items-center gap-1 ml-auto"
                        >
                          <Send size={14} /> Broadcast
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${
                    template.type === 'EMAIL' ? 'bg-blue-50 text-blue-600' :
                    template.type === 'SMS' ? 'bg-amber-50 text-amber-600' :
                    template.type === 'PUSH' ? 'bg-purple-50 text-purple-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {template.type === 'EMAIL' ? <Mail size={20} /> : <MessageSquare size={20} />}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{template.category}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{template.body}</p>
                <div className="flex gap-2">
                  <button className="text-xs font-bold text-emerald-600 hover:underline">Edit Template</button>
                  <button className="text-xs font-bold text-gray-400 hover:underline">Duplicate</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'segments' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {segments.map((segment) => (
                <div key={segment.id} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">{segment.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users size={14} />
                      Criteria Based
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{segment.description}</p>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-xs text-emerald-600 mb-4">
                    {segment.criteria}
                  </div>
                  <button className="text-xs font-bold text-emerald-600 hover:underline">View Matching Users</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Audience</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pinned</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{notice.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{notice.audience}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{notice.status}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{notice.isPinned ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 space-x-2">
                      <button onClick={() => handleEditNotice(notice)} className="hover:underline">Edit</button>
                      <button onClick={() => handleToggleStatus(notice)} className="hover:underline">{notice.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button>
                      <button onClick={() => handleTogglePin(notice)} className="hover:underline">{notice.isPinned ? 'Unpin' : 'Pin'}</button>
                      <button onClick={() => handleDeleteNotice(notice.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (activeTab === 'campaigns' ? campaigns : activeTab === 'templates' ? templates : activeTab === 'segments' ? segments : notices).length === 0 && (
          <div className="py-20 text-center text-gray-500 italic">
            No {activeTab} found. Create your first one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
