import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Calendar, MapPin, Users, Clock, Loader2, ArrowLeft, UserPlus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { UserProfile } from '../types';
import { toast } from 'sonner';

interface EventDetailViewProps {
  eventId: string;
  user: UserProfile | null;
  onBack: () => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ eventId, user, onBack }) => {
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const isOrganizer = user && ['ADMIN', 'STAFF'].includes(user.role);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const data = await api.get(`/events/${eventId}`);
        setEvent(data);
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [eventId]);

  const [isRSVPing, setIsRSVPing] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (event && user) {
      setIsRegistered(event.registrations?.some((reg: any) => reg.userId === user.id));
    }
  }, [event, user]);

  const handleRSVP = async () => {
    if (!user) return;
    setIsRSVPing(true);
    try {
      await api.post(`/events/${eventId}/rsvp`, { userId: user.id });
      setIsRegistered(true);
      // Refresh event details to update attendee list
      const data = await api.get(`/events/${eventId}`);
      setEvent(data);
    } catch (error) {
      console.error('Error RSVPing to event:', error);
      toast.error('Failed to RSVP. Please try again.');
    } finally {
      setIsRSVPing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return <div className="p-6 text-center text-slate-500">Event not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <button 
        onClick={onBack}
        className="text-emerald-600 hover:underline flex items-center gap-2 font-bold"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 inline-block">
          {event.type}
        </span>
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-4xl font-black text-slate-900">{event.title}</h1>
          {user && !isRegistered && (
            <button
              onClick={handleRSVP}
              disabled={isRSVPing}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-50"
            >
              {isRSVPing ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
              {isRSVPing ? 'RSVPing...' : 'RSVP to Event'}
            </button>
          )}
          {user && isRegistered && (
            <div className="flex items-center gap-2 bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold">
              <CheckCircle2 size={20} />
              Registered
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="flex items-center gap-3 text-slate-600">
            <Calendar size={20} className="text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Date & Time</p>
              <p className="font-medium">{format(new Date(event.startDate), 'MMMM d, yyyy • h:mm a')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <MapPin size={20} className="text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Location</p>
              <p className="font-medium">{event.location}</p>
            </div>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-slate-600">
          <p>{event.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users size={18} className="text-emerald-600" />
            Speakers
          </h3>
          <div className="space-y-4">
            {event.speakers.map((speaker: any) => (
              <div key={speaker.id} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full overflow-hidden">
                  {speaker.photoUrl ? (
                    <img src={speaker.photoUrl} alt={speaker.name} className="w-full h-full object-cover" />
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
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-emerald-600" />
            Agenda
          </h3>
          <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {event.agenda.map((item: any) => (
              <div key={item.id} className="relative pl-6">
                <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-500" />
                <p className="text-[10px] font-bold text-emerald-600 uppercase">
                  {format(new Date(item.startTime), 'h:mm a')}
                </p>
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendees Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-emerald-600" />
            Attendees ({event.registrations?.length || 0})
          </h3>
          {isOrganizer && (
            <button 
              onClick={handleRSVP}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold"
            >
              <UserPlus size={16} />
              RSVP Attendee
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {event.registrations?.map((reg: any) => (
                <tr key={reg.id}>
                  <td className="px-6 py-4 font-medium text-slate-900">{reg.fullName}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{reg.email}</td>
                </tr>
              ))}
              {(!event.registrations || event.registrations.length === 0) && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-slate-500 italic">No attendees registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
