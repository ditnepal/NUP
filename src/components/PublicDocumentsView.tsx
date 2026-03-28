import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Search, Loader2, Download, FileText } from 'lucide-react';
import { PartyDocument } from '../types';

export const PublicDocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<PartyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await api.get('/documents/public');
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    (selectedCategory === 'ALL' || doc.category === selectedCategory) &&
    (doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
     doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Public Documents</h1>
        <p className="text-slate-500 mt-2">Access official party documents and resources.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {['ALL', 'POLICY', 'MANIFESTO', 'FORMS', 'REPORTS', 'OTHER'].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          </div>
        ) : filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <FileText size={24} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{doc.category}</span>
                </div>
                <h3 className="font-bold text-slate-900 truncate">{doc.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1 mb-4">{doc.description || 'No description'}</p>
                <a 
                  href={doc.fileUrl.startsWith('/') ? doc.fileUrl : `/${doc.fileUrl}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-all"
                >
                  <Download size={16} /> Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Documents Available</h3>
            <p className="text-slate-500 max-w-md mx-auto text-lg">
              We are currently organizing our public documents and manifestos. Please check back soon for updates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
