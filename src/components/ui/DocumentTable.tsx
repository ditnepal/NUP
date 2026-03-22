import React from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import { PartyDocument } from '../../types';
import { format } from 'date-fns';

interface DocumentTableProps {
  documents: PartyDocument[];
  onDelete: (id: string) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({ documents, onDelete }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Document</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Category</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">File Info</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Uploaded</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{doc.title}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{doc.description || 'No description'}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  {doc.category}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-xs font-bold text-slate-700">{doc.fileName}</p>
                <p className="text-[10px] text-slate-400 uppercase">{doc.fileType.split('/')[1] || doc.fileType} • {formatSize(doc.size)}</p>
              </td>
              <td className="px-6 py-4 text-xs text-slate-500">
                {format(new Date(doc.createdAt), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <a 
                    href={doc.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  >
                    <Download size={18} />
                  </a>
                  <button 
                    onClick={() => onDelete(doc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
