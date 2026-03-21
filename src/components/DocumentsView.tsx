import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Search, FileText, Download, Trash2, Loader2, X, Upload } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'POLICY',
    fileName: '',
    fileType: 'application/pdf',
    size: 0,
    fileUrl: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const data = await api.get('/documents');
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      // The user wants to specify all details manually as per the request
      await api.post('/documents', formData);
      setIsModalOpen(false);
      setFormData({
        title: '',
        description: '',
        category: 'POLICY',
        fileName: '',
        fileType: 'application/pdf',
        size: 0,
        fileUrl: '',
      });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documents & Resources</h1>
          <p className="text-slate-500">Manage and access official party documents.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-200"
        >
          <Plus size={18} />
          Upload Document
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            {['ALL', 'POLICY', 'MANIFESTO', 'FORMS', 'REPORTS'].map(cat => (
              <button 
                key={cat}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-all"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
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
                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Upload size={20} className="text-emerald-600" />
                Upload New Document
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <DocumentUploadForm 
                onSuccess={() => {
                  setIsModalOpen(false);
                  fetchDocuments();
                }}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentUploadForm: React.FC<{ onSuccess: () => void, onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'POLICY',
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    // Auto-fill title from filename (remove extension)
    const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, "");
    setFormData(prev => ({ ...prev, title: nameWithoutExt }));
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress for UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', formData.title);
      uploadData.append('category', formData.category);
      if (formData.description) {
        uploadData.append('description', formData.description);
      }

      await api.postFormData('/documents/upload', uploadData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error) {
      console.error('Error uploading document:', error);
      clearInterval(progressInterval);
      setUploadProgress(0);
      alert('Failed to upload document. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-6">
      {/* Drag & Drop Zone */}
      {!file ? (
        <div 
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
            ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden" 
          />
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Click or drag file to this area to upload</h3>
          <p className="text-sm text-slate-500">Support for a single or bulk upload. Strictly prohibit from uploading company data or other band files.</p>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <FileText size={24} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 truncate">{file.name}</p>
              <p className="text-xs text-slate-500 uppercase">{file.type.split('/')[1] || 'FILE'} • {formatSize(file.size)}</p>
            </div>
          </div>
          {!isUploading && (
            <button 
              type="button" 
              onClick={() => setFile(null)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all shrink-0"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )}

      {/* Form Fields */}
      <div className={`space-y-4 transition-all duration-300 ${!file ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Document Title</label>
          <input 
            type="text" 
            required
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            placeholder="e.g. Party Manifesto 2026"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</label>
          <select 
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium appearance-none"
          >
            <option value="POLICY">Policy</option>
            <option value="MANIFESTO">Manifesto</option>
            <option value="FORMS">Forms</option>
            <option value="REPORTS">Reports</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description (Optional)</label>
          <textarea 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24 resize-none"
            placeholder="Brief description of the document..."
          />
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 flex gap-3 border-t border-slate-100">
        <button 
          type="button"
          onClick={onCancel}
          disabled={isUploading}
          className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          type="submit"
          disabled={!file || !formData.title || isUploading}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
        >
          {isUploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            'Upload Document'
          )}
        </button>
      </div>
    </form>
  );
};
