import React from 'react';
import { Bell, WifiOff, Sparkles } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface HeaderProps {
  currentWeek?: number;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentWeek = 3,
  unreadCount = 0,
  onOpenNotifications,
  subtitle,
}) => {
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-600/20 text-white font-black text-xs tracking-tight">
            BH
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              BSUIR Hub
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-100/60 dark:border-indigo-900/40">
              {currentWeek} нед.
            </span>
          </div>
        </div>

        {/* Center / Context label if present */}
        {subtitle && (
          <div className="hidden sm:block text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
            {subtitle}
          </div>
        )}

        {/* Right Zone: Offline & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <WifiOff className="w-3 h-3" />
              <span>Офлайн</span>
            </div>
          )}

          <div className="hidden sm:block">
            <PWAInstallButton compact />
          </div>

          <button
            onClick={onOpenNotifications}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition active:scale-90"
            aria-label="Уведомления об изменениях"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-extrabold text-white bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-in zoom-in">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
