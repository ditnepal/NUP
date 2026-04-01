import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Bell, CheckCircle, Clock, Trash2, Mail, Info, AlertTriangle, X } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`, {});
      setNotifications(notifications?.map(n => n.id === id ? { ...n, status: 'READ' } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-emerald-600 transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">Notifications</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {notifications?.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-gray-50 transition-colors group ${
                        notification.status === 'UNREAD' ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`mt-1 p-2 rounded-lg ${
                          notification.type === 'ALERT' ? 'bg-red-50 text-red-600' :
                          notification.type === 'SUCCESS' ? 'bg-green-50 text-green-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {notification.type === 'ALERT' ? <AlertTriangle size={16} /> :
                           notification.type === 'SUCCESS' ? <CheckCircle size={16} /> :
                           <Info size={16} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm font-bold ${
                              notification.status === 'UNREAD' ? 'text-gray-900' : 'text-gray-600'
                            }`}>
                              {notification.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {notification.status === 'UNREAD' && (
                              <button 
                                onClick={() => markAsRead(notification.id)}
                                className="text-[10px] font-bold text-emerald-600 hover:underline"
                              >
                                Mark as read
                              </button>
                            )}
                            <button 
                              onClick={() => deleteNotification(notification.id)}
                              className="text-[10px] font-bold text-red-400 hover:underline flex items-center gap-1"
                            >
                              <Trash2 size={10} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <Bell size={32} className="text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-900">All caught up!</p>
                  <p className="text-xs text-gray-500 mt-1">You have no new notifications.</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
              <button className="text-xs font-bold text-emerald-600 hover:underline">
                View All Notifications
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
