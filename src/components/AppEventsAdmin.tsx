import React, { useState, useEffect } from 'react';
import { AppEvent, UserProfile } from '../types';
import { api } from '../lib/api';
import { usePermissions } from '../hooks/usePermissions';
import { Calendar, MapPin, Plus, X, Loader2, Bell, Eye, EyeOff, Pin, PinOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppEventsAdminProps {
  user: UserProfile;
}

export const AppEventsAdmin: React.FC<AppEventsAdminProps> = ({ user }) => {
  const { can } = usePermissions(user);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<AppEvent>>({ 
    title: '', 
    summary: '',
    description: '', 
    audience: 'PUBLIC', 
    status: 'DRAFT', 
    eventDate: new Date(), 
    startAt: '09:00', 
    location: '',
    coverImageUrl: '',
    attachmentUrl: ''
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await api.get('/app-events');
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('COMMUNICATION', 'CREATE')) return;
    setSubmitting(true);
    try {
      await api.post('/app-events', newEvent);
      setIsModalOpen(false);
      fetchEvents();
      setNewEvent({ title: '', summary: '', description: '', audience: 'PUBLIC', status: 'DRAFT', eventDate: new Date(), startAt: '09:00', location: '', coverImageUrl: '', attachmentUrl: '' });
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, updates: Partial<AppEvent>) => {
    if (!can('COMMUNICATION', 'UPDATE')) return;
    try {
      await api.patch(`/app-events/${id}`, updates);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">App Announcements</h1>
          <p className="text-slate-500">Manage public and member-facing announcements and calendar events.</p>
        </div>
        {can('COMMUNICATION', 'CREATE') && (
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm">
            <Plus size={20} />
            Create Announcement
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Bell size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No announcements found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Create your first announcement to share news with the public or members.
            </p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    event.audience === 'PUBLIC' ? 'bg-blue-50 text-blue-600' : 
                    event.audience === 'MEMBERS' ? 'bg-purple-50 text-purple-600' : 
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {event.audience}
                  </span>
                  <div className="flex items-center gap-2">
                    {event.isPinned && <Pin size={14} className="text-amber-500 fill-amber-500" />}
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      event.status === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">{event.summary || event.description}</p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar size={14} />
                    {new Date(event.eventDate).toLocaleDateString()} at {event.startAt}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={14} />
                      {event.location}
                    </div>
                  )}
                </div>
                {can('COMMUNICATION', 'UPDATE') && (
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => handleToggle(event.id, { isPinned: !event.isPinned })} 
                      className={`p-2 rounded-lg transition-colors ${event.isPinned ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      title={event.isPinned ? "Unpin" : "Pin"}
                    >
                      {event.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                    </button>
                    <button 
                      onClick={() => handleToggle(event.id, { status: event.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })} 
                      className={`p-2 rounded-lg transition-colors ${event.status === 'PUBLISHED' ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                      title={event.status === 'PUBLISHED' ? "Unpublish" : "Publish"}
                    >
                      {event.status === 'PUBLISHED' ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
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
                <h3 className="text-xl font-bold text-slate-800">Create Announcement</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Title</label>
                  <input required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Summary</label>
                  <input value={newEvent.summary} onChange={e => setNewEvent({...newEvent, summary: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-700">Description</label>
                  <textarea required rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Audience</label>
                    <select required value={newEvent.audience} onChange={e => setNewEvent({...newEvent, audience: e.target.value as any})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                      <option value="PUBLIC">Public</option>
                      <option value="MEMBERS">Members Only</option>
                      <option value="STAFF">Staff Only</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select required value={newEvent.status} onChange={e => setNewEvent({...newEvent, status: e.target.value as any})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Date</label>
                    <input type="date" required value={newEvent.eventDate instanceof Date ? newEvent.eventDate.toISOString().split('T')[0] : newEvent.eventDate} onChange={e => setNewEvent({...newEvent, eventDate: new Date(e.target.value)})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Time</label>
                    <input type="time" required value={newEvent.startAt} onChange={e => setNewEvent({...newEvent, startAt: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Location</label>
                    <input required value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    {submitting && <Loader2 size={16} className="animate-spin" />}
                    Save Announcement
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
