import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Calendar, MapPin, Users, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface EventDetailViewProps {
  eventId: string;
  onBack: () => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ eventId, onBack }) => {
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-4xl font-black text-slate-900 mb-6">{event.title}</h1>

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
    </div>
  );
};
