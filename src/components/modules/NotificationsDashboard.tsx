import React, { useState } from 'react';
import { 
  Bell, 
  Info, 
  Trash2, 
  Check, 
  Search,
  Clock,
  Package,
  Factory,
  DollarSign,
  User as UserIcon
} from 'lucide-react';

interface NotificationsDashboardProps {
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  isAdmin: boolean;
}

const NotificationsDashboard: React.FC<NotificationsDashboardProps> = ({ notifications, setNotifications, isAdmin }) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'inventory' | 'production' | 'user' | 'sales'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' || (filter === 'unread' ? !n.read : n.type === filter);
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'inventory': return <Package className="w-5 h-5 text-blue-500" />;
      case 'production': return <Factory className="w-5 h-5 text-purple-500" />;
      case 'user': return <UserIcon className="w-5 h-5 text-green-500" />;
      case 'sales': return <DollarSign className="w-5 h-5 text-pink-500" />;
      case 'message': return <Bell className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="w-7 h-7 text-indigo-600" />
            System Notifications
          </h1>
          <p className="text-gray-500">Track all system activities and user interactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllAsRead}
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
          {isAdmin && (
            <button 
              onClick={clearAll}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-full md:w-80 shadow-sm">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              className="outline-none text-sm w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {(['all', 'unread', 'inventory', 'production', 'user', 'sales'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  filter === t 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 transition-colors flex gap-4 ${notification.read ? 'bg-white' : 'bg-indigo-50/30'}`}
              >
                <div className="mt-1 flex-shrink-0">
                  <div className={`p-2 rounded-lg ${notification.read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                    {getIcon(notification.type)}
                  </div>
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-indigo-900'}`}>
                        {notification.title}
                        {!notification.read && <span className="ml-2 inline-block w-2 h-2 bg-indigo-500 rounded-full"></span>}
                      </h3>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-3">
                    {!notification.read && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        Mark as read
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notification.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No notifications found</h3>
              <p className="text-gray-500 mt-1">When system activities occur, they will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDashboard;
