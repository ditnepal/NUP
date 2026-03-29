import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Bell, Calendar, MapPin, ExternalLink, Loader2, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

interface Props {
  type: 'notices' | 'events';
  onBack: () => void;
}

export const PublicListView: React.FC<Props> = ({ type, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const endpoint = type === 'notices' ? '/communication/notices/members' : '/app-events/public';
        const result = await api.get(endpoint);
        setData(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
          {type === 'notices' ? 'Important Notices' : 'Upcoming Events'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No {type} found at this time.</p>
          </div>
        ) : (
          data.map((item, i) => (
            <motion.div 
              key={item.id || i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              {type === 'notices' ? (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Bell size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">Notice</span>
                    {item.isPinned && <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded">Pinned</span>}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{item.content}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <span className="text-xs text-slate-400 font-bold uppercase">{format(new Date(item.publishAt || item.createdAt), 'MMM d, yyyy')}</span>
                    {item.externalUrl && (
                      <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-bold text-xs flex items-center gap-1 hover:underline">
                        Details <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">Event</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={14} />
                      <span>{format(new Date(item.eventDate || item.startDate), 'MMMM d, yyyy')}</span>
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={14} />
                        <span>{item.location}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{item.summary || item.description}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                    <span className="text-xs text-slate-400 font-bold uppercase">{item.startAt || 'TBA'}</span>
                    <button className="text-blue-600 font-bold text-xs hover:underline">View Details</button>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
