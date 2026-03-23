import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2, Eye, FileText, Globe, CheckCircle, Clock, AlertCircle, X, Save } from 'lucide-react';

export const CmsAdmin: React.FC = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pages' | 'posts'>('pages');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    title: '',
    slug: '',
    content: '',
    status: 'DRAFT',
    language: 'en',
    isPinned: false,
    // Post specific
    type: 'NEWS',
    excerpt: '',
    categoryId: '',
    featuredImage: '',
  });

  useEffect(() => {
    fetchCmsData();
    fetchCategories();
  }, [activeTab]);

  const fetchCmsData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pages') {
        const pagesData = await api.get('/cms/pages');
        setPages(pagesData);
      } else {
        const postsData = await api.get('/cms/posts');
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error fetching CMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/cms/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpenModal = (item: any = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        categoryId: item.categoryId || '',
        featuredImage: item.featuredImage || '',
        excerpt: item.excerpt || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        status: 'DRAFT',
        language: 'en',
        isPinned: false,
        type: 'NEWS',
        excerpt: '',
        categoryId: '',
        featuredImage: '',
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab === 'pages' ? 'page' : 'post'}?`)) return;
    
    try {
      await api.delete(`/cms/${activeTab}/${id}`);
      fetchCmsData();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const endpoint = activeTab === 'pages' ? '/cms/pages' : '/cms/posts';
      const payload = { ...formData };
      if (editingItem) payload.id = editingItem.id;

      await api.post(endpoint, payload);
      setIsModalOpen(false);
      fetchCmsData();
    } catch (err: any) {
      console.error('Error saving CMS item:', err);
      setError(err.message || 'Failed to save item. Please check your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management System</h1>
          <p className="text-gray-500">Manage your website pages, news, and statements.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus size={20} />
          Create New {activeTab === 'pages' ? 'Page' : 'Post'}
        </button>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-lg mb-8 w-fit">
        <button
          onClick={() => setActiveTab('pages')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'pages' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pages
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'posts' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Posts
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                {activeTab === 'posts' && <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>}
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Language</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pinned</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'posts' ? 7 : 6} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  </td>
                </tr>
              ) : (activeTab === 'pages' ? pages : posts).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center mr-3">
                        <FileText size={16} />
                      </div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">/{item.slug}</td>
                  {activeTab === 'posts' && (
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 rounded uppercase tracking-wider">
                        {item.type}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {item.status === 'PUBLISHED' ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : item.status === 'DRAFT' ? (
                        <Clock size={14} className="text-amber-500" />
                      ) : (
                        <AlertCircle size={14} className="text-gray-400" />
                      )}
                      <span className={`text-xs font-semibold ${
                        item.status === 'PUBLISHED' ? 'text-green-600' :
                        item.status === 'DRAFT' ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Globe size={12} />
                      {item.language === 'en' ? 'English' : 'Nepali'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.isPinned && (
                      <span className="px-2 py-1 text-[10px] font-bold bg-amber-50 text-amber-600 rounded uppercase tracking-wider">
                        Pinned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {(activeTab === 'pages' ? pages : posts).length === 0 && !loading && (
                <tr>
                  <td colSpan={activeTab === 'posts' ? 7 : 6} className="px-6 py-12 text-center text-gray-500 italic">
                    No {activeTab} found. Create your first one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingItem ? `Edit ${activeTab === 'pages' ? 'Page' : 'Post'}` : `Create New ${activeTab === 'pages' ? 'Page' : 'Post'}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Enter title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Slug</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. about-us"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="en">English</option>
                    <option value="ne">Nepali</option>
                  </select>
                </div>

                {activeTab === 'posts' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="NEWS">News</option>
                        <option value="PRESS_RELEASE">Press Release</option>
                        <option value="STATEMENT">Statement</option>
                        <option value="SPEECH">Speech</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="">No Category</option>
                        {categories.filter(c => c.type === 'POST').map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Excerpt (Brief Summary)</label>
                      <textarea
                        value={formData.excerpt}
                        onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-20"
                        placeholder="Brief summary of the post..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Featured Image URL</label>
                      <input
                        type="url"
                        value={formData.featuredImage}
                        onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isPinned" className="text-sm font-bold text-slate-700">Pin to Top</label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Content (Markdown supported)</label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-64 font-mono text-sm"
                    placeholder="Write your content here..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <><Save size={20} /> {editingItem ? 'Update' : 'Create'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
