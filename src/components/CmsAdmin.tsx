import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2, Eye, FileText, Globe, CheckCircle, Clock, AlertCircle, X, Save, Filter, User, Calendar, ShieldAlert, Image as ImageIcon, Layout, Type, Link, List, Info, ChevronRight, Check, Zap } from 'lucide-react';
import { safeFormat } from '../lib/date';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

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
    { id: 'navigation', permission: { module: 'CMS', action: 'VIEW' } },
    { id: 'footer-links', permission: { module: 'CMS', action: 'VIEW' } },
    { id: 'social-links', permission: { module: 'CMS', action: 'VIEW' } },
  ].filter(tab => can(tab.permission.module as any, tab.permission.action as any));

  const [pages, setPages] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [navigation, setNavigation] = useState<any[]>([]);
  const [footerLinks, setFooterLinks] = useState<any[]>([]);
  const [socialLinks, setSocialLinks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pages' | 'posts' | 'sections' | 'navigation' | 'footer-links' | 'social-links'>(
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
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [sectionContent, setSectionContent] = useState<any>({});

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
    placement: 'HIDDEN',
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
      } else if (activeTab === 'sections') {
        const sectionsData = await api.get('/cms/sections');
        setSections(sectionsData);
      } else if (activeTab === 'navigation') {
        const navData = await api.get('/cms/navigation');
        setNavigation(navData);
      } else if (activeTab === 'footer-links') {
        const footerData = await api.get('/cms/footer-links');
        setFooterLinks(footerData);
      } else if (activeTab === 'social-links') {
        const socialData = await api.get('/cms/social-links');
        setSocialLinks(socialData);
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
    setViewMode('edit');
    if (item) {
      setEditingItem(item);
      let parsedContent = {};
      if (activeTab === 'sections') {
        try {
          parsedContent = JSON.parse(item.content);
        } catch (e) {
          console.error('Error parsing section content:', e);
        }
      }
      setSectionContent(parsedContent);
      setFormData({
        ...item,
        categoryId: item.categoryId || '',
        featuredImage: item.featuredImage || '',
        excerpt: item.excerpt || '',
        seoTitle: item.seoTitle || '',
        seoDescription: item.seoDescription || '',
        seoKeywords: item.seoKeywords || '',
        publishedAt: item.publishedAt ? new Date(item.publishedAt).toISOString().split('T')[0] : '',
        // Section/Shell specific
        isEnabled: item.isEnabled ?? true,
        order: item.order ?? 0,
        label: item.label || '',
        url: item.url || '',
        platform: item.platform || '',
        decisionNote: '',
        placement: item.placement || 'HIDDEN',
      });
    } else {
      setEditingItem(null);
      const initialSectionContent = { headline: '', subheadline: '', ctaText: '', ctaLink: '', badge: '' };
      setSectionContent(initialSectionContent);
      setFormData({
        title: '',
        slug: '',
        content: activeTab === 'sections' ? JSON.stringify(initialSectionContent, null, 2) : '',
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
        label: '',
        url: '',
        platform: '',
        decisionNote: '',
        placement: 'HIDDEN',
      });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const fetchMedia = async () => {
    try {
      const data = await api.get('/cms/media');
      setMediaList(data);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const handleOpenMediaPicker = (targetField: string) => {
    setMediaPickerTarget(targetField);
    fetchMedia();
    setIsMediaPickerOpen(true);
  };

  const handleSelectMedia = (url: string) => {
    if (mediaPickerTarget === 'featuredImage') {
      setFormData({ ...formData, featuredImage: url });
    } else if (mediaPickerTarget?.startsWith('section.')) {
      const field = mediaPickerTarget.split('.')[1];
      const newSectionContent = { ...sectionContent, [field]: url };
      setSectionContent(newSectionContent);
      setFormData({ ...formData, content: JSON.stringify(newSectionContent, null, 2) });
    }
    setIsMediaPickerOpen(false);
    setMediaPickerTarget(null);
  };

  const handleSectionContentChange = (field: string, value: any) => {
    const newSectionContent = { ...sectionContent, [field]: value };
    setSectionContent(newSectionContent);
    setFormData({ ...formData, content: JSON.stringify(newSectionContent, null, 2) });
  };

  const [deleteNote, setDeleteNote] = useState('');

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/cms/${activeTab}/${id}`, { data: { decisionNote: deleteNote } });
      toast.success(`${activeTab.replace('-', ' ')} deleted successfully`);
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
      const endpoint = `/cms/${activeTab}`;
      
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
      toast.success(`${activeTab.replace('-', ' ')} ${editingItem ? 'updated' : 'created'} successfully`);
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

  const filteredItems = (() => {
    const items = activeTab === 'pages' ? pages : 
                  activeTab === 'posts' ? posts : 
                  activeTab === 'sections' ? sections : 
                  activeTab === 'navigation' ? navigation : 
                  activeTab === 'footer-links' ? footerLinks : socialLinks;
    
    return (items || []).filter(item => {
      const title = item.title || item.label || item.platform || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.slug && item.slug.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = (activeTab === 'sections' || activeTab === 'navigation' || activeTab === 'footer-links' || activeTab === 'social-links') 
                           ? true 
                           : (statusFilter === 'ALL' || item.status === statusFilter);
      return matchesSearch && matchesStatus;
    });
  })();

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
            Create New {activeTab === 'pages' ? 'Page' : activeTab === 'posts' ? 'Post' : activeTab === 'sections' ? 'Section' : activeTab === 'navigation' ? 'Nav Item' : activeTab === 'footer-links' ? 'Footer Link' : 'Social Link'}
          </button>
        )}
      </div>

      {/* Quick Portal Management Card */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Zap size={20} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Quick Portal Management</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => {
              setActiveTab('pages');
              const aboutPage = pages.find(p => p.slug === 'about-us');
              if (aboutPage) {
                handleOpenModal(aboutPage);
              } else {
                handleOpenModal();
                setFormData(prev => ({ 
                  ...prev, 
                  title: 'About Us', 
                  slug: 'about-us', 
                  status: 'PUBLISHED',
                  content: '# Our Mission\n\nTo build a progressive, inclusive, and transparent political platform...\n\n# Our Vision\n\nA nation where governance is truly by the people...'
                }));
              }
            }}
            className="flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 rounded-2xl transition-all group border border-transparent hover:border-blue-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                <Globe size={16} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Manage About Page</span>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto max-w-full">
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.id.charAt(0).toUpperCase() + tab.id.slice(1).replace('-', ' ')}
            </button>
          ))}
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
                        {activeTab === 'social-links' ? <Globe size={20} /> : activeTab === 'navigation' || activeTab === 'footer-links' ? <Link size={20} /> : <FileText size={20} />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 truncate">{item.title || item.label || item.platform}</div>
                        <div className="text-xs text-gray-500 font-mono truncate">
                          {activeTab === 'sections' ? item.type : item.slug ? `/${item.slug}` : item.url}
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
                      {safeFormat(item.updatedAt, 'MMM d, yyyy')}
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
                    {activeTab === 'sections' ? 'Section Configuration' : 
                     activeTab === 'navigation' ? 'Navigation Item' :
                     activeTab === 'footer-links' ? 'Footer Link' :
                     activeTab === 'social-links' ? 'Social Link' : 'General Information'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeTab === 'sections' ? 'Configure the structure and behavior of this homepage section.' : 
                     activeTab === 'navigation' ? 'Manage a main navigation menu item.' :
                     activeTab === 'footer-links' ? 'Manage a link in the site footer.' :
                     activeTab === 'social-links' ? 'Manage a social media profile link.' :
                     `Basic details about your ${activeTab === 'pages' ? 'page' : 'post'}.`}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(activeTab === 'pages' || activeTab === 'posts' || activeTab === 'sections') && (
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
                  )}

                  {(activeTab === 'navigation' || activeTab === 'footer-links') && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Label <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.label}
                          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          placeholder="e.g. About Us"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">URL <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          required
                          value={formData.url}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
                          placeholder="/about or https://..."
                        />
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
                    </>
                  )}

                  {activeTab === 'social-links' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Platform <span className="text-rose-500">*</span></label>
                        <select
                          required
                          value={formData.platform}
                          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        >
                          <option value="">Select Platform</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Twitter">Twitter</option>
                          <option value="Instagram">Instagram</option>
                          <option value="YouTube">YouTube</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="TikTok">TikTok</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">URL <span className="text-rose-500">*</span></label>
                        <input
                          type="url"
                          required
                          value={formData.url}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm"
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                    </>
                  )}

                  {(activeTab === 'pages' || activeTab === 'posts') && (
                    <>
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
                      
                      {activeTab === 'pages' && (
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Menu Placement</label>
                          <select
                            value={formData.placement || 'HIDDEN'}
                            onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          >
                            <option value="HIDDEN">Keep Hidden (No Menu)</option>
                            <option value="MAIN_MENU">Show in Main Menu</option>
                            <option value="FOOTER">Show in Footer</option>
                          </select>
                          <p className="text-[10px] text-slate-400 mt-1">Where this page should appear in the public portal.</p>
                        </div>
                      )}
                    </>
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
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={formData.featuredImage}
                            onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            placeholder="https://example.com/image.jpg"
                          />
                          <button
                            type="button"
                            onClick={() => handleOpenMediaPicker('featuredImage')}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 font-bold text-sm"
                          >
                            <ImageIcon size={18} />
                            Browse
                          </button>
                        </div>
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

                {(activeTab === 'pages' || activeTab === 'posts') && (
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

                {(activeTab === 'pages' || activeTab === 'posts' || activeTab === 'sections') && (
                  <div className="md:col-span-2 border-t border-slate-100 pt-8">
                    <div className="mb-4 flex justify-between items-end">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 font-mono uppercase tracking-tight">
                          {activeTab === 'sections' ? 'Section Builder' : 'Content Body'}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {activeTab === 'sections' 
                            ? 'Configure the content for this section using the visual builder below.' 
                            : `The main content of your ${activeTab === 'pages' ? 'page' : 'post'}. Markdown is supported.`}
                        </p>
                      </div>
                    {activeTab !== 'sections' && (
                      <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setViewMode('edit')}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewMode === 'edit' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('preview')}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${viewMode === 'preview' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                        >
                          Preview
                        </button>
                      </div>
                    )}
                  </div>

                  {activeTab === 'sections' ? (
                    <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      {formData.type === 'HERO' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Headline</label>
                            <input
                              type="text"
                              value={sectionContent.headline || ''}
                              onChange={(e) => handleSectionContentChange('headline', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subheadline</label>
                            <textarea
                              value={sectionContent.subheadline || ''}
                              onChange={(e) => handleSectionContentChange('subheadline', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Badge Text</label>
                            <input
                              type="text"
                              value={sectionContent.badge || ''}
                              onChange={(e) => handleSectionContentChange('badge', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Image URL</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={sectionContent.imageUrl || ''}
                                onChange={(e) => handleSectionContentChange('imageUrl', e.target.value)}
                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleOpenMediaPicker('section.imageUrl')}
                                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                              >
                                <ImageIcon size={18} />
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CTA Text</label>
                            <input
                              type="text"
                              value={sectionContent.ctaText || ''}
                              onChange={(e) => handleSectionContentChange('ctaText', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CTA Link</label>
                            <input
                              type="text"
                              value={sectionContent.ctaLink || ''}
                              onChange={(e) => handleSectionContentChange('ctaLink', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {formData.type === 'CTA' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Headline</label>
                            <input
                              type="text"
                              value={sectionContent.headline || ''}
                              onChange={(e) => handleSectionContentChange('headline', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                            <textarea
                              value={sectionContent.description || ''}
                              onChange={(e) => handleSectionContentChange('description', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-20"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Button Text</label>
                            <input
                              type="text"
                              value={sectionContent.buttonText || ''}
                              onChange={(e) => handleSectionContentChange('buttonText', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Button Link</label>
                            <input
                              type="text"
                              value={sectionContent.buttonLink || ''}
                              onChange={(e) => handleSectionContentChange('buttonLink', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {(formData.type === 'CONTENT_BLOCK' || formData.type === 'NOTICE_BANNER') && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Headline</label>
                            <input
                              type="text"
                              value={sectionContent.headline || ''}
                              onChange={(e) => handleSectionContentChange('headline', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Body Content</label>
                            <textarea
                              value={sectionContent.body || ''}
                              onChange={(e) => handleSectionContentChange('body', e.target.value)}
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-32"
                            />
                          </div>
                        </div>
                      )}

                      {formData.type === 'HIGHLIGHT' && (
                        <div className="space-y-4">
                           <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3">
                            <Info className="text-amber-600 flex-shrink-0" size={20} />
                            <p className="text-sm text-amber-800">
                              Highlight sections currently pull content from dynamic sources like News and Events. 
                              Use the <strong>Title</strong> field above to set the section header.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            const currentContent = JSON.parse(formData.content);
                            setFormData({ ...formData, content: JSON.stringify(currentContent, null, 2) });
                            setViewMode(viewMode === 'preview' ? 'edit' : 'preview');
                          }}
                          className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Layout size={14} />
                          {viewMode === 'preview' ? 'Back to Builder' : 'View Raw JSON (Advanced)'}
                        </button>
                        
                        {viewMode === 'preview' && (
                          <div className="mt-4">
                            <textarea
                              value={formData.content}
                              onChange={(e) => {
                                setFormData({ ...formData, content: e.target.value });
                                try {
                                  setSectionContent(JSON.parse(e.target.value));
                                } catch (err) {}
                              }}
                              className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-48 font-mono text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {viewMode === 'edit' ? (
                        <textarea
                          required
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-96 font-mono text-sm leading-relaxed transition-all"
                          placeholder="Write your content here using Markdown..."
                        />
                      ) : (
                        <div className="w-full px-6 py-6 rounded-xl border border-slate-200 h-96 overflow-y-auto prose prose-slate max-w-none bg-slate-50">
                          <ReactMarkdown>{formData.content || '*No content to preview*'}</ReactMarkdown>
                        </div>
                      )}
                      <div className="mt-2 flex justify-between items-center text-[10px] text-slate-400">
                        <span>
                          {viewMode === 'edit' 
                            ? 'Markdown supported: # H1, **bold**, *italic*, [link](url)' 
                            : 'Previewing rendered Markdown'}
                        </span>
                        <span>Character count: {formData.content.length}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

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

      {/* Media Picker Modal */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="text-emerald-600" size={20} />
                Select Media Asset
              </h3>
              <button onClick={() => setIsMediaPickerOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {mediaList.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500">No media assets found. Upload some in the Media tab first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaList.map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      onClick={() => handleSelectMedia(media.url)}
                      className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all bg-slate-100"
                    >
                      <img 
                        src={media.url} 
                        alt={media.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Check className="text-white" size={32} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-slate-700 truncate">
                        {media.title}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsMediaPickerOpen(false)}
                className="px-6 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-white transition-all"
              >
                Cancel
              </button>
            </div>
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
