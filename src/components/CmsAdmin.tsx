import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, Edit2, Trash2, Eye, FileText, Globe, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const CmsAdmin: React.FC = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pages' | 'posts'>('pages');

  useEffect(() => {
    fetchCmsData();
  }, [activeTab]);

  const fetchCmsData = async () => {
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Management System</h1>
          <p className="text-gray-500">Manage your website pages, news, and statements.</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
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
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(activeTab === 'pages' ? pages : posts).map((item) => (
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
                  <td className="px-6 py-4 text-xs text-gray-500">
                    {new Date(item.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
    </div>
  );
};
