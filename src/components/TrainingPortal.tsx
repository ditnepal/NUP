import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { api } from '../lib/api';
import { BookOpen, ExternalLink, Paperclip, ChevronRight, Clock, Search, Filter, Pin, GraduationCap, Users, Shield, Layers, FileText, ArrowLeft, PlayCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { TrainingProgram, Course, Lesson, UserProfile } from '../types';
import { usePermissions } from '../hooks/usePermissions';

interface TrainingPortalProps {
  user?: UserProfile | null;
  onBack?: () => void;
}

export const TrainingPortal: React.FC<TrainingPortalProps> = ({ user, onBack }) => {
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

  const categories = ['All', ...new Set(programs?.map(p => p.category) || [])];

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const renderProgramList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {filteredPrograms?.map((program) => (
        <div 
          key={program.id}
          onClick={() => setSelectedProgram(program)}
          className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col relative overflow-hidden"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
            <GraduationCap size={40} />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-4 group-hover:text-emerald-600 transition-colors leading-tight">{program.name}</h3>
          <p className="text-slate-500 text-lg leading-relaxed mb-10 line-clamp-3 opacity-80 flex-1">
            {program.description}
          </p>
          <div className="flex items-center justify-between pt-8 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-black text-slate-400 uppercase tracking-widest">
              <Layers size={16} />
              {program.courses?.length || 0} Courses
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <ArrowRight size={24} />
            </div>
          </div>
        </div>
      ))}
      {filteredPrograms.length === 0 && (
        <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border border-slate-200 shadow-sm">
          <div className="w-24 h-24 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-8">
            <BookOpen size={48} />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-4">No Training Programs Available</h3>
          <p className="text-slate-500 max-w-md mx-auto text-xl leading-relaxed opacity-80">
            We are currently developing new training materials and certification programs. Please check back soon for updates.
          </p>
        </div>
      )}
    </div>
  );

  const renderCourseList = () => (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setSelectedProgram(null)}
          className="flex items-center gap-3 text-emerald-600 hover:text-emerald-700 font-bold text-lg group"
        >
          <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
          Back to Programs
        </button>
        <div className="text-sm font-black text-slate-400 uppercase tracking-widest">
          {selectedProgram?.courses?.length || 0} Courses Available
        </div>
      </div>

      <div className="bg-emerald-50 rounded-[3rem] border border-emerald-100 p-12 shadow-sm">
        <h2 className="text-4xl font-black text-emerald-900 mb-4 tracking-tight leading-tight">{selectedProgram?.name}</h2>
        <p className="text-emerald-700 text-xl leading-relaxed opacity-90 max-w-3xl">{selectedProgram?.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {selectedProgram?.courses?.map((course) => (
          <div 
            key={course.id} 
            onClick={() => setSelectedCourse(course)}
            className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm hover:shadow-2xl transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Layers size={32} />
              </div>
              <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                {course.level}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">{course.title}</h3>
            <p className="text-slate-500 text-lg mb-8 line-clamp-2 leading-relaxed opacity-80">{course.description}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {course.lessons?.length || 0} Lessons
              </span>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <ArrowRight size={20} />
              </div>
            </div>
          </div>
        ))}
        {(!selectedProgram?.courses || selectedProgram.courses.length === 0) && (
          <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed">
            <Layers size={48} className="mx-auto text-slate-300 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No courses available</h3>
            <p className="text-slate-500 text-lg">Courses for this program are coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLessonList = () => (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-3 text-blue-600 hover:text-blue-700 font-bold text-lg group"
        >
          <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={24} />
          Back to Courses
        </button>
        <div className="text-sm font-black text-slate-400 uppercase tracking-widest">
          {selectedCourse?.lessons?.length || 0} Lessons
        </div>
      </div>

      <div className="bg-blue-50 rounded-[3rem] border border-blue-100 p-12 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-200">
            {selectedCourse?.level}
          </span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{selectedCourse?.title}</h2>
        <p className="text-slate-600 text-xl leading-relaxed opacity-90 max-w-3xl">{selectedCourse?.description}</p>
      </div>

      <div className="space-y-8">
        {selectedCourse?.lessons?.map((lesson) => (
          <div key={lesson.id} className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row gap-10">
            <div className="flex-shrink-0 w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center font-black text-2xl border border-slate-200">
              {String(lesson.order).padStart(2, '0')}
            </div>
            <div className="flex-grow space-y-6">
              <h3 className="text-2xl font-bold text-slate-900 leading-tight">{lesson.title}</h3>
              <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed opacity-90">
                {lesson.content}
              </div>
              {lesson.videoUrl && (
                <a 
                  href={lesson.videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl text-lg font-bold hover:bg-emerald-600 transition-all shadow-xl"
                >
                  <PlayCircle size={24} className="text-emerald-400" /> Watch Video Lesson
                </a>
              )}
            </div>
          </div>
        ))}
        {(!selectedCourse?.lessons || selectedCourse.lessons.length === 0) && (
          <div className="py-24 text-center bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed">
            <FileText size={48} className="mx-auto text-slate-300 mb-6" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No lessons available</h3>
            <p className="text-slate-500 text-lg">Lessons for this course are coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-12 w-full max-w-7xl mx-auto space-y-16">
      <div className="text-center space-y-6 mb-20">
        {onBack && !selectedProgram && !selectedCourse && (
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors text-[10px] font-black uppercase tracking-widest mb-4 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Return to Portal
          </button>
        )}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
        >
          <BookOpen size={14} />
          Knowledge Base
        </motion.div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-tight">Training & <span className="text-emerald-600">Resources</span></h1>
        <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
          Access official party training materials, policy documents, and educational resources designed for modern political activists.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 p-12 rounded-[3rem] text-center shadow-sm">
          <p className="text-rose-600 font-bold text-xl mb-8">{error}</p>
          <button onClick={fetchPrograms} className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-bold text-lg hover:bg-rose-700 transition-all shadow-xl">
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {!selectedProgram && !selectedCourse && renderProgramList()}
          {selectedProgram && !selectedCourse && renderCourseList()}
          {selectedCourse && renderLessonList()}
        </div>
      )}
    </div>
  );
};
