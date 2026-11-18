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
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-[var(--radius-button)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-error)] rounded-full ring-2 ring-[var(--color-surface)]" />
        )}
      </button>

      {open && (
        <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-[68px] sm:top-auto sm:mt-2 sm:w-96 bg-[var(--color-surface)] rounded-[var(--radius-modal)] shadow-[var(--shadow-overlay)] border border-[var(--color-border)] py-2 z-50 overflow-hidden font-sans">
          <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-sans font-semibold text-sm text-[var(--color-text-primary)]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-md text-xs font-medium tabular-nums leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--color-border)]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-[var(--color-text-secondary)]">
                No notifications right now.
              </div>
            ) : (
              notifications.map((notif) => {
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full p-3.5 hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer text-left flex items-start gap-3 ${
                      !notif.read ? 'bg-[var(--color-bg-app)]' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5 text-[var(--color-text-secondary)]">
                      {notif.type === 'shortlist_ready' ? (
                        <Sparkles className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                      ) : notif.type === 'professional_selected' ? (
                        <Award className="w-3.5 h-3.5 text-[var(--color-success)]" />
                      ) : (
                        <Bell className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-[13px] truncate ${!notif.read ? 'font-semibold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]'}`}>
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <span className="text-xs text-[var(--color-text-muted)] tabular-nums mt-1 block">
                        {new Date(notif.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
