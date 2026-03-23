import React, { useState, useEffect } from 'react';
import { AppEvent } from '../types';

export const AppEventsAdmin: React.FC = () => {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<AppEvent>>({ title: '', description: '', audience: 'PUBLIC', status: 'DRAFT', eventDate: new Date(), startAt: '09:00', location: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch('/api/v1/app-events', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { setEvents(data); setLoading(false); });
  };

  const handleCreate = () => {
    fetch('/api/v1/app-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(newEvent)
    }).then(() => { setShowForm(false); fetchEvents(); });
  };

  const handleToggle = (id: string, updates: Partial<AppEvent>) => {
    fetch(`/api/v1/app-events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(updates)
    }).then(() => fetchEvents());
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Events Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded">Create Event</button>
      </div>
      
      {showForm && (
        <div className="bg-white p-4 mb-4 border rounded">
          <input placeholder="Title" className="border p-2 w-full mb-2" onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
          <input placeholder="Summary" className="border p-2 w-full mb-2" onChange={e => setNewEvent({...newEvent, summary: e.target.value})} />
          <textarea placeholder="Description" className="border p-2 w-full mb-2" onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
          <input placeholder="Location" className="border p-2 w-full mb-2" onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
          <input placeholder="Cover Image URL" className="border p-2 w-full mb-2" onChange={e => setNewEvent({...newEvent, coverImageUrl: e.target.value})} />
          <input placeholder="Attachment URL" className="border p-2 w-full mb-2" onChange={e => setNewEvent({...newEvent, attachmentUrl: e.target.value})} />
          <input type="date" className="border p-2 w-full mb-2" onChange={e => setNewEvent({...newEvent, eventDate: new Date(e.target.value)})} />
          <input type="time" className="border p-2 w-full mb-2" onChange={e => setNewEvent({...newEvent, startAt: e.target.value})} />
          <select className="border p-2 w-full mb-2" onChange={e => setNewEvent({...newEvent, audience: e.target.value as 'PUBLIC' | 'MEMBERS'})}>
            <option value="PUBLIC">PUBLIC</option>
            <option value="MEMBERS">MEMBERS</option>
          </select>
          <button onClick={handleCreate} className="bg-emerald-600 text-white px-4 py-2 rounded">Save</button>
        </div>
      )}

      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Title</th>
            <th className="py-2">Status</th>
            <th className="py-2">Audience</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id}>
              <td className="py-2">{event.title}</td>
              <td className="py-2">{event.status}</td>
              <td className="py-2">{event.audience}</td>
              <td className="py-2">
                <button onClick={() => handleToggle(event.id, { status: event.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })} className="text-emerald-600 mr-2">
                  {event.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => handleToggle(event.id, { isPinned: !event.isPinned })} className="text-emerald-600">
                  {event.isPinned ? 'Unpin' : 'Pin'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
