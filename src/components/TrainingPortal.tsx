import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { BookOpen, Video, FileText, CheckCircle, Play, ChevronRight, Award, Star, Clock, User } from 'lucide-react';

export const TrainingPortal: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-courses'>('browse');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'browse') {
        const data = await api.get('/training/programs');
        setPrograms(data);
      } else {
        const data = await api.get('/training/progress');
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await api.post(`/training/courses/${courseId}/enroll`, {});
      alert('Enrolled successfully');
      setActiveTab('my-courses');
    } catch (error: any) {
      alert(`Enrollment failed: ${error.message}`);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training & Capacity Building</h1>
          <p className="text-gray-500">Enhance your skills with our specialized training programs.</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'browse' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse Programs
          </button>
          <button
            onClick={() => setActiveTab('my-courses')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'my-courses' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Learning
          </button>
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="space-y-12">
          {programs.map((program) => (
            <div key={program.id}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{program.name}</h2>
                  <p className="text-sm text-gray-500">{program.description}</p>
                </div>
                <span className={`ml-auto px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  program.category === 'INTERNAL' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                }`}>
                  {program.category}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {program.courses.map((course: any) => (
                  <div key={course.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all group">
                    <div className="aspect-video bg-gray-100 relative overflow-hidden">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Video size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {course.level}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{course.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-6">{course.description}</p>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            4h 30m
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-amber-400 fill-amber-400" />
                            4.8
                          </div>
                        </div>
                        <button 
                          onClick={() => handleEnroll(course.id)}
                          className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                        >
                          Enroll Now <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'my-courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {progress.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Play size={24} />
                </div>
                <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  item.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {item.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.course.title}</h3>
              <p className="text-xs text-gray-500 mb-6">{item.course.program.name}</p>
              
              <div className="mb-6">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-gray-500">Progress</span>
                  <span className="text-emerald-600">{item.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                {item.status === 'COMPLETED' ? (
                  <button className="text-emerald-600 font-bold text-sm flex items-center gap-2">
                    <Award size={16} /> Get Certificate
                  </button>
                ) : (
                  <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors w-full">
                    Continue Learning
                  </button>
                )}
              </div>
            </div>
          ))}
          {progress.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center text-gray-500 italic">
              You haven't enrolled in any courses yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
