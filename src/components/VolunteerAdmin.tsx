import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Users, Briefcase, ClipboardList, CheckCircle, Clock, Plus, Search } from 'lucide-react';

export const VolunteerAdmin: React.FC = () => {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const data = await api.get('/volunteers');
      setVolunteers(data);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteer Management</h1>
          <p className="text-gray-500">Manage party volunteers, skills, and task assignments.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          Register Volunteer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {volunteers.map((volunteer) => (
          <div key={volunteer.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xl">
                  {volunteer.fullName.charAt(0)}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  volunteer.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                }`}>
                  {volunteer.status}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{volunteer.fullName}</h3>
              <p className="text-sm text-gray-500 mt-1">{volunteer.email || volunteer.phone}</p>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase size={16} className="text-gray-400" />
                  <span className="font-medium">Skills:</span> {volunteer.skills}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-gray-400" />
                  <span className="font-medium">Availability:</span> {volunteer.availability || 'Not specified'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClipboardList size={16} className="text-gray-400" />
                  <span className="font-medium">Active Tasks:</span> {volunteer.assignments?.length || 0}
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button className="flex-1 bg-gray-50 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                  View Profile
                </button>
                <button className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  Assign Task
                </button>
              </div>
            </div>
          </div>
        ))}
        {volunteers.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            No volunteers found. Start by registering your first volunteer.
          </div>
        )}
      </div>
    </div>
  );
};
