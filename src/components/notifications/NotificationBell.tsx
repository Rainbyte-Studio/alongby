import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { InAppNotification } from '../../types';
import {
  Bell,
  Check,
  CheckCircle2,
  Sparkles,
  Award,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const list = await notificationService.getUserNotifications(currentUser.uid);
      setNotifications(list);
    } catch (err) {
      console.warn('Could not load notifications:', err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (!notif.read) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await notificationService.markAllAsRead(currentUser.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  if (!currentUser) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 overflow-hidden font-sans">
          <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-medium text-sm text-neutral-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-neutral-900 text-white rounded-full text-[10px] font-mono">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => {
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 hover:bg-neutral-50 transition-colors cursor-pointer text-left flex items-start gap-3 ${
                      !notif.read ? 'bg-stone-50/60' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-stone-700">
                      {notif.type === 'shortlist_ready' ? (
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      ) : notif.type === 'professional_selected' ? (
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Bell className="w-3.5 h-3.5 text-stone-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-xs truncate ${!notif.read ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}>
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
