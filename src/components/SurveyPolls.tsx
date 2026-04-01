import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  ClipboardList, 
  Plus, 
  Send, 
  CheckCircle2, 
  ChevronRight,
  Users,
  Calendar,
  Vote,
  X
} from 'lucide-react';

import { api } from '../lib/api';
import { usePermissions } from '../hooks/usePermissions';

interface Survey {
  id: string;
  title: string;
  description: string;
  status: string;
  _count: { responses: number };
  createdAt: string;
}

interface Poll {
  id: string;
  question: string;
  status: string;
  options: { id: string; text: string; _count: { votes: number } }[];
  _count: { votes: number };
}

export const SurveyPolls: React.FC<{ user: any }> = ({ user }) => {
  const { can } = usePermissions(user);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const [activeTab, setActiveTab] = useState<'surveys' | 'polls'>(isAdminOrStaff ? 'surveys' : 'polls');
  const [showCreateSurvey, setShowCreateSurvey] = useState(false);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showTakeSurvey, setShowTakeSurvey] = useState(false);
  const [showSurveyResults, setShowSurveyResults] = useState(false);
  const [currentSurvey, setCurrentSurvey] = useState<any>(null);
  const [surveyAnalytics, setSurveyAnalytics] = useState<any>(null);
  const [newSurvey, setNewSurvey] = useState<any>({ 
    title: '', 
    description: '', 
    questions: [], 
    audience: 'MEMBER', 
    placementType: 'GENERAL', 
    targetSlug: '' 
  });
  const [newPoll, setNewPoll] = useState<any>({ 
    question: '', 
    options: ['', ''], 
    audience: 'MEMBER', 
    placementType: 'GENERAL', 
    targetSlug: '' 
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Stagger API calls
      const sData = await api.get('/surveys');
      await new Promise(resolve => setTimeout(resolve, 300));
      const pData = await api.get('/surveys/polls');
      
      if (can('SURVEYS', 'CREATE') || can('SURVEYS', 'UPDATE')) {
        setSurveys(sData);
        setPolls(pData);
      } else {
        setSurveys(sData.filter((s: any) => s.status === 'ACTIVE'));
        setPolls(pData.filter((p: any) => p.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await api.post(`/surveys/polls/${pollId}/vote`, { optionId });
      fetchData();
    } catch (err: any) {
      console.error('Error voting:', err);
      setError(err.response?.data?.error || 'Failed to submit vote. You may have already voted.');
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/surveys', newSurvey);
      setSuccess('Survey created successfully');
      setShowCreateSurvey(false);
      setNewSurvey({ 
        title: '', 
        description: '', 
        questions: [], 
        audience: 'MEMBER', 
        placementType: 'GENERAL', 
        targetSlug: '' 
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create survey');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/surveys/polls', newPoll);
      setSuccess('Poll created successfully');
      setShowCreatePoll(false);
      setNewPoll({ 
        question: '', 
        options: ['', ''], 
        audience: 'MEMBER', 
        placementType: 'GENERAL', 
        targetSlug: '' 
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeSurvey = async (id: string) => {
    try {
      const data = await api.get(`/surveys/${id}`);
      setCurrentSurvey(data);
      setShowTakeSurvey(true);
      setAnswers({});
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));
      await api.post('/surveys/responses', {
        surveyId: currentSurvey?.id,
        answers: formattedAnswers,
      });
      setSuccess('Survey submitted successfully');
      setShowTakeSurvey(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit survey');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = async (id: string) => {
    try {
      const data = await api.get(`/surveys/${id}/analytics`);
      setSurveyAnalytics(data);
      setShowSurveyResults(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSurveyStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
      await api.patch(`/surveys/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePollStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
      await api.patch(`/surveys/polls/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Surveys & Polls</h1>
          <p className="text-gray-500 mt-2">Gather public opinion and community feedback.</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('surveys')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'surveys' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            Surveys
          </button>
          <button 
            onClick={() => setActiveTab('polls')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'polls' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
          >
            Polls
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex justify-between items-center">
          <p>{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <X size={20} />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl flex justify-between items-center">
          <p>{success}</p>
          <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600">
            <X size={20} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-blue-600">
            <ClipboardList size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Active Surveys</span>
          </div>
          <p className="text-3xl font-bold">{surveys.filter(s => s.status === 'ACTIVE').length}</p>
          <p className="text-sm text-gray-500">Live data collection</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-purple-600">
            <Users size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Responses</span>
          </div>
          <p className="text-3xl font-bold">{surveys.reduce((acc, s) => acc + s._count.responses, 0)}</p>
          <p className="text-sm text-gray-500">Across all surveys</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-green-600">
            <Vote size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Active Polls</span>
          </div>
          <p className="text-3xl font-bold">{polls.filter(p => p.status === 'ACTIVE').length}</p>
          <p className="text-sm text-gray-500">Quick community feedback</p>
        </div>
      </div>

      {activeTab === 'surveys' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {can('SURVEYS', 'CREATE') && (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowCreateSurvey(true)}
              className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer hover:border-black transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-black transition-colors shadow-sm">
                <Plus size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Create New Survey</h3>
                <p className="text-sm text-gray-500">Design a custom questionnaire</p>
              </div>
            </motion.div>
          )}

          {surveys?.map((s) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div 
                  onClick={() => can('SURVEYS', 'UPDATE') && handleToggleSurveyStatus(s.id, s.status)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${can('SURVEYS', 'UPDATE') ? 'cursor-pointer' : ''} ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                >
                  {s.status}
                </div>
                <div className="text-gray-400">
                  <Calendar size={18} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold line-clamp-1">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{s.description}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <BarChart3 size={16} />
                  {s._count.responses} Responses
                </div>
                {can('SURVEYS', 'UPDATE') ? (
                  <button onClick={() => handleViewResults(s.id)} className="flex items-center gap-2 text-sm font-bold text-black hover:gap-3 transition-all">
                    View Results
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button onClick={() => handleTakeSurvey(s.id)} className="flex items-center gap-2 text-sm font-bold text-black hover:gap-3 transition-all">
                    Take Survey
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {can('SURVEYS', 'CREATE') && (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowCreatePoll(true)}
              className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 cursor-pointer hover:border-black transition-all group"
            >
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-black transition-colors shadow-sm">
                <Plus size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Create New Poll</h3>
                <p className="text-sm text-gray-500">Quick community feedback</p>
              </div>
            </motion.div>
          )}
          {polls?.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">{p.question}</h3>
                <div className="flex items-center gap-2">
                  <div 
                    onClick={() => can('SURVEYS', 'UPDATE') && handleTogglePollStatus(p.id, p.status)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${can('SURVEYS', 'UPDATE') ? 'cursor-pointer' : ''} ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                  >
                    {p.status}
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{p._count.votes} Votes</span>
                </div>
              </div>
              <div className="space-y-4">
                {p.options?.map((o) => {
                  const percentage = p._count.votes > 0 ? (o._count.votes / p._count.votes) * 100 : 0;
                  return (
                    <div key={o.id} className="space-y-2">
                      <button 
                        onClick={() => handleVote(p.id, o.id)}
                        className="w-full flex justify-between items-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all group"
                      >
                        <span className="font-medium text-gray-700 group-hover:text-black">{o.text}</span>
                        <span className="text-sm font-bold text-gray-400">{Math.round(percentage)}%</span>
                      </button>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="h-full bg-black rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center pt-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  Live Results
                </div>
                <button className="text-gray-400 hover:text-black transition-colors">
                  <Send size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Survey Modal */}
      {showCreateSurvey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Create New Survey</h2>
            <form onSubmit={handleCreateSurvey} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newSurvey.title}
                  onChange={(e) => setNewSurvey({...newSurvey, title: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={newSurvey.description}
                  onChange={(e) => setNewSurvey({...newSurvey, description: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select
                    value={newSurvey.audience}
                    onChange={(e) => setNewSurvey({...newSurvey, audience: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="MEMBER">Members Only</option>
                    <option value="PUBLIC">Public (Read-only for Anon)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placement</label>
                  <select
                    value={newSurvey.placementType}
                    onChange={(e) => setNewSurvey({...newSurvey, placementType: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="GENERAL">General/Dashboard</option>
                    <option value="PUBLIC_PORTAL">Public Portal (Inline)</option>
                    <option value="CONTENT_INLINE">Content Inline (Target Slug)</option>
                    <option value="REGISTRATION_PRE_FORM">Registration Pre-Form</option>
                  </select>
                </div>
              </div>

              {newSurvey.placementType === 'CONTENT_INLINE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Slug (Page/Post URL Slug)</label>
                  <input 
                    type="text" 
                    value={newSurvey.targetSlug}
                    onChange={(e) => setNewSurvey({...newSurvey, targetSlug: e.target.value})}
                    placeholder="e.g. news-article-1"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                    required
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">Questions</h3>
                  <button 
                    type="button"
                    onClick={() => setNewSurvey({
                      ...newSurvey, 
                      questions: [...newSurvey.questions, { text: '', type: 'TEXT', options: [] }]
                    })}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800"
                  >
                    + Add Question
                  </button>
                </div>
                
                {newSurvey.questions?.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 border border-gray-100 rounded-2xl space-y-4 bg-gray-50">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">Question {qIndex + 1}</span>
                      {newSurvey.questions.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => {
                            const newQuestions = [...newSurvey.questions];
                            newQuestions.splice(qIndex, 1);
                            setNewSurvey({...newSurvey, questions: newQuestions});
                          }}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Question text"
                      value={q.text}
                      onChange={(e) => {
                        const newQuestions = [...newSurvey.questions];
                        newQuestions[qIndex].text = e.target.value;
                        setNewSurvey({...newSurvey, questions: newQuestions});
                      }}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      required
                    />
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const newQuestions = [...newSurvey.questions];
                        newQuestions[qIndex].type = e.target.value as any;
                        if (e.target.value !== 'MULTIPLE_CHOICE') {
                          newQuestions[qIndex].options = [];
                        } else if (newQuestions[qIndex].options.length === 0) {
                           newQuestions[qIndex].options = ['Option 1', 'Option 2'];
                        }
                        setNewSurvey({...newSurvey, questions: newQuestions});
                      }}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                    >
                      <option value="TEXT">Text Answer</option>
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="RATING">Rating (1-5)</option>
                    </select>

                    {q.type === 'MULTIPLE_CHOICE' && (
                      <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                        {q.options?.map((opt, oIndex) => (
                          <div key={oIndex} className="flex gap-2">
                            <input 
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newQuestions = [...newSurvey.questions];
                                newQuestions[qIndex].options[oIndex] = e.target.value;
                                setNewSurvey({...newSurvey, questions: newQuestions});
                              }}
                              className="flex-1 p-2 border border-gray-200 rounded-lg text-sm"
                              placeholder={`Option ${oIndex + 1}`}
                              required
                            />
                            {q.options.length > 2 && (
                              <button 
                                type="button"
                                onClick={() => {
                                  const newQuestions = [...newSurvey.questions];
                                  newQuestions[qIndex].options.splice(oIndex, 1);
                                  setNewSurvey({...newSurvey, questions: newQuestions});
                                }}
                                className="text-red-500 px-2"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button 
                          type="button"
                          onClick={() => {
                            const newQuestions = [...newSurvey.questions];
                            newQuestions[qIndex].options.push(`Option ${newQuestions[qIndex].options.length + 1}`);
                            setNewSurvey({...newSurvey, questions: newQuestions});
                          }}
                          className="text-xs font-bold text-gray-500 hover:text-black"
                        >
                          + Add Option
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateSurvey(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Survey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Poll Modal */}
      {showCreatePoll && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-6">Create New Poll</h2>
            <form onSubmit={handleCreatePoll} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input 
                  type="text" 
                  value={newPoll.question}
                  onChange={(e) => setNewPoll({...newPoll, question: e.target.value})}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                  <select
                    value={newPoll.audience}
                    onChange={(e) => setNewPoll({...newPoll, audience: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="MEMBER">Members Only</option>
                    <option value="PUBLIC">Public (Read-only for Anon)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placement</label>
                  <select
                    value={newPoll.placementType}
                    onChange={(e) => setNewPoll({...newPoll, placementType: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="GENERAL">General/Dashboard</option>
                    <option value="PUBLIC_PORTAL">Public Portal (Inline)</option>
                    <option value="CONTENT_INLINE">Content Inline (Target Slug)</option>
                    <option value="REGISTRATION_PRE_FORM">Registration Pre-Form</option>
                  </select>
                </div>
              </div>

              {newPoll.placementType === 'CONTENT_INLINE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Slug (Page/Post URL Slug)</label>
                  <input 
                    type="text" 
                    value={newPoll.targetSlug}
                    onChange={(e) => setNewPoll({...newPoll, targetSlug: e.target.value})}
                    placeholder="e.g. news-article-1"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                    required
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Options</label>
                {newPoll.options?.map((opt, index) => (
                  <div key={index} className="flex gap-2">
                    <input 
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOptions = [...newPoll.options];
                        newOptions[index] = e.target.value;
                        setNewPoll({...newPoll, options: newOptions});
                      }}
                      className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
                      placeholder={`Option ${index + 1}`}
                      required
                    />
                    {newPoll.options.length > 2 && (
                      <button 
                        type="button"
                        onClick={() => {
                          const newOptions = [...newPoll.options];
                          newOptions.splice(index, 1);
                          setNewPoll({...newPoll, options: newOptions});
                        }}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})}
                  className="text-sm font-bold text-blue-600 hover:text-blue-800"
                >
                  + Add Option
                </button>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowCreatePoll(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Poll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Take Survey Modal */}
      {showTakeSurvey && currentSurvey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-2">{currentSurvey.title}</h2>
            <p className="text-gray-600 mb-8">{currentSurvey.description}</p>
            
            <form onSubmit={handleSubmitSurvey} className="space-y-8">
              {currentSurvey.questions?.map((q: any, index: number) => (
                <div key={q.id} className="space-y-4">
                  <label className="block font-medium text-gray-900">
                    {index + 1}. {q.text}
                  </label>
                  
                  {q.type === 'TEXT' && (
                    <textarea 
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none h-24"
                      required
                    />
                  )}

                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-2">
                      {q.options.map((opt: string, oIndex: number) => (
                        <label key={oIndex} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                          <input 
                            type="radio"
                            name={`question-${q.id}`}
                            value={opt}
                            checked={answers[q.id] === opt}
                            onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                            className="w-4 h-4 text-black focus:ring-black"
                            required
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'RATING' && (
                    <div className="flex gap-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <label key={rating} className="flex flex-col items-center gap-2 cursor-pointer">
                          <input 
                            type="radio"
                            name={`question-${q.id}`}
                            value={rating}
                            checked={answers[q.id] === rating.toString()}
                            onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})}
                            className="sr-only"
                            required
                          />
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${answers[q.id] === rating.toString() ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {rating}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowTakeSurvey(false)}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Survey'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Survey Results Modal */}
      {showSurveyResults && surveyAnalytics && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">{surveyAnalytics.survey.title}</h2>
                <p className="text-gray-500">Total Responses: {surveyAnalytics.totalResponses}</p>
              </div>
              <button 
                onClick={() => setShowSurveyResults(false)}
                className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {surveyAnalytics.questions?.map((q: any, index: number) => (
                <div key={q.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-lg mb-4">{index + 1}. {q.text}</h3>
                  
                  {q.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-3">
                      {q.options.map((opt: string, oIndex: number) => {
                        const count = q.answers[opt] || 0;
                        const percentage = surveyAnalytics.totalResponses > 0 
                          ? (count / surveyAnalytics.totalResponses) * 100 
                          : 0;
                        
                        return (
                          <div key={oIndex} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-gray-700">{opt}</span>
                              <span className="text-gray-500">{count} ({Math.round(percentage)}%)</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                className="h-full bg-blue-500 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'RATING' && (
                    <div className="flex items-end gap-2 h-32 pt-4">
                      {[1, 2, 3, 4, 5].map((rating) => {
                        const count = q.answers[rating.toString()] || 0;
                        const percentage = surveyAnalytics.totalResponses > 0 
                          ? (count / surveyAnalytics.totalResponses) * 100 
                          : 0;
                        
                        return (
                          <div key={rating} className="flex-1 flex flex-col items-center gap-2">
                            <span className="text-xs text-gray-500">{count}</span>
                            <div className="w-full bg-gray-200 rounded-t-lg relative flex-1 flex items-end justify-center">
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${percentage}%` }}
                                className="w-full bg-purple-500 rounded-t-lg absolute bottom-0"
                              />
                            </div>
                            <span className="font-bold text-sm">{rating}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.type === 'TEXT' && (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {Object.entries(q.answers).map(([answer, count]: [string, any], aIndex) => (
                        <div key={aIndex} className="p-3 bg-white rounded-xl border border-gray-100 text-sm flex justify-between items-start gap-4">
                          <p className="text-gray-700">{answer}</p>
                          {count > 1 && (
                            <span className="shrink-0 px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">
                              x{count}
                            </span>
                          )}
                        </div>
                      ))}
                      {Object.keys(q.answers).length === 0 && (
                        <p className="text-sm text-gray-500 italic">No responses yet.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
