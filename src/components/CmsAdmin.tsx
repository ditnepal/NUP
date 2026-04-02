import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2, Eye, FileText, Globe, CheckCircle, Clock, AlertCircle, X, Save, Filter, User, Calendar, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { usePermissions } from '../hooks/usePermissions';
import { UserProfile } from '../types';

interface CmsAdminProps {
  user: UserProfile | null;
}

export const CmsAdmin: React.FC<CmsAdminProps> = ({ user }) => {
  const { can } = usePermissions(user);

  const availableTabs = [
    { id: 'pages', permission: { module: 'CMS', action: 'VIEW' } },
    { id: 'posts', permission: { module: 'CMS', action: 'VIEW' } },
    { id: 'sections', permission: { module: 'CMS', action: 'VIEW' } },
  ].filter(tab => can(tab.permission.module as any, tab.permission.action as any));

  const [pages, setPages] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pages' | 'posts' | 'sections'>(
    (availableTabs[0]?.id as any) || 'pages'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const [formData, setFormData] = useState<any>({
    title: '',
    slug: '',
    content: '',
    status: 'DRAFT',
    language: 'en',
    isPinned: false,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    publishedAt: '',
    // Post specific
    type: 'NEWS',
    excerpt: '',
    categoryId: '',
    featuredImage: '',
    decisionNote: '',
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
      } else if (activeTab === 'posts') {
        const postsData = await api.get('/cms/posts');
        setPosts(postsData);
      } else {
        const sectionsData = await api.get('/cms/sections');
        setSections(sectionsData);
      }
    } catch (error: any) {
      console.error('Error fetching CMS data:', error);
      const errorMessage = error.response?.data?.error || 'Error fetching CMS data';
      const errorDetails = error.response?.data?.details ? `: ${error.response.data.details}` : '';
      toast.error(`${errorMessage}${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get('/cms/categories');
      setCategories(data);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      const errorMessage = error.response?.data?.error || 'Error fetching categories';
      const errorDetails = error.response?.data?.details ? `: ${error.response.data.details}` : '';
      toast.error(`${errorMessage}${errorDetails}`);
    }
  };

  const handleOpenModal = (item: any = null) => {
    setSlugManuallyEdited(!!item);
    if (item) {
      setEditingItem(item);
      setFormData({
        ...item,
        categoryId: item.categoryId || '',
        featuredImage: item.featuredImage || '',
        excerpt: item.excerpt || '',
        seoTitle: item.seoTitle || '',
        seoDescription: item.seoDescription || '',
        seoKeywords: item.seoKeywords || '',
        publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : '',
        // Section specific
        isEnabled: item.isEnabled ?? true,
        order: item.order ?? 0,
        decisionNote: '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        slug: '',
        content: activeTab === 'sections' ? JSON.stringify({ headline: '', subheadline: '', ctaText: '', ctaLink: '' }, null, 2) : '',
        status: 'DRAFT',
        language: 'en',
        isPinned: false,
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
        publishedAt: '',
        type: activeTab === 'sections' ? 'HERO' : 'NEWS',
        excerpt: '',
        categoryId: '',
        featuredImage: '',
        isEnabled: true,
        order: 0,
        decisionNote: '',
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const [deleteNote, setDeleteNote] = useState('');

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/cms/${activeTab}/${id}`, { data: { decisionNote: deleteNote } });
      toast.success(`${activeTab === 'pages' ? 'Page' : activeTab === 'posts' ? 'Post' : 'Section'} deleted successfully`);
      setDeleteConfirm(null);
      setDeleteNote('');
      fetchCmsData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-');
  };

  const handleTitleChange = (title: string) => {
    const updates: any = { title };
    if (!slugManuallyEdited) {
      updates.slug = generateSlug(title);
    }
    setFormData({ ...formData, ...updates });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const endpoint = activeTab === 'pages' ? '/cms/pages' : 
                       activeTab === 'posts' ? '/cms/posts' : '/cms/sections';
      
      // Validate JSON for sections
      if (activeTab === 'sections') {
        try {
          JSON.parse(formData.content);
        } catch (e) {
          setError('Invalid JSON format in Section Content. Please check your syntax.');
          setIsSaving(false);
          return;
        }
      }

      const payload = { ...formData };
      if (editingItem) payload.id = editingItem.id;

      await api.post(endpoint, payload);
      toast.success(`${activeTab === 'pages' ? 'Page' : activeTab === 'posts' ? 'Post' : 'Section'} ${editingItem ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      fetchCmsData();
    } catch (err: any) {
      console.error('Error saving CMS item:', err);
      setError(err.message || 'Failed to save item. Please check your inputs.');
      toast.error('Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = (activeTab === 'pages' ? pages : activeTab === 'posts' ? posts : sections).filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.slug && item.slug.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = activeTab === 'sections' ? true : (statusFilter === 'ALL' || item.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management System</h1>
          <p className="text-gray-500">Manage your website pages, news, and statements.</p>
        </div>
        {can('CMS', 'CREATE') && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 font-bold"
          >
            <Plus size={20} />
            Create New {activeTab === 'pages' ? 'Page' : activeTab === 'posts' ? 'Post' : 'Section'}
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'pages' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pages
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'posts' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'sections' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Homepage Sections
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            />
          </div>

          <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none bg-white font-medium text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {activeTab === 'sections' ? 'Title & Type' : 'Title & Slug'}
                </th>
                {activeTab === 'posts' && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>}
                {activeTab === 'sections' && <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>}
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'posts' ? 6 : 5} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredItems?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">{item.title}</div>
                        <div className="text-xs text-gray-500 font-mono truncate">
                          {activeTab === 'sections' ? item.type : `/${item.slug}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  {activeTab === 'posts' && (
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-[10px] font-bold bg-blue-50 text-blue-600 rounded uppercase tracking-wider">
                        {item.type.replace('_', ' ')}
                      </span>
                    </td>
                  )}
                  {activeTab === 'sections' && (
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-600">
                        {item.order}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                      (activeTab === 'sections' ? item.isEnabled : item.status === 'PUBLISHED') ? 'bg-green-100 text-green-700' :
                      (activeTab === 'sections' ? !item.isEnabled : item.status === 'DRAFT') ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {(activeTab === 'sections' ? item.isEnabled : item.status === 'PUBLISHED') ? <CheckCircle size={10} /> : 
                       (activeTab === 'sections' ? !item.isEnabled : item.status === 'DRAFT') ? <Clock size={10} /> : <AlertCircle size={10} />}
                      {activeTab === 'sections' ? (item.isEnabled ? 'ENABLED' : 'DISABLED') : item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold">
                        {item.author?.displayName?.charAt(0) || 'A'}
                      </div>
                      <span className="truncate max-w-[100px]">{item.author?.displayName || 'Admin'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                    {item.status === 'PUBLISHED' && (
                      <a 
                        href={`/?view=public#${activeTab === 'posts' ? 'news' : item.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all inline-block"
                        title="View Public"
                      >
                        <Eye size={18} />
                      </a>
                    )}
                    {can('CMS', 'UPDATE') && (
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                    {can('CMS', 'DELETE') && (
                      <button 
                        onClick={() => setDeleteConfirm({ id: item.id, title: item.title })}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={activeTab === 'posts' ? 6 : 5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Search size={48} className="opacity-20" />
                      <p className="font-medium">No {activeTab} found matching your search.</p>
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="text-emerald-600 font-bold hover:underline text-sm"
                      >
                        Clear Search
                      </button>
                    </div>
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
                {editingItem 
                  ? `Edit ${activeTab === 'pages' ? 'Page' : activeTab === 'posts' ? 'Post' : 'Section'}` 
                  : `Create New ${activeTab === 'pages' ? 'Page' : activeTab === 'posts' ? 'Post' : 'Section'}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              {error && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold border border-rose-100 flex items-center gap-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800 font-mono uppercase tracking-tight">
                    {activeTab === 'sections' ? 'Section Configuration' : 'General Information'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeTab === 'sections' ? 'Configure the structure and behavior of this homepage section.' : `Basic details about your ${activeTab === 'pages' ? 'page' : 'post'}.`}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Title <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => activeTab === 'sections' ? setFormData({ ...formData, title: e.target.value }) : handleTitleChange(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder={activeTab === 'sections' ? "e.g. Featured News" : "e.g. About Our Party"}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">The main headline for this content.</p>
                  </div>

                  {activeTab !== 'sections' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Slug <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/</span>
                        <input
                          type="text"
                          required
                          value={formData.slug}
                          onChange={(e) => {
                            setFormData({ ...formData, slug: e.target.value });
                            setSlugManuallyEdited(true);
                          }}
                          className="w-full pl-6 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
                          placeholder="about-us"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">The URL-friendly name. Auto-generated from title if left empty.</p>
                    </div>
                  )}

                  {activeTab === 'sections' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Section Type</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                          <option value="HERO">Hero Banner</option>
                          <option value="HIGHLIGHT">Highlight Section</option>
                          <option value="CTA">Call to Action</option>
                          <option value="CONTENT_BLOCK">Content Block</option>
                          <option value="NOTICE_BANNER">Notice Banner</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Display Order</label>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-8">
                        <input
                          type="checkbox"
                          id="isEnabled"
                          checked={formData.isEnabled}
                          onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="isEnabled" className="text-sm font-bold text-slate-700 cursor-pointer">Section Enabled</label>
                      </div>
                    </>
                  )}

                  {activeTab !== 'sections' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Language</label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      >
                        <option value="en">English</option>
                        <option value="ne">Nepali</option>
                      </select>
                    </div>
                  )}

                  {activeTab === 'posts' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Type</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                          <option value="">No Category</option>
                          {categories?.filter(c => c.type === 'POST')?.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Excerpt (Brief Summary)</label>
                        <textarea
                          value={formData.excerpt}
                          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-20 transition-all"
                          placeholder="Brief summary for lists and search results..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Featured Image URL</label>
                        <input
                          type="url"
                          value={formData.featuredImage}
                          onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </>
                  )}

                  {activeTab !== 'sections' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className={`w-full px-4 py-2 rounded-xl border focus:ring-2 outline-none transition-all font-bold ${
                            formData.status === 'PUBLISHED' ? 'border-green-200 bg-green-50 text-green-700 focus:ring-green-500' :
                            formData.status === 'DRAFT' ? 'border-amber-200 bg-amber-50 text-amber-700 focus:ring-amber-500' :
                            'border-slate-200 bg-white text-slate-700 focus:ring-emerald-500'
                          }`}
                        >
                          <option value="DRAFT">Draft (Internal Only)</option>
                          <option value="PUBLISHED">Published (Publicly Visible)</option>
                          <option value="ARCHIVED">Archived (Hidden)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-8">
                        <input
                          type="checkbox"
                          id="isPinned"
                          checked={formData.isPinned}
                          onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                          className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="isPinned" className="text-sm font-bold text-slate-700 cursor-pointer">Pin to Top of List</label>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Publish Date</label>
                        <input
                          type="date"
                          value={formData.publishedAt}
                          onChange={(e) => setFormData({ ...formData, publishedAt: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">When this content was or will be officially published.</p>
                      </div>
                    </>
                  )}
                </div>

                {activeTab !== 'sections' && (
                  <div className="md:col-span-2 border-t border-slate-100 pt-8">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-slate-800 font-mono uppercase tracking-tight">SEO Settings</h3>
                      <p className="text-xs text-slate-500">Optimize how this content appears in search engines like Google.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">SEO Title</label>
                        <input
                          type="text"
                          value={formData.seoTitle}
                          onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          placeholder="Optimized title for search engines"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">SEO Description</label>
                        <textarea
                          value={formData.seoDescription}
                          onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-20 transition-all"
                          placeholder="Brief description for search results..."
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">SEO Keywords</label>
                        <input
                          type="text"
                          value={formData.seoKeywords}
                          onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 border-t border-slate-100 pt-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-800 font-mono uppercase tracking-tight">
                      {activeTab === 'sections' ? 'Section Content (JSON)' : 'Content Body'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeTab === 'sections' 
                        ? 'Define the structured content for this block using JSON format.' 
                        : `The main content of your ${activeTab === 'pages' ? 'page' : 'post'}. Markdown is supported.`}
                    </p>
                  </div>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-96 font-mono text-sm leading-relaxed transition-all"
                    placeholder={activeTab === 'sections' ? '{\n  "headline": "...",\n  "subheadline": "..."\n}' : "Write your content here using Markdown..."}
                  />
                  <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400">
                    <span>
                      {activeTab === 'sections' 
                        ? 'Ensure valid JSON format. Fields depend on section type.' 
                        : 'Markdown supported: # H1, **bold**, *italic*, [link](url)'}
                    </span>
                    <span>Character count: {formData.content.length}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-emerald-600" />
                    Audit Trail
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Decision Note (Required for Audit)</label>
                    <textarea
                      required
                      value={formData.decisionNote}
                      onChange={(e) => setFormData({ ...formData, decisionNote: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-20 transition-all text-sm"
                      placeholder="Explain why this content is being created or updated..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 px-6 py-4 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg ${
                    formData.status === 'PUBLISHED' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-100'
                  }`}
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={20} /> 
                      {editingItem 
                        ? (formData.status === 'PUBLISHED' ? 'Update & Publish' : 'Update Draft') 
                        : (formData.status === 'PUBLISHED' ? 'Create & Publish' : 'Save as Draft')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Delete</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-700">"{deleteConfirm.title}"</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  className="flex-1 px-4 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
                >
                  Delete Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
