import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Heart, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

interface VolunteerEnrollmentProps {
  user: any;
  onSuccess: () => void;
}

export const VolunteerEnrollment: React.FC<VolunteerEnrollmentProps> = ({ user, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'form' | 'success'>('info');
  const [formData, setFormData] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    skills: '',
    availability: '',
    interests: [] as string[]
  });

  const interestOptions = [
    'Event Management',
    'Social Media & Digital Marketing',
    'Community Outreach',
    'Data Entry & Administration',
    'Technical Support',
    'Fundraising',
    'Graphic Design',
    'Public Speaking'
  ];

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/volunteers', {
        ...formData,
        skills: [...formData.interests, formData.skills].filter(Boolean).join(', '),
        status: 'PENDING'
      });
      toast.success('Volunteer registration successful!');
      setStep('success');
    } catch (error: any) {
      console.error('Error registering volunteer:', error);
      toast.error(error.message || 'Failed to register as volunteer.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-8 px-6 bg-white rounded-2xl border border-slate-200 shadow-xl"
      >
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="text-lg font-black text-slate-900 mb-1.5 tracking-tight uppercase">Application Received!</h2>
        <p className="text-[10px] text-slate-500 mb-6 leading-relaxed max-w-xs mx-auto font-medium uppercase tracking-tight">
          Thank you for choosing to volunteer with us. Your application has been received and is currently under review. Our team will reach out to you shortly.
        </p>
        <button 
          onClick={onSuccess}
          className="w-full bg-slate-900 text-white py-3 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md"
        >
          Go to Dashboard
        </button>
      </motion.div>
    );
  }

  if (step === 'info') {
    return (
      <div className="max-w-5xl mx-auto space-y-8 py-6 px-4">
        <div className="text-center space-y-2">
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest mb-1 border border-blue-100"
          >
            <Sparkles size={10} />
            COMMUNITY SERVICE
          </motion.div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">
            Join Our Volunteer <span className="text-blue-600">Movement</span>
          </h1>
          <p className="text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium uppercase tracking-tight">
            Your skills and passion can help us build a better future. Join our dedicated team of volunteers and contribute to meaningful change in our community.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {[
            { icon: Users, title: 'COMMUNITY', desc: 'Connect with like-minded individuals and build lasting relationships.' },
            { icon: ShieldCheck, title: 'IMPACT', desc: 'Directly contribute to projects that improve lives and strengthen society.' },
            { icon: Clock, title: 'FLEXIBILITY', desc: 'Volunteer on your own terms with roles that fit your schedule.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group border-t-2 border-t-slate-100 hover:border-t-blue-500"
            >
              <div className="w-10 h-10 bg-slate-50 text-slate-900 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-slate-100">
                <item.icon size={20} />
              </div>
              <h3 className="text-[12px] font-black text-slate-900 mb-1.5 uppercase tracking-tight">{item.title}</h3>
              <p className="text-slate-500 text-[9px] leading-relaxed font-medium uppercase tracking-tight">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-2xl p-8 text-white overflow-hidden relative shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <h2 className="text-xl font-black uppercase tracking-tight">Ready to get started?</h2>
              <p className="text-slate-400 text-[10px] leading-relaxed font-medium uppercase tracking-tight">
                It only takes a few minutes to register. We'll ask about your skills and availability to find the perfect role for you.
              </p>
            </div>
            <button 
              onClick={() => setStep('form')}
              className="bg-white text-slate-900 px-8 py-3.5 rounded-lg font-black hover:bg-blue-500 hover:text-white transition-all shadow-lg flex items-center gap-2.5 group text-[10px] uppercase tracking-widest"
            >
              Start Registration
              <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-[60px]"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-[50px]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">VOLUNTEER REGISTRATION</h2>
            <p className="text-slate-500 mt-0.5 text-[9px] font-bold uppercase tracking-wider">Tell us a bit about yourself and how you'd like to help.</p>
          </div>
          <button 
            onClick={() => setStep('info')}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all shadow-sm border border-slate-200"
          >
            <ArrowRight className="rotate-180" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">FULL NAME</label>
              <input 
                required
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px] font-black uppercase tracking-tight"
                placeholder="ENTER YOUR FULL NAME"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">EMAIL ADDRESS</label>
              <input 
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px] font-black uppercase tracking-tight"
                placeholder="EMAIL@EXAMPLE.COM"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">PHONE NUMBER</label>
              <input 
                required
                type="tel"
                placeholder="+977 98XXXXXXXX"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px] font-black uppercase tracking-tight"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">AVAILABILITY</label>
              <input 
                required
                type="text"
                placeholder="E.G. WEEKENDS, EVENINGS"
                value={formData.availability}
                onChange={e => setFormData({...formData, availability: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-[11px] font-black uppercase tracking-tight"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block ml-1">AREAS OF INTEREST</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {interestOptions?.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left ${
                    formData.interests.includes(interest)
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    formData.interests.includes(interest) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                  }`}>
                    {formData.interests.includes(interest) && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className="font-black text-[9px] uppercase tracking-tight">{interest}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">OTHER SKILLS OR NOTES</label>
            <textarea 
              rows={2}
              placeholder="TELL US ABOUT ANY OTHER RELEVANT EXPERIENCE OR SKILLS..."
              value={formData.skills}
              onChange={e => setFormData({...formData, skills: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-[11px] font-black uppercase tracking-tight"
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setStep('info')}
              className="px-6 py-2.5 text-slate-500 font-black hover:bg-slate-100 rounded-lg transition-colors text-[9px] uppercase tracking-widest border border-transparent hover:border-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || formData.interests.length === 0}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-black hover:bg-blue-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : <Heart size={14} />}
              Complete Registration
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
