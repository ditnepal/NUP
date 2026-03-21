import React from 'react';
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react';
import { Event } from '../../types';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
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
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">{event.title}</h3>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={14} />
            {new Date(event.startDate).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={14} />
            {event.location}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users size={14} />
            {event._count.registrations} Registered
          </div>
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
          <span className="text-xs font-bold text-emerald-600">Manage Event</span>
          <ExternalLink size={14} className="text-slate-400" />
        </div>
      </div>
    </div>
  );
};
