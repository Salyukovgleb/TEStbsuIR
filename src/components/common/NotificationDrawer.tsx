import React from 'react';
import { X, Bell, CheckCheck, Clock, CalendarDays } from 'lucide-react';
import { ScheduleDiffItem } from '../../types/bsuir';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: ScheduleDiffItem[];
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Изменения в расписании
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Автоматическое отслеживание изменений
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <CheckCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                Изменений пока нет
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                BSUIR Hub автоматически уведомит вас при смене аудитории, времени или состава пар в расписании.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const date = new Date(item.timestamp);
              const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = date.toLocaleDateString([], { day: 'numeric', month: 'short' });

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <CalendarDays className="w-3.5 h-3.5 text-indigo-500" />
                      {item.day}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {dateStr}, {timeStr}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                    {item.message}
                  </p>
                  <div className="text-xs text-slate-500 font-medium">
                    {item.subject} · {item.lessonTime}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        {notifications.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              onClick={() => {
                onMarkAllRead();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm active:scale-98"
            >
              Отметить все прочитанными
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
