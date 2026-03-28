import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { BookOpen, ExternalLink, Paperclip, ChevronRight, Clock, Search, Filter, Pin, GraduationCap, Users, Shield, Layers, FileText, ArrowLeft, PlayCircle } from 'lucide-react';
import { TrainingProgram, Course, Lesson, UserProfile } from '../types';
import { usePermissions } from '../hooks/usePermissions';

interface TrainingPortalProps {
  user?: UserProfile | null;
}

export const TrainingPortal: React.FC<TrainingPortalProps> = ({ user }) => {
  const { can } = usePermissions(user || null);
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Drill-down state
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, [user]);

  const fetchPrograms = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = user 
        ? (can('TRAINING', 'CREATE') || can('TRAINING', 'UPDATE') ? '/training/programs/admin' : '/training/programs/portal')
        : '/training/programs/public';
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

  const renderProgramList = () => (
    <>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPrograms.map((program) => (
          <div key={program.id} className={`bg-white rounded-3xl border ${program.isPinned ? 'border-emerald-200 shadow-emerald-50' : 'border-slate-100'} p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col`}>
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BookOpen size={28} />
              </div>
              <div className="flex flex-col items-end gap-2">
                {program.isPinned && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Pin size={10} className="fill-emerald-700" /> Pinned
                  </span>
                )}
                {program.audience === 'MEMBERS' && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Users size={10} className="text-blue-700" /> Members Only
                  </span>
                )}
                {program.audience === 'STAFF' && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <Shield size={10} className="text-purple-700" /> Staff Only
                  </span>
                )}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">{program.name}</h3>
            <p className="text-slate-500 text-sm mb-6 line-clamp-3 flex-grow">{program.description}</p>
            
            <div className="space-y-4 pt-6 border-t border-slate-50 mt-auto">
              <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Clock size={14} /> {new Date(program.createdAt).toLocaleDateString()}</span>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">{program.category}</span>
              </div>

              <div className="flex flex-col gap-2">
                {program.courses && program.courses.length > 0 && (
                  <button 
                    onClick={() => setSelectedProgram(program)}
                    className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all group/link"
                  >
                    <span className="text-sm font-bold flex items-center gap-2"><Layers size={16} /> View {program.courses.length} Courses</span>
                    <ChevronRight size={16} className="opacity-0 group-hover/link:opacity-100 transition-all" />
                  </button>
                )}
                {program.externalUrl && (
                  <a 
                    href={program.externalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all group/link"
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
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all group/link"
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
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen size={48} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Training Programs Available</h3>
            <p className="text-slate-500 max-w-md mx-auto text-lg">
              We are currently developing new training materials and certification programs. Please check back soon for updates.
            </p>
          </div>
        )}
      </div>
    </>
  );

  const renderCourseList = () => (
    <div className="space-y-6">
      <button 
        onClick={() => setSelectedProgram(null)}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-bold transition-colors mb-4"
      >
        <ArrowLeft size={20} /> Back to Programs
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedProgram?.name}</h2>
        <p className="text-slate-500">{selectedProgram?.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {selectedProgram?.courses?.map((course) => (
          <div key={course.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Layers size={24} />
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {course.level}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{course.title}</h3>
            <p className="text-slate-500 text-sm mb-6 line-clamp-2">{course.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {course.lessons?.length || 0} Lessons
              </span>
              <button 
                onClick={() => setSelectedCourse(course)}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              >
                View Course <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ))}
        {(!selectedProgram?.courses || selectedProgram.courses.length === 0) && (
          <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <Layers size={32} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No courses available</h3>
            <p className="text-slate-500 text-sm">Courses for this program are coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLessonList = () => (
    <div className="space-y-6">
      <button 
        onClick={() => setSelectedCourse(null)}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors mb-4"
      >
        <ArrowLeft size={20} /> Back to Courses
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {selectedCourse?.level}
          </span>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {selectedCourse?.lessons?.length || 0} Lessons
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedCourse?.title}</h2>
        <p className="text-slate-500">{selectedCourse?.description}</p>
      </div>

      <div className="space-y-4">
        {selectedCourse?.lessons?.map((lesson) => (
          <div key={lesson.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-black text-xl">
              {lesson.order}
            </div>
            <div className="flex-grow">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{lesson.title}</h3>
              <div className="prose prose-sm prose-slate max-w-none mb-4">
                {lesson.content}
              </div>
              {lesson.videoUrl && (
                <a 
                  href={lesson.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
                >
                  <PlayCircle size={18} className="text-purple-600" /> Watch Video
                </a>
              )}
            </div>
          </div>
        ))}
        {(!selectedCourse?.lessons || selectedCourse.lessons.length === 0) && (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-100">
            <FileText size={32} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No lessons available</h3>
            <p className="text-slate-500 text-sm">Lessons for this course are coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-2">Training & Resources</h1>
        <p className="text-slate-500 text-lg">Access official party training materials, policy documents, and educational resources.</p>
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
        <>
          {!selectedProgram && !selectedCourse && renderProgramList()}
          {selectedProgram && !selectedCourse && renderCourseList()}
          {selectedCourse && renderLessonList()}
        </>
      )}
    </div>
  );
};
