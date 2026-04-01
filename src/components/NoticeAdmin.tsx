import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { usePermissions } from '../hooks/usePermissions';
import { UserProfile } from '../types';
import { Plus, Bell, ExternalLink, AlertTriangle, X, Loader2, Pin, PinOff, Eye, EyeOff, Calendar, Layout } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  user: UserProfile;
}

export const NoticeAdmin: React.FC<Props> = ({ user }) => {
  const { can } = usePermissions(user);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/communication/notices/${deleteTarget}`);
      toast.success('Notice deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting notice:', error);
      toast.error(error.message || 'Failed to delete item');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleToggle = async (id: string, updates: any) => {
    if (!can('NOTICE_POPUP', 'UPDATE')) return;
    try {
      await api.put(`/communication/notices/${id}`, { ...data.find(n => n.id === id), ...updates });
      fetchData();
    } catch (error) {
      console.error('Error updating notice:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const payload = {
      title: formData.get('title'),
      content: formData.get('content'),
      audience: formData.get('audience'),
      status: formData.get('status'),
      isPinned: formData.get('isPinned') === 'true',
      isPopup: formData.get('isPopup') === 'true',
      displayType: formData.get('displayType'),
      targetPath: formData.get('targetPath'),
      publishAt: formData.get('publishAt') || null,
      expireAt: formData.get('expireAt') || null,
      externalUrl: formData.get('externalUrl'),
    };

    try {
      if (editingItem) {
        await api.put(`/communication/notices/${editingItem.id}`, payload);
        toast.success('Notice updated successfully');
      } else {
        await api.post('/communication/notices', payload);
        toast.success('Notice created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving notice:', error);
      toast.error(error.message || 'Failed to save item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notice & Popup Center</h1>
          <p className="text-slate-500">
            {can('NOTICE_POPUP', 'CREATE') 
              ? 'Manage internal, public, and popup notices.'
              : 'View internal, public, and popup notices.'}
          </p>
        </div>
        {can('NOTICE_POPUP', 'CREATE') && (
          <button 
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors w-full sm:w-auto shadow-sm"
          >
            <Plus size={20} />
            Create Notice
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No notices found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Create your first notice to inform your members or the public.
            </p>
            {can('NOTICE_POPUP', 'CREATE') && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="mt-4 text-emerald-600 font-medium hover:text-emerald-700"
              >
                Create Notice
              </button>
            )}
          </div>
        ) : (
          data?.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      item.audience === 'PUBLIC' ? 'bg-blue-50 text-blue-600' : 
                      item.audience === 'MEMBERS' ? 'bg-purple-50 text-purple-600' : 
                      'bg-slate-50 text-slate-600'
                    }`}>
                      {item.audience}
                    </span>
                    {item.isPopup && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-fuchsia-50 text-fuchsia-600">
                        Popup ({item.displayType})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isPinned && <Pin size={14} className="text-amber-500 fill-amber-500" />}
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-3">{item.content}</p>
                
                <div className="space-y-2 mt-auto">
                  {(item.publishAt || item.expireAt) && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar size={14} className="shrink-0" />
                      <span className="truncate">
                        {item.publishAt ? new Date(item.publishAt).toLocaleDateString() : 'Now'} 
                        {' - '}
                        {item.expireAt ? new Date(item.expireAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  )}
                  {item.targetPath && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Layout size={14} className="shrink-0" />
                      <span className="truncate">{item.targetPath}</span>
                    </div>
                  )}
                  {item.externalUrl && (
                    <div className="flex items-center gap-2 text-xs text-blue-600">
                      <ExternalLink size={14} className="shrink-0" />
                      <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">
                        {item.externalUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              {(can('NOTICE_POPUP', 'UPDATE') || can('NOTICE_POPUP', 'DELETE')) && (
                <div className="flex justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/50">
                  {can('NOTICE_POPUP', 'UPDATE') && (
                    <>
                      <button 
                        onClick={() => handleToggle(item.id, { isPinned: !item.isPinned })} 
                        className={`p-2 rounded-lg transition-colors ${item.isPinned ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        title={item.isPinned ? "Unpin" : "Pin"}
                      >
                        {item.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                      </button>
                      <button 
                        onClick={() => handleToggle(item.id, { status: item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })} 
                        className={`p-2 rounded-lg transition-colors ${item.status === 'PUBLISHED' ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                        title={item.status === 'PUBLISHED' ? "Unpublish" : "Publish"}
                      >
                        {item.status === 'PUBLISHED' ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button 
                        onClick={() => handleEdit(item)} 
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors ml-auto"
                      >
                        Edit
                      </button>
                    </>
                  )}
                  {can('NOTICE_POPUP', 'DELETE') && (
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="px-3 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">
                  {editingItem ? 'Edit' : 'Create'} Notice
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Title</label>
                  <input name="title" required defaultValue={editingItem?.title} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Content</label>
                  <textarea name="content" required rows={4} defaultValue={editingItem?.content} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Audience</label>
                    <select name="audience" required defaultValue={editingItem?.audience || 'PUBLIC'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                      <option value="PUBLIC">Public</option>
                      <option value="MEMBERS">Members Only</option>
                      <option value="STAFF">Staff Only</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select name="status" required defaultValue={editingItem?.status || 'DRAFT'} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="font-semibold text-slate-900">Display Options</h4>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="isPinned" defaultChecked={editingItem?.isPinned} value="true" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                      <span className="text-sm font-medium text-slate-700">Pin to top</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="isPopup" defaultChecked={editingItem?.isPopup} value="true" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                      <span className="text-sm font-medium text-slate-700">Show as Popup</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Popup Type</label>
                      <select name="displayType" defaultValue={editingItem?.displayType || 'BANNER'} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm">
                        <option value="BANNER">Banner</option>
                        <option value="MODAL">Modal</option>
                        <option value="TOAST">Toast</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Path</label>
                      <input name="targetPath" defaultValue={editingItem?.targetPath} placeholder="e.g., /dashboard or *" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Publish At (Optional)</label>
                    <input type="datetime-local" name="publishAt" defaultValue={editingItem?.publishAt?.slice(0, 16)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Expire At (Optional)</label>
                    <input type="datetime-local" name="expireAt" defaultValue={editingItem?.expireAt?.slice(0, 16)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">External Link (Optional)</label>
                  <input name="externalUrl" type="url" defaultValue={editingItem?.externalUrl} placeholder="https://..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
                    {editingItem ? 'Save Changes' : 'Create Notice'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Notice</h3>
                <p className="text-slate-500 mb-6">
                  Are you sure you want to delete this notice? This action cannot be undone.
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
