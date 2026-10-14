import React, { useState } from 'react';
import {
  Layers,
  Moon,
  Sun,
  Smartphone,
  Bell,
  Trash2,
  Info,
  ChevronRight,
  Plus,
  Calendar,
  Check,
} from 'lucide-react';
import { ScheduleSource, AppTheme } from '../../types/scheduleSource';
import { BrandWordmark } from '../common/BrandWordmark';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface FlowProfileViewProps {
  sources: ScheduleSource[];
  activeSourceId: string | 'combined';
  theme: AppTheme;
  notificationsEnabled: boolean;
  onUpdateTheme: (theme: AppTheme) => void;
  onToggleNotifications: () => void;
  onOpenScheduleSwitcher: () => void;
  onOpenAddSchedule: () => void;
  onResetAllData: () => void;
}

export const FlowProfileView: React.FC<FlowProfileViewProps> = ({
  sources,
  activeSourceId,
  theme,
  notificationsEnabled,
  onUpdateTheme,
  onToggleNotifications,
  onOpenScheduleSwitcher,
  onOpenAddSchedule,
  onResetAllData,
}) => {
  const [notificationMsg, setNotificationMsg] = useState('');

  const handleNotificationsClick = async () => {
    if (!('Notification' in window)) {
      setNotificationMsg('Уведомления не поддерживаются вашим браузером');
      setTimeout(() => setNotificationMsg(''), 3000);
      return;
    }

    if (Notification.permission === 'granted') {
      onToggleNotifications();
      setNotificationMsg(notificationsEnabled ? 'Уведомления отключены' : 'Уведомления включены');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onToggleNotifications();
        setNotificationMsg('Разрешение на уведомления получено');
      } else {
        setNotificationMsg('Разрешение отклонено в браузере');
      }
    }
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Title */}
      <div className="pt-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Профиль
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Управление расписаниями и настройками
        </p>
      </div>

      {/* Primary Card: "Мои расписания" (Section 21) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Мои расписания
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Всего источников: {sources.length}
            </p>
          </div>
          <button
            onClick={onOpenScheduleSwitcher}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition active:scale-95"
          >
            Управлять
          </button>
        </div>

        {/* Small preview list of sources */}
        <div className="space-y-1.5">
          {sources.map((s) => (
            <div
              key={s.id}
              onClick={onOpenScheduleSwitcher}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.colorMarker }} />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {s.displayName}
                </span>
                {s.isPrimary && (
                  <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded">
                    Основное
                  </span>
                )}
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </div>
          ))}
        </div>

        <button
          onClick={onOpenAddSchedule}
          className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5 transition active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить ещё одно расписание</span>
        </button>
      </div>

      {/* Theme Settings */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Тема оформления
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light' as AppTheme, label: 'Светлая', icon: Sun },
            { id: 'dark' as AppTheme, label: 'Тёмная', icon: Moon },
            { id: 'system' as AppTheme, label: 'Системная', icon: Smartphone },
          ].map((themeOpt) => {
            const Icon = themeOpt.icon;
            const isSelected = theme === themeOpt.id;
            return (
              <button
                key={themeOpt.id}
                onClick={() => onUpdateTheme(themeOpt.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4.5 h-4.5 mb-1" />
                <span className="text-xs">{themeOpt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications & PWA */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Приложение и уведомления
        </label>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Оповещения об изменениях
              </div>
              <div className="text-[11px] text-slate-400">
                Смена аудиторий, времени и состава пар
              </div>
            </div>
          </div>

          <button
            onClick={handleNotificationsClick}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
              notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {notificationMsg && (
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
            {notificationMsg}
          </p>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <PWAInstallButton />
        </div>
      </div>

      {/* Reset Cache & Storage */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
          Данные и хранилище
        </label>
        <button
          onClick={() => {
            if (confirm('Сбросить все сохранённые расписания и настройки BSUIR Flow?')) {
              onResetAllData();
            }
          }}
          className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100/60 transition flex items-center justify-center gap-2 text-xs font-bold"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Сбросить данные приложения</span>
        </button>
      </div>

      {/* About BSUIR Flow (Section 1 & 21) */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-3 text-xs text-slate-500 leading-relaxed">
        <BrandWordmark size="md" showSlogan={true} />

        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-[11px]">
          <p>
            Версия <strong>2.0.0 (Flow Edition)</strong>
          </p>
          <p>
            BSUIR Flow — независимое университетское приложение. Принцип: один человек — несколько расписаний — единое удобное пространство.
          </p>
          <p>
            Данные синхронизируются через открытый публичный API ИИС БГУИР. Приложение не представляет официальную администрацию университета.
          </p>
        </div>
      </div>
    </div>
  );
};
