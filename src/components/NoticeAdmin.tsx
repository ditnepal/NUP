import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { usePermissions } from '../hooks/usePermissions';
import { UserProfile } from '../types';
import { Plus, Bell, ExternalLink } from 'lucide-react';

interface Props {
  user: UserProfile;
}

export const NoticeAdmin: React.FC<Props> = ({ user }) => {
  const { can } = usePermissions(user);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get('/communication/notices');
      setData(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching notices:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await api.delete(`/communication/notices/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting notice:', error);
      alert('Failed to delete item');
    }
  };

  const handleSave = async (formData: any) => {
    try {
      if (editingItem) {
        await api.put(`/communication/notices/${editingItem.id}`, formData);
      } else {
        await api.post('/communication/notices', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving notice:', error);
      alert('Failed to save item');
    }
  };

  const renderNoticeForm = () => (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSave({
        title: formData.get('title'),
        content: formData.get('content'),
        audience: formData.get('audience'),
        status: formData.get('status'),
        isPinned: formData.get('isPinned') === 'true',
        isPopup: formData.get('isPopup') === 'true',
        displayType: formData.get('displayType'),
        targetPath: formData.get('targetPath'),
        publishAt: formData.get('publishAt'),
        expireAt: formData.get('expireAt'),
        externalUrl: formData.get('externalUrl'),
      });
    }}>
      <input name="title" defaultValue={editingItem?.title} placeholder="Title" className="w-full p-2 border rounded mb-2" required />
      <textarea name="content" defaultValue={editingItem?.content} placeholder="Content" className="w-full p-2 border rounded mb-2" rows={4} required />
      <div className="grid grid-cols-2 gap-2 mb-2">
        <select name="audience" defaultValue={editingItem?.audience || 'PUBLIC'} className="p-2 border rounded">
          <option value="PUBLIC">PUBLIC</option>
          <option value="MEMBERS">MEMBERS</option>
          <option value="STAFF">STAFF</option>
        </select>
        <select name="status" defaultValue={editingItem?.status || 'DRAFT'} className="p-2 border rounded">
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPinned" defaultChecked={editingItem?.isPinned} value="true" /> Pinned
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="isPopup" defaultChecked={editingItem?.isPopup} value="true" /> Is Popup
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-xs text-gray-500">Display Type</label>
          <select name="displayType" defaultValue={editingItem?.displayType || 'BANNER'} className="w-full p-2 border rounded">
            <option value="BANNER">BANNER</option>
            <option value="MODAL">MODAL</option>
            <option value="TOAST">TOAST</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Target Path (Optional)</label>
          <input name="targetPath" defaultValue={editingItem?.targetPath} placeholder="/dashboard" className="w-full p-2 border rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-xs text-gray-500">Publish At</label>
          <input type="datetime-local" name="publishAt" defaultValue={editingItem?.publishAt?.slice(0, 16)} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Expire At</label>
          <input type="datetime-local" name="expireAt" defaultValue={editingItem?.expireAt?.slice(0, 16)} className="w-full p-2 border rounded" />
        </div>
      </div>
      <input name="externalUrl" defaultValue={editingItem?.externalUrl} placeholder="External URL" className="w-full p-2 border rounded mb-2" />
      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Save</button>
      </div>
    </form>
  );

  const renderTable = () => {
    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (data.length === 0) return <div className="p-10 text-center text-gray-500 italic">No notices found.</div>;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Audience</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    {item.title}
                    {item.isPinned && <Bell size={14} className="text-emerald-600" />}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.audience}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isPopup ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {item.isPopup ? `Popup (${item.displayType})` : 'Standard'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600 space-x-2">
                  {can('NOTICE_POPUP', 'UPDATE') && (
                    <button onClick={() => handleEdit(item)} className="hover:underline">Edit</button>
                  )}
                  {can('NOTICE_POPUP', 'DELETE') && (
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit' : 'Create'} Notice
            </h2>
            {renderNoticeForm()}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notice & Popup Center</h1>
          <p className="text-gray-500">
            {can('NOTICE_POPUP', 'CREATE') 
              ? 'Manage internal, public, and popup notices.'
              : 'View internal, public, and popup notices.'}
          </p>
        </div>
        {can('NOTICE_POPUP', 'CREATE') && (
          <button 
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors w-full sm:w-auto"
          >
            <Plus size={20} />
            Create Notice
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {renderTable()}
      </div>
    </div>
  );
};
