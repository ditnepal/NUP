import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Search, Loader2, Download, FileText, Calendar, ArrowLeft } from 'lucide-react';
import { safeFormat } from '../lib/date';
import { PartyDocument } from '../types';

interface PublicDocumentsViewProps {
  onBack?: () => void;
}

export const PublicDocumentsView: React.FC<PublicDocumentsViewProps> = ({ onBack }) => {
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
    <div className="space-y-12">
      {/* Header Section */}
      <div className="bg-slate-950 text-white rounded-[3rem] p-12 md:p-20 relative overflow-hidden mx-4 md:mx-0">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,#10b981_0%,transparent_50%)]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
          <div className="space-y-6 max-w-2xl">
            {onBack && (
              <button 
                onClick={onBack}
                className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Return to Portal
              </button>
            )}
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em]">
              <FileText size={14} />
              Public Records Vault
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]">
              Document <br />
              <span className="text-emerald-500">Archive.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium leading-tight tracking-tight">
              Access official party manifestos, policy papers, and public statements. 
              Transparency is the foundation of our democratic process.
            </p>
          </div>
          
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] focus:border-emerald-500 focus:ring-0 transition-all text-sm font-medium text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mt-12 pt-12 border-t border-white/10 relative z-10">
          {['ALL', 'POLICY', 'MANIFESTO', 'FORMS', 'REPORTS', 'OTHER'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-slate-100 rounded-[3rem] animate-pulse" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-slate-200">
          <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Search size={48} className="text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">No Documents Found</h3>
          <p className="text-slate-500 max-w-md mx-auto font-medium">
            We couldn't find any documents matching your current filters. 
            Try adjusting your search or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDocuments?.map((doc) => (
            <div key={doc.id} className="group bg-white border border-slate-100 rounded-[3rem] p-10 hover:shadow-2xl transition-all flex flex-col shadow-sm">
              <div className="flex items-start justify-between mb-10">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors border border-slate-100">
                  <FileText size={32} />
                </div>
                <span className="text-[10px] font-black px-4 py-1.5 bg-slate-100 text-slate-500 rounded-xl uppercase tracking-widest">
                  {doc.category || 'GENERAL'}
                </span>
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors uppercase tracking-tight leading-tight">
                {doc.title}
              </h3>
              
              <p className="text-slate-500 font-medium mb-10 flex-1 line-clamp-3 leading-relaxed">
                {doc.description || 'Official party document for public review and reference.'}
              </p>
              
              <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <Calendar size={16} />
                  {safeFormat(doc.createdAt, 'MMM d, yyyy')}
                </div>
                <a
                  href={doc.fileUrl.startsWith('/') ? doc.fileUrl : `/${doc.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:gap-4 transition-all"
                >
                  Download <Download size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
