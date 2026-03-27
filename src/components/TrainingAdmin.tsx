import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { usePermissions } from '../hooks/usePermissions';
import { toast } from 'sonner';
import { UserProfile, TrainingProgram, Course, Lesson } from '../types';
import { Plus, Edit2, Trash2, Save, X, BookOpen, ExternalLink, Paperclip, Pin, CheckCircle, Clock, ChevronRight, ArrowLeft, Layers, FileText, AlertTriangle } from 'lucide-react';

interface Props {
  user: UserProfile;
}

export const TrainingAdmin: React.FC<Props> = ({ user }) => {
  const { can } = usePermissions(user);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Drill-down state
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'PROGRAM' | 'COURSE' | 'LESSON'>('PROGRAM');
  
  // Form state
  const [editingProgram, setEditingProgram] = useState<Partial<TrainingProgram> | null>(null);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'PROGRAM' | 'COURSE' | 'LESSON' } | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/training/programs/admin');
      setPrograms(data);
      
      // Update selected program/course if they exist to refresh their data
      if (selectedProgram) {
        const updatedProgram = data.find((p: TrainingProgram) => p.id === selectedProgram.id);
        setSelectedProgram(updatedProgram || null);
        if (selectedCourse && updatedProgram) {
          const updatedCourse = updatedProgram.courses?.find((c: Course) => c.id === selectedCourse.id);
          setSelectedCourse(updatedCourse || null);
        } else {
          setSelectedCourse(null);
        }
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to load training data.');
    } finally {
      setLoading(false);
    }
  };

  // --- Modal Handlers ---

  const handleOpenProgramModal = (program?: TrainingProgram) => {
    setError(null);
    setModalType('PROGRAM');
    setEditingProgram(program || {
      name: '', description: '', category: 'General', status: 'DRAFT', audience: 'PUBLIC', isPinned: false, externalUrl: '', attachmentUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenCourseModal = (course?: Course) => {
    setError(null);
    setModalType('COURSE');
    setEditingCourse(course || {
      programId: selectedProgram!.id, title: '', description: '', level: 'BEGINNER'
    });
    setIsModalOpen(true);
  };

  const handleOpenLessonModal = (lesson?: Lesson) => {
    setError(null);
    setModalType('LESSON');
    setEditingLesson(lesson || {
      courseId: selectedCourse!.id, title: '', content: '', order: (selectedCourse?.lessons?.length || 0) + 1
    });
    setIsModalOpen(true);
  };

  // --- Submit Handlers ---

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProgram?.id) {
        await api.put(`/training/programs/${editingProgram.id}`, editingProgram);
      } else {
        await api.post('/training/programs', editingProgram);
      }
      setIsModalOpen(false);
      fetchPrograms();
    } catch (error: any) {
      setError(error.message || 'Failed to save program');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingCourse?.id) {
        await api.put(`/training/courses/${editingCourse.id}`, editingCourse);
      } else {
        await api.post('/training/courses', editingCourse);
      }
      setIsModalOpen(false);
      fetchPrograms();
    } catch (error: any) {
      setError(error.message || 'Failed to save course');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...editingLesson, order: Number(editingLesson?.order) };
      if (editingLesson?.id) {
        await api.put(`/training/lessons/${editingLesson.id}`, payload);
      } else {
        await api.post('/training/lessons', payload);
      }
      setIsModalOpen(false);
      fetchPrograms();
    } catch (error: any) {
      setError(error.message || 'Failed to save lesson');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Delete Handlers ---

  const handleDeleteProgram = async (id: string) => {
    setDeleteTarget({ id, type: 'PROGRAM' });
  };

  const handleDeleteCourse = async (id: string) => {
    setDeleteTarget({ id, type: 'COURSE' });
  };

  const handleDeleteLesson = async (id: string) => {
    setDeleteTarget({ id, type: 'LESSON' });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'PROGRAM') {
        await api.delete(`/training/programs/${deleteTarget.id}`);
        toast.success('Program deleted successfully');
      } else if (deleteTarget.type === 'COURSE') {
        await api.delete(`/training/courses/${deleteTarget.id}`);
        toast.success('Course deleted successfully');
      } else if (deleteTarget.type === 'LESSON') {
        await api.delete(`/training/lessons/${deleteTarget.id}`);
        toast.success('Lesson deleted successfully');
      }
      fetchPrograms();
    } catch (error: any) {
      toast.error(error.message || `Failed to delete ${deleteTarget.type.toLowerCase()}`);
    } finally {
      setDeleteTarget(null);
    }
  };

  // --- Renderers ---

  const renderProgramList = () => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Program</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Audience</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {programs.map((program) => (
            <tr key={program.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{program.name}</p>
                    <p className="text-xs text-slate-500">{program.category} • {program.courses?.length || 0} Courses</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  program.audience === 'PUBLIC' ? 'bg-blue-50 text-blue-600' : 
                  program.audience === 'STAFF' ? 'bg-amber-50 text-amber-600' :
                  'bg-purple-50 text-purple-600'
                }`}>
                  {program.audience}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  program.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {program.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => setSelectedProgram(program)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Manage Courses">
                    <Layers size={18} />
                  </button>
                  {can('TRAINING', 'UPDATE') && (
                    <button onClick={() => handleOpenProgramModal(program)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                      <Edit2 size={18} />
                    </button>
                  )}
                  {can('TRAINING', 'DELETE') && (
                    <button onClick={() => handleDeleteProgram(program.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {programs.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center justify-center">
                  <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
                  <p className="text-lg font-medium text-slate-900">No training programs found</p>
                  <p className="text-sm text-slate-500 max-w-sm mt-1">
                    Create your first training program to start onboarding and educating members.
                  </p>
                  {can('TRAINING', 'CREATE') && (
                    <button 
                      onClick={() => handleOpenProgramModal()}
                      className="mt-4 text-emerald-600 font-medium hover:text-emerald-700"
                    >
                      Create Program
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCourseList = () => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Level</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {selectedProgram?.courses?.map((course) => (
            <tr key={course.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Layers size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{course.title}</p>
                    <p className="text-xs text-slate-500">{course.lessons?.length || 0} Lessons</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                  {course.level}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => setSelectedCourse(course)} className="p-2 text-slate-400 hover:text-purple-600 transition-colors" title="Manage Lessons">
                    <FileText size={18} />
                  </button>
                  {can('TRAINING', 'UPDATE') && (
                    <button onClick={() => handleOpenCourseModal(course)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                      <Edit2 size={18} />
                    </button>
                  )}
                  {can('TRAINING', 'DELETE') && (
                    <button onClick={() => handleDeleteCourse(course.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {(!selectedProgram?.courses || selectedProgram.courses.length === 0) && (
            <tr>
              <td colSpan={3} className="px-6 py-10 text-center text-slate-500 italic">
                No courses found in this program.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderLessonList = () => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lesson</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {selectedCourse?.lessons?.map((lesson) => (
            <tr key={lesson.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-bold text-slate-400">{lesson.order}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{lesson.title}</p>
                    {lesson.videoUrl && <p className="text-xs text-slate-500">Has Video</p>}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {can('TRAINING', 'UPDATE') && (
                    <button onClick={() => handleOpenLessonModal(lesson)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                      <Edit2 size={18} />
                    </button>
                  )}
                  {can('TRAINING', 'DELETE') && (
                    <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {(!selectedCourse?.lessons || selectedCourse.lessons.length === 0) && (
            <tr>
              <td colSpan={3} className="px-6 py-10 text-center text-slate-500 italic">
                No lessons found in this course.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900">Training Management</h1>
            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
              {can('TRAINING', 'CREATE') ? 'Phase 1B: Course Builder' : 'Read-Only Access'}
            </span>
          </div>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm mt-2">
            <button 
              onClick={() => { setSelectedProgram(null); setSelectedCourse(null); }}
              className={`font-bold ${!selectedProgram ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Programs
            </button>
            {selectedProgram && (
              <>
                <ChevronRight size={16} className="text-slate-400" />
                <button 
                  onClick={() => setSelectedCourse(null)}
                  className={`font-bold ${!selectedCourse ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {selectedProgram.name}
                </button>
              </>
            )}
            {selectedCourse && (
              <>
                <ChevronRight size={16} className="text-slate-400" />
                <span className="font-bold text-emerald-600">{selectedCourse.title}</span>
              </>
            )}
          </div>
        </div>
        
        {!selectedProgram && !selectedCourse && can('TRAINING', 'CREATE') && (
          <button onClick={() => handleOpenProgramModal()} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700">
            <Plus size={20} /> New Program
          </button>
        )}
        {selectedProgram && !selectedCourse && can('TRAINING', 'CREATE') && (
          <button onClick={() => handleOpenCourseModal()} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700">
            <Plus size={20} /> New Course
          </button>
        )}
        {selectedCourse && can('TRAINING', 'CREATE') && (
          <button onClick={() => handleOpenLessonModal()} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700">
            <Plus size={20} /> New Lesson
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <>
          {!selectedProgram && !selectedCourse && renderProgramList()}
          {selectedProgram && !selectedCourse && renderCourseList()}
          {selectedCourse && renderLessonList()}
        </>
      )}

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {modalType === 'PROGRAM' ? (editingProgram?.id ? 'Edit Program' : 'New Program') :
                 modalType === 'COURSE' ? (editingCourse?.id ? 'Edit Course' : 'New Course') :
                 (editingLesson?.id ? 'Edit Lesson' : 'New Lesson')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            {/* PROGRAM FORM */}
            {modalType === 'PROGRAM' && (
              <form onSubmit={handleProgramSubmit} className="p-6 space-y-6">
                {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold">{error}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Program Title</label>
                    <input type="text" required value={editingProgram?.name || ''} onChange={(e) => setEditingProgram({ ...editingProgram, name: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                    <textarea rows={3} value={editingProgram?.description || ''} onChange={(e) => setEditingProgram({ ...editingProgram, description: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <input type="text" value={editingProgram?.category || ''} onChange={(e) => setEditingProgram({ ...editingProgram, category: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Audience</label>
                    <select value={editingProgram?.audience || 'PUBLIC'} onChange={(e) => setEditingProgram({ ...editingProgram, audience: e.target.value as any })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option value="PUBLIC">Public</option>
                      <option value="MEMBERS">Members Only</option>
                      <option value="STAFF">Staff Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                    <select value={editingProgram?.status || 'DRAFT'} onChange={(e) => setEditingProgram({ ...editingProgram, status: e.target.value as any })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none">
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <input type="checkbox" id="isPinned" checked={editingProgram?.isPinned || false} onChange={(e) => setEditingProgram({ ...editingProgram, isPinned: e.target.checked })} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                    <label htmlFor="isPinned" className="text-sm font-bold text-slate-700">Pin to Top</label>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">External URL (Optional)</label>
                    <input type="url" value={editingProgram?.externalUrl || ''} onChange={(e) => setEditingProgram({ ...editingProgram, externalUrl: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Attachment URL (Optional)</label>
                    <input type="url" value={editingProgram?.attachmentUrl || ''} onChange={(e) => setEditingProgram({ ...editingProgram, attachmentUrl: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Program'}
                  </button>
                </div>
              </form>
            )}

            {/* COURSE FORM */}
            {modalType === 'COURSE' && (
              <form onSubmit={handleCourseSubmit} className="p-6 space-y-6">
                {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold">{error}</div>}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Course Title</label>
                    <input type="text" required value={editingCourse?.title || ''} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                    <textarea rows={3} value={editingCourse?.description || ''} onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Level</label>
                    <select value={editingCourse?.level || 'BEGINNER'} onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value as any })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Course'}
                  </button>
                </div>
              </form>
            )}

            {/* LESSON FORM */}
            {modalType === 'LESSON' && (
              <form onSubmit={handleLessonSubmit} className="p-6 space-y-6">
                {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold">{error}</div>}
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Lesson Title</label>
                      <input type="text" required value={editingLesson?.title || ''} onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Order</label>
                      <input type="number" required min="1" value={editingLesson?.order || 1} onChange={(e) => setEditingLesson({ ...editingLesson, order: parseInt(e.target.value) })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Content (Text/Markdown)</label>
                    <textarea required rows={5} value={editingLesson?.content || ''} onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm" placeholder="Lesson content..." />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Video URL (Optional)</label>
                    <input type="url" value={editingLesson?.videoUrl || ''} onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://youtube.com/..." />
                  </div>
                </div>
                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={isSaving} className="flex-1 px-6 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50">
                    {isSaving ? 'Saving...' : 'Save Lesson'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete {deleteTarget.type.toLowerCase()}</h3>
              <p className="text-slate-500 mb-6">
                Are you sure you want to delete this {deleteTarget.type.toLowerCase()}? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
