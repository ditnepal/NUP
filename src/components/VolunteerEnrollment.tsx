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
        className="max-w-2xl mx-auto text-center py-20 px-6 bg-white rounded-[3rem] border border-slate-200 shadow-2xl"
      >
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Application Received!</h2>
        <p className="text-xl text-slate-600 mb-12 leading-relaxed max-w-lg mx-auto">
          Thank you for choosing to volunteer with us. Your application has been received and is currently under review. Our team will reach out to you shortly.
        </p>
        <button 
          onClick={onSuccess}
          className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
        >
          Go to Dashboard
        </button>
      </motion.div>
    );
  }

  if (step === 'info') {
    return (
      <div className="max-w-6xl mx-auto space-y-16 py-12 px-4">
        <div className="text-center space-y-6">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Sparkles size={14} />
            Community Service
          </motion.div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Join Our Volunteer <span className="text-blue-600">Movement</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
            Your skills and passion can help us build a better future. Join our dedicated team of volunteers and contribute to meaningful change in our community.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Users, title: 'Community', desc: 'Connect with like-minded individuals and build lasting relationships.' },
            { icon: ShieldCheck, title: 'Impact', desc: 'Directly contribute to projects that improve lives and strengthen society.' },
            { icon: Clock, title: 'Flexibility', desc: 'Volunteer on your own terms with roles that fit your schedule.' }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-16 h-16 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <item.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{item.title}</h3>
              <p className="text-slate-500 text-lg leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-16 text-white overflow-hidden relative shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-4xl font-bold">Ready to get started?</h2>
              <p className="text-slate-400 text-xl leading-relaxed">
                It only takes a few minutes to register. We'll ask about your skills and availability to find the perfect role for you.
              </p>
            </div>
            <button 
              onClick={() => setStep('form')}
              className="bg-white text-slate-900 px-12 py-6 rounded-2xl font-bold hover:bg-slate-100 transition-all shadow-2xl flex items-center gap-4 group text-lg"
            >
              Start Registration
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[20rem] h-[20rem] bg-emerald-500/10 rounded-full blur-[80px]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="bg-slate-50 p-10 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Volunteer Registration</h2>
            <p className="text-slate-500 mt-2 text-lg">Tell us a bit about yourself and how you'd like to help.</p>
          </div>
          <button 
            onClick={() => setStep('info')}
            className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-full transition-all shadow-sm"
          >
            <ArrowRight className="rotate-180" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
              <input 
                required
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg"
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
              <input 
                required
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
              <input 
                required
                type="tel"
                placeholder="+977 98XXXXXXXX"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Availability</label>
              <input 
                required
                type="text"
                placeholder="e.g. Weekends, Evenings"
                value={formData.availability}
                onChange={e => setFormData({...formData, availability: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg"
              />
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Areas of Interest</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {interestOptions?.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    formData.interests.includes(interest)
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.interests.includes(interest) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                  }`}>
                    {formData.interests.includes(interest) && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <span className="font-bold text-base">{interest}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Other Skills or Notes</label>
            <textarea 
              rows={4}
              placeholder="Tell us about any other relevant experience or skills..."
              value={formData.skills}
              onChange={e => setFormData({...formData, skills: e.target.value})}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-lg"
            />
          </div>

          <div className="pt-8 flex items-center gap-6">
            <button 
              type="button"
              onClick={() => setStep('info')}
              className="px-10 py-5 text-slate-600 font-bold hover:bg-slate-100 rounded-2xl transition-colors text-lg"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || formData.interests.length === 0}
              className="flex-1 bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-lg"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Heart size={24} />}
              Complete Registration
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
