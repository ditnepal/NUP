import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  ClipboardList, 
  FileText,
  ArrowLeft,
  Loader2,
  Star,
  Plus,
  X,
  CheckCircle,
  Clock
} from 'lucide-react';
import { api } from '../lib/api';
import { Volunteer } from '../types';
import { toast } from 'sonner';

interface VolunteerProfileViewProps {
  volunteerId: string;
  onBack: () => void;
}

export const VolunteerProfileView: React.FC<VolunteerProfileViewProps> = ({ volunteerId, onBack }) => {
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [performanceData, setPerformanceData] = useState({ rating: 5, feedback: '' });
  const [recognitionData, setRecognitionData] = useState({ title: '', description: '' });

  const fetchVolunteer = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/volunteers/${volunteerId}`);
      setVolunteer(data);
    } catch (error) {
      console.error('Error fetching volunteer:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteer();
  }, [volunteerId]);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/volunteers/${volunteerId}/evaluate`, performanceData);
      toast.success('Performance evaluation recorded');
      setIsPerformanceModalOpen(false);
      setPerformanceData({ rating: 5, feedback: '' });
      await fetchVolunteer();
    } catch (error: any) {
      toast.error(error.message || 'Failed to record evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecognize = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/volunteers/${volunteerId}/recognize`, recognitionData);
      toast.success('Recognition awarded');
      setIsRecognitionModalOpen(false);
      setRecognitionData({ title: '', description: '' });
      await fetchVolunteer();
    } catch (error: any) {
      toast.error(error.message || 'Failed to award recognition');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="animate-spin text-blue-600" size={48} />
    </div>
  );
  
  if (!volunteer) return (
    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
      <p className="text-slate-500 mb-4">Volunteer not found.</p>
      <button onClick={onBack} className="text-blue-600 font-semibold hover:underline">Go Back</button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Volunteer Profile</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
          {volunteer.fullName.charAt(0)}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-900">{volunteer.fullName}</h1>
          <p className="text-slate-500">Volunteer ID: {volunteer.id.slice(0, 8)}</p>
          <span className={`inline-block mt-2 px-3 py-1 text-sm font-semibold rounded-full ${
            volunteer.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {volunteer.status}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact & Skills */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Contact Information</h2>
            <div className="space-y-3 text-slate-600">
              <div className="flex items-center gap-3"><Mail size={18} /> {volunteer.email || 'No email'}</div>
              <div className="flex items-center gap-3"><Phone size={18} /> {volunteer.phone || 'No phone'}</div>
              <div className="flex items-center gap-3"><MapPin size={18} /> {volunteer.availability || 'No location info'}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {volunteer.skills?.split(',').map(skill => (
                <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">{skill.trim()}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks & Reports */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Assigned Tasks</h2>
            <div className="space-y-4">
              {volunteer.assignments && volunteer.assignments.length > 0 ? volunteer.assignments?.map((assignment, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="text-blue-600" size={20} />
                      <div>
                        <span className="font-bold text-slate-900 block">{assignment.taskName}</span>
                        {assignment.campaign && (
                          <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                            Campaign: {assignment.campaign.title || assignment.campaign.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-widest border ${
                      assignment.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{assignment.description || 'No description provided.'}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Assigned: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 text-center py-4">No tasks assigned yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Activity Reports</h2>
            <div className="space-y-4">
              {volunteer.reports && volunteer.reports.length > 0 ? volunteer.reports?.map((report, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <FileText className="text-slate-400" size={18} />
                      <span className="text-xs font-bold text-slate-700">
                        {report.assignment?.taskName || 'Task Report'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic mb-3">"{report.content}"</p>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold">
                    <Clock size={12} />
                    <span>{report.hoursSpent || 0} Hours Spent</span>
                  </div>
                </div>
              )) : (
                <p className="text-slate-500 text-center py-4">No activity reports submitted yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Performance & Recognition</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPerformanceModalOpen(true)}
                  className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest border border-blue-100 px-2 py-1 rounded bg-blue-50"
                >
                  <Star size={12} />
                  Evaluate
                </button>
                <button 
                  onClick={() => setIsRecognitionModalOpen(true)}
                  className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest border border-amber-100 px-2 py-1 rounded bg-amber-50"
                >
                  <Award size={12} />
                  Recognize
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Performance Section */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Evaluations</h3>
                <div className="space-y-3">
                  {volunteer.performance && volunteer.performance.length > 0 ? volunteer.performance.map((p, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < p.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-600">{p.feedback}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic">No evaluations yet.</p>
                  )}
                </div>
              </div>

              {/* Recognition Section */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Awards & Recognition</h3>
                <div className="space-y-3">
                  {volunteer.recognition && volunteer.recognition.length > 0 ? volunteer.recognition.map((r, i) => (
                    <div key={i} className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Award size={14} className="text-amber-600" />
                        <span className="text-xs font-bold text-slate-900">{r.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 mb-1">{r.description}</p>
                      <span className="text-[10px] text-slate-400">{new Date(r.date).toLocaleDateString()}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 italic">No recognitions yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Modal */}
      {isPerformanceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Performance Evaluation</h2>
              <button onClick={() => setIsPerformanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleEvaluate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPerformanceData({ ...performanceData, rating: num })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        performanceData.rating === num 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Feedback</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide detailed feedback on performance..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={performanceData.feedback}
                  onChange={e => setPerformanceData({ ...performanceData, feedback: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPerformanceModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin" size={18} />}
                  Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recognition Modal */}
      {isRecognitionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Award Recognition</h2>
              <button onClick={() => setIsRecognitionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleRecognize} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Award Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Volunteer of the Month"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={recognitionData.title}
                  onChange={e => setRecognitionData({ ...recognitionData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe why this recognition is being awarded..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={recognitionData.description}
                  onChange={e => setRecognitionData({ ...recognitionData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecognitionModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="animate-spin" size={18} />}
                  Award Recognition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
