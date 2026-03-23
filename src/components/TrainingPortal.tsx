import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { BookOpen, ExternalLink, Paperclip, ChevronRight, Clock, Search, Filter, Pin, GraduationCap } from 'lucide-react';
import { TrainingProgram, UserProfile } from '../types';

interface TrainingPortalProps {
  user?: UserProfile | null;
}

export const TrainingPortal: React.FC<TrainingPortalProps> = ({ user }) => {
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    fetchPrograms();
  }, [user]);

  const fetchPrograms = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = user ? '/training/programs/portal' : '/training/programs/public';
      const data = await api.get(endpoint);
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching training data:', error);
      setError('Failed to load training programs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(programs.map(p => p.category))];

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">Training & Resources</h1>
        <p className="text-slate-500 text-lg">Access official party training materials, policy documents, and educational resources.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-12">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search programs or resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                filterCategory === cat 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl text-center">
          <p className="text-rose-600 font-bold mb-4">{error}</p>
          <button onClick={fetchPrograms} className="px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors">
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPrograms.map((program) => (
            <div key={program.id} className={`bg-white rounded-3xl border ${program.isPinned ? 'border-emerald-200 shadow-emerald-50' : 'border-slate-100'} p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col`}>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen size={28} />
                </div>
                {program.isPinned && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Pin size={10} className="fill-emerald-700" /> Pinned
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">{program.name}</h3>
              <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-grow">{program.description}</p>
              
              <div className="space-y-4 pt-6 border-t border-slate-50 mt-auto">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1"><Clock size={14} /> {new Date(program.createdAt).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">{program.category}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {program.externalUrl && (
                    <a 
                      href={program.externalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all group/link"
                    >
                      <span className="text-sm font-bold flex items-center gap-2"><ExternalLink size={16} /> Open Resource</span>
                      <ChevronRight size={16} className="opacity-0 group-hover/link:opacity-100 transition-all" />
                    </a>
                  )}
                  {program.attachmentUrl && (
                    <a 
                      href={program.attachmentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all group/link"
                    >
                      <span className="text-sm font-bold flex items-center gap-2"><Paperclip size={16} /> Download Material</span>
                      <ChevronRight size={16} className="opacity-0 group-hover/link:opacity-100 transition-all" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredPrograms.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No programs found</h3>
              <p className="text-slate-500">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
