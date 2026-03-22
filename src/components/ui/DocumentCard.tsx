import React from 'react';
import { FileText, Download, Trash2, FileType } from 'lucide-react';
import { PartyDocument } from '../../types';
import { format } from 'date-fns';

interface DocumentCardProps {
  document: PartyDocument;
  onDelete: (id: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onDelete }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
          <FileText size={24} />
        </div>
        <div className="flex gap-2">
          <a 
            href={document.fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
          >
            <Download size={18} />
          </a>
          <button 
            onClick={() => onDelete(document.id)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 truncate">{document.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mt-1">{document.description || 'No description'}</p>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
          {document.category}
        </span>
        <span className="text-xs text-slate-400 font-medium">
          {formatSize(document.size)}
        </span>
      </div>
    </div>
  );
};
