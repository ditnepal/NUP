import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  ClipboardList, 
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../lib/api';
import { Member } from '../types';

export const VolunteerProfileView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const data = await api.get(`/members/${id}`);
        setMember(data);
      } catch (error) {
        console.error('Error fetching member:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (!member) return <div className="p-8 text-center">Volunteer not found.</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
          {member.fullName.charAt(0)}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-slate-900">{member.fullName}</h1>
          <p className="text-slate-500">Volunteer ID: {member.membershipId}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full">
            {member.status}
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
              <div className="flex items-center gap-3"><Mail size={18} /> {member.email}</div>
              <div className="flex items-center gap-3"><Phone size={18} /> {member.phone}</div>
              <div className="flex items-center gap-3"><MapPin size={18} /> {member.orgUnitId}</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {member.skills?.map(skill => (
                <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">{skill}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks & Reports */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Assigned Tasks</h2>
            <div className="space-y-4">
              {member.assignedTasks?.map((task, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="text-blue-600" />
                    <span className="font-medium text-slate-900">{task.title}</span>
                  </div>
                  <span className="text-sm text-slate-500">{task.dueDate}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Submitted Reports</h2>
            <div className="space-y-4">
              {member.submittedReports?.map((report, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="text-emerald-600" />
                    <span className="font-medium text-slate-900">{report.title}</span>
                  </div>
                  <span className="text-sm text-slate-500">{report.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
