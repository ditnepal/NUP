import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  ClipboardList, 
  FileText,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api';
import { Volunteer } from '../types';

interface VolunteerProfileViewProps {
  volunteerId: string;
  onBack: () => void;
}

export const VolunteerProfileView: React.FC<VolunteerProfileViewProps> = ({ volunteerId, onBack }) => {
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolunteer = async () => {
      try {
        const data = await api.get(`/volunteers/${volunteerId}`);
        setVolunteer(data);
      } catch (error) {
        console.error('Error fetching volunteer:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVolunteer();
  }, [volunteerId]);

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
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="text-blue-600" />
                    <span className="font-medium text-slate-900">{assignment.role}</span>
                  </div>
                  <span className="text-sm text-slate-500">{new Date(assignment.createdAt).toLocaleDateString()}</span>
                </div>
              )) : (
                <p className="text-slate-500 text-center py-4">No tasks assigned yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Performance & Recognition</h2>
            <div className="space-y-4">
              <p className="text-slate-500 text-center py-4">No performance records or recognitions found.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
