import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  ClipboardList, 
  PieChart, 
  Plus, 
  Send, 
  CheckCircle2, 
  ChevronRight,
  Users,
  Calendar,
  Vote
} from 'lucide-react';

import { api } from '../lib/api';

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

export const SurveyPolls: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'surveys' | 'polls'>('surveys');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Stagger API calls
      const sData = await api.get('/surveys');
      await new Promise(resolve => setTimeout(resolve, 300));
      const pData = await api.get('/surveys/polls');
      
      setSurveys(sData);
      setPolls(pData);
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
    } catch (error) {
      console.error('Error voting:', error);
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
          <motion.div 
            whileHover={{ scale: 1.02 }}
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

          {surveys.map((s) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6 flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
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
                <button className="flex items-center gap-2 text-sm font-bold text-black hover:gap-3 transition-all">
                  View Results
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {polls.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">{p.question}</h3>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{p._count.votes} Votes</span>
              </div>
              <div className="space-y-4">
                {p.options.map((o) => {
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
    </div>
  );
};
