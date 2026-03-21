import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Calendar, MapPin, Users, Plus, Search, Filter, CheckCircle, Clock, AlertCircle, ExternalLink, UserCheck, UserX } from 'lucide-react';

export const EventsAdmin: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'details'>('list');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await api.get('/events');
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async (id: string) => {
    try {
      const data = await api.get(`/events/${id}`);
      setSelectedEvent(data);
      setView('details');
    } catch (error) {
      console.error('Error fetching event details:', error);
    }
  };

  const markAttendance = async (registrationId: string, status: 'ATTENDED' | 'NO_SHOW') => {
    try {
      await api.patch(`/events/registrations/${registrationId}/attendance`, { status });
      // Refresh details
      fetchEventDetails(selectedEvent.id);
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  if (view === 'details' && selectedEvent) {
    return (
      <div className="p-6">
        <button 
          onClick={() => setView('list')}
          className="mb-6 text-emerald-600 hover:underline flex items-center gap-2 font-bold"
        >
          ← Back to Events
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                    {selectedEvent.type}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900">{selectedEvent.title}</h1>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedEvent.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                }`}>
                  {selectedEvent.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar size={20} className="text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Date & Time</p>
                    <p className="font-medium">{new Date(selectedEvent.startDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin size={20} className="text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Location</p>
                    <p className="font-medium">{selectedEvent.location}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-gray-600">
                <p>{selectedEvent.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Registrations</h2>
                <span className="text-sm text-gray-500 font-medium">
                  {selectedEvent.registrations.length} Total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendee</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedEvent.registrations.map((reg: any) => (
                      <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{reg.fullName}</div>
                          {reg.user && <div className="text-[10px] text-emerald-600 font-bold uppercase">Member</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div>{reg.email}</div>
                          <div className="text-xs">{reg.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            reg.status === 'ATTENDED' ? 'bg-green-50 text-green-600' :
                            reg.status === 'NO_SHOW' ? 'bg-red-50 text-red-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => markAttendance(reg.id, 'ATTENDED')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Mark Present"
                            >
                              <UserCheck size={18} />
                            </button>
                            <button 
                              onClick={() => markAttendance(reg.id, 'NO_SHOW')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Mark Absent"
                            >
                              <UserX size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                Speakers
              </h3>
              <div className="space-y-4">
                {selectedEvent.speakers.map((speaker: any) => (
                  <div key={speaker.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
                      {speaker.photoUrl ? (
                        <img src={speaker.photoUrl} alt={speaker.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Users size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{speaker.name}</p>
                      <p className="text-xs text-gray-500">{speaker.title}</p>
                    </div>
                  </div>
                ))}
                {selectedEvent.speakers.length === 0 && (
                  <p className="text-xs text-gray-400 italic">No speakers listed.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" />
                Agenda
              </h3>
              <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                {selectedEvent.agenda.map((item: any) => (
                  <div key={item.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-500" />
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">
                      {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                ))}
                {selectedEvent.agenda.length === 0 && (
                  <p className="text-xs text-gray-400 italic pl-6">No agenda items.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events & Field Operations</h1>
          <p className="text-gray-500">Manage rallies, town halls, and internal party meetings.</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus size={20} />
          Create Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div 
            key={event.id} 
            onClick={() => fetchEventDetails(event.id)}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  {event.type}
                </span>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                  event.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                }`}>
                  {event.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{event.title}</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} />
                  {new Date(event.startDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin size={14} />
                  {event.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users size={14} />
                  {event._count.registrations} Registered
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-xs font-bold text-emerald-600">Manage Event</span>
                <ExternalLink size={14} className="text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
