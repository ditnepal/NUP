import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const CommunicationAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<any>(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const data = await api.get('/communication/notices');
      setNotices(data);
    } catch (error) {
      console.error('Error fetching notices:', error);
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
      fetchNotices();
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
      fetchNotices();
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
      fetchNotices();
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Failed to update pin status');
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
      fetchNotices();
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
          <h1 className="text-2xl font-bold text-gray-900">Notice & Communication Center</h1>
          <p className="text-gray-500">Manage public announcements and member notices.</p>
        </div>
        <button 
          onClick={handleCreateNotice}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
        >
          <Plus size={20} />
          Create Notice
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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

        {!loading && notices.length === 0 && (
          <div className="py-20 text-center text-gray-500 italic">
            No notices found. Create your first one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
