import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Calendar, MapPin, Users, Plus, Clock, X, Loader2 } from 'lucide-react';
import { Event, UserProfile } from '../types';
import { EventCard } from './ui/EventCard';
import { RegistrationTable } from './ui/RegistrationTable';
import { usePermissions } from '../hooks/usePermissions';
import { motion, AnimatePresence } from 'motion/react';

interface EventsAdminProps {
  user?: UserProfile | null;
}

export const EventsAdmin: React.FC<EventsAdminProps> = ({ user }) => {
  const { can } = usePermissions(user);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'details'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'RALLY',
    startDate: '',
    location: '',
    capacity: ''
  });

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
    if (!selectedEvent) return;
    try {
      await api.patch(`/events/registrations/${registrationId}/attendance`, { status });
      fetchEventDetails(selectedEvent.id);
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/events', {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined
      });
      setIsModalOpen(false);
      fetchEvents();
      setFormData({ title: '', description: '', type: 'RALLY', startDate: '', location: '', capacity: '' });
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'details' && selectedEvent) {
    return (
      <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto">
        <button 
          onClick={() => setView('list')}
          className="mb-6 text-emerald-600 hover:underline flex items-center gap-2 font-bold"
        >
          ← Back to Events
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">
                    {selectedEvent.type}
                  </span>
                  <h1 className="text-3xl font-bold text-slate-900">{selectedEvent.title}</h1>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedEvent.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'
                }`}>
                  {selectedEvent.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar size={20} className="text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Date & Time</p>
                    <p className="font-medium">{new Date(selectedEvent.startDate).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin size={20} className="text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Location</p>
                    <p className="font-medium">{selectedEvent.location}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm max-w-none text-slate-600">
                <p>{selectedEvent.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Registrations</h2>
                <span className="text-sm text-slate-500 font-medium">
                  {selectedEvent.registrations.length} Total
                </span>
              </div>
              <RegistrationTable registrations={selectedEvent.registrations} onMarkAttendance={markAttendance} />
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                Speakers
              </h3>
              <div className="space-y-4">
                {selectedEvent.speakers.map((speaker) => (
                  <div key={speaker.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden">
                      {speaker.photoUrl ? (
                        <img src={speaker.photoUrl} alt={speaker.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Users size={20} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{speaker.name}</p>
                      <p className="text-xs text-slate-500">{speaker.title}</p>
                    </div>
                  </div>
                ))}
                {selectedEvent.speakers.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No speakers listed.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-emerald-600" />
                Agenda
              </h3>
              <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {selectedEvent.agenda.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-500" />
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">
                      {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.description}</p>
                  </div>
                ))}
                {selectedEvent.agenda.length === 0 && (
                  <p className="text-xs text-slate-400 italic pl-6">No agenda items.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events & Field Operations</h1>
          <p className="text-slate-500">Manage rallies, town halls, and internal party meetings.</p>
        </div>
        {can('COMMUNICATION', 'CREATE') && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
            <Plus size={20} />
            Create Event
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event.id} event={event} onClick={() => fetchEventDetails(event.id)} />
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Create Event</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateEvent} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Event Title</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea required rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Event Type</label>
                    <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                      <option value="RALLY">Rally</option>
                      <option value="TOWN_HALL">Town Hall</option>
                      <option value="MEETING">Internal Meeting</option>
                      <option value="TRAINING">Training</option>
                      <option value="PRESS_CONFERENCE">Press Conference</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Start Date & Time</label>
                    <input type="datetime-local" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Location</label>
                    <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Capacity (Optional)</label>
                    <input type="number" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Create Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
