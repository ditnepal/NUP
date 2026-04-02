import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, User } from 'lucide-react';
import { AuditLogEntry } from '../../types';

interface AuditTrailProps {
  logs: AuditLogEntry[] | undefined;
  title?: string;
  className?: string;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ logs, title = "Operational Audit Trail", className = "" }) => {
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  if (!logs || logs.length === 0) return null;

  const toggleExpand = (id: string) => {
    setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDetails = (details: any) => {
    if (!details) return 'System recorded action';
    
    if (typeof details === 'string') {
      try {
        const parsed = JSON.parse(details);
        return formatObjectDetails(parsed);
      } catch (e) {
        return details;
      }
    }
    
    if (typeof details === 'object') {
      return formatObjectDetails(details);
    }
    
    return String(details);
  };

  const formatObjectDetails = (obj: any) => {
    if (!obj) return 'No details available';
    return Object.entries(obj)
      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => {
        const key = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const value = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return `${key}: ${value}`;
      })
      .join(', ');
  };

  return (
    <div className={`mt-8 pt-6 border-t border-slate-100 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <History size={16} className="text-slate-400" />
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {logs?.map((log) => {
          const isExpanded = expandedLogs[log.id];
          const detailsStr = formatDetails(log.details);
          const isLong = detailsStr.length > 120;

          return (
            <div key={log.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] transition-all hover:border-slate-200">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-slate-700 uppercase tracking-tight">
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              
              <div className="relative">
                <p className={`text-slate-600 leading-relaxed mb-1 ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                  {detailsStr}
                </p>
                {isLong && (
                  <button 
                    onClick={() => toggleExpand(log.id)}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 mt-0.5"
                  >
                    {isExpanded ? (
                      <>Show Less <ChevronUp size={10} /></>
                    ) : (
                      <>View More <ChevronDown size={10} /></>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 text-slate-400 font-medium mt-1 pt-1 border-t border-slate-200/50">
                <User size={10} />
                <span>Performed by:</span>
                <span className="text-slate-700 font-bold">
                  {log.user?.displayName || log.userDisplayName || log.userId}
                </span>
                {log.user?.email && (
                  <span className="text-[9px] opacity-60">({log.user.email})</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
