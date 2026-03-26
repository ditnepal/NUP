import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Notice, UserProfile } from '../types';
import { X, Bell, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePermissions } from '../hooks/usePermissions';

interface NoticePopupProps {
  user?: UserProfile | null;
  currentPath?: string;
}

export const NoticePopup: React.FC<NoticePopupProps> = ({ user, currentPath = window.location.pathname }) => {
  const { can } = usePermissions(user || null);
  const [activeNotices, setActiveNotices] = useState<Notice[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchPopups();
  }, [user]);

  const fetchPopups = async () => {
    try {
      const endpoint = user 
        ? (can('NOTICE_POPUP', 'CREATE') || can('NOTICE_POPUP', 'UPDATE') ? '/communication/notices' : '/communication/notices/members')
        : '/communication/notices/public';
      
      const result = await api.get(endpoint);
      const notices = Array.isArray(result) ? result : [];
      
      // Filter for popups that are active and match the current path (if specified)
      const popups = notices.filter((n: Notice) => {
        if (!n.isPopup) return false;
        if (n.status !== 'PUBLISHED') return false;
        
        // Check publish/expire windows
        const now = new Date();
        if (n.publishAt && new Date(n.publishAt) > now) return false;
        if (n.expireAt && new Date(n.expireAt) < now) return false;
        
        // Check target path if specified
        if (n.targetPath && n.targetPath !== '*' && !currentPath.includes(n.targetPath)) return false;
        
        return true;
      });
      
      setActiveNotices(popups);
    } catch (error) {
      console.error('Error fetching popup notices:', error);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const visibleNotices = activeNotices.filter(n => !dismissedIds.includes(n.id));

  if (visibleNotices.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] flex flex-col items-center justify-center p-4">
      <AnimatePresence>
        {visibleNotices.map((notice) => {
          if (notice.displayType === 'MODAL') {
            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-auto fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
              >
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
                    <div className="flex items-center gap-3 text-emerald-700">
                      <Bell size={24} />
                      <h2 className="text-xl font-black uppercase tracking-tight">{notice.title}</h2>
                    </div>
                    <button 
                      onClick={() => handleDismiss(notice.id)}
                      className="p-2 hover:bg-emerald-100 rounded-full transition-colors text-emerald-700"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-8">
                    <div className="prose prose-slate max-w-none mb-8">
                      <p className="text-lg leading-relaxed text-slate-600 font-medium">{notice.content}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {notice.externalUrl && (
                        <a 
                          href={notice.externalUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all text-center flex items-center justify-center gap-2"
                        >
                          Learn More <ExternalLink size={18} />
                        </a>
                      )}
                      <button 
                        onClick={() => handleDismiss(notice.id)}
                        className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }

          if (notice.displayType === 'TOAST') {
            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 50, x: 50 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="pointer-events-auto fixed bottom-8 right-8 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
              >
                <div className="p-5 flex gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Info size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 mb-1 truncate">{notice.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{notice.content}</p>
                    <div className="flex gap-3">
                      {notice.externalUrl && (
                        <a href={notice.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline">
                          View Details
                        </a>
                      )}
                      <button onClick={() => handleDismiss(notice.id)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <button onClick={() => handleDismiss(notice.id)} className="text-slate-300 hover:text-slate-500">
                    <X size={18} />
                  </button>
                </div>
              </motion.div>
            );
          }

          // Default: BANNER (top of screen)
          return (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="pointer-events-auto fixed top-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-amber-50 border border-amber-100 rounded-2xl shadow-xl p-4 flex gap-4 items-start"
            >
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-amber-900 mb-1">{notice.title}</h4>
                <p className="text-sm text-amber-800 mb-3">{notice.content}</p>
                <div className="flex gap-4">
                  {notice.externalUrl && (
                    <a href={notice.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-700 underline">
                      Action Required
                    </a>
                  )}
                  <button onClick={() => handleDismiss(notice.id)} className="text-xs font-bold text-amber-600 hover:text-amber-800">
                    Close
                  </button>
                </div>
              </div>
              <button onClick={() => handleDismiss(notice.id)} className="text-amber-300 hover:text-amber-500">
                <X size={18} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
