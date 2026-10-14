import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  Moon,
  Sun,
  Smartphone,
  Bell,
  RefreshCw,
  Trash2,
  Info,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { UserProfile, AppTheme, SubgroupChoice } from '../../types/user';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onResetAllData: () => void;
  onOpenRoleChange: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onResetAllData,
  onOpenRoleChange,
}) => {
  const [notificationMsg, setNotificationMsg] = useState('');

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      setNotificationMsg('Уведомления не поддерживаются в этом браузере');
      return;
    }

    if (Notification.permission === 'granted') {
      onUpdateProfile({ notificationsEnabled: !profile.notificationsEnabled });
      setNotificationMsg(
        profile.notificationsEnabled
          ? 'Уведомления отключены'
          : 'Уведомления об изменениях включены'
      );
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        onUpdateProfile({ notificationsEnabled: true });
        setNotificationMsg('Уведомления успешно включены!');
      } else {
        setNotificationMsg('Разрешение на уведомления отклонено в настройках браузера');
      }
    }

    setTimeout(() => setNotificationMsg(''), 3000);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title */}
      <div className="pt-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Профиль и настройки
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Персонализация, уведомления и управление данными
        </p>
      </div>

      {/* User Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg shrink-0">
            {profile.role === 'student' ? (
              <GraduationCap className="w-7 h-7" />
            ) : (
              <Briefcase className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {profile.role === 'student'
                  ? `Группа ${profile.groupNumber}`
                  : profile.teacherFio || 'Преподаватель'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {profile.role === 'student' ? 'Студент' : 'Преподаватель'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {profile.role === 'student'
                ? `${profile.subgroup > 0 ? `${profile.subgroup}-я подгруппа · ` : 'Вся группа · '}${profile.facultyName || 'БГУИР'}`
                : profile.teacherDepartment || 'БГУИР'}
            </div>
          </div>
        </div>

        <button
          onClick={onOpenRoleChange}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition shrink-0"
        >
          Изменить
        </button>
      </div>

      {/* Student Subgroup Quick Selector */}
      {profile.role === 'student' && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Активная подгруппа
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 0 as SubgroupChoice, label: 'Вся группа' },
              { id: 1 as SubgroupChoice, label: '1 подгруппа' },
              { id: 2 as SubgroupChoice, label: '2 подгруппа' },
            ].map((sg) => (
              <button
                key={sg.id}
                onClick={() => onUpdateProfile({ subgroup: sg.id })}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                  profile.subgroup === sg.id
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {sg.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Theme Settings */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Тема оформления
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light' as AppTheme, label: 'Светлая', icon: Sun },
            { id: 'dark' as AppTheme, label: 'Тёмная', icon: Moon },
            { id: 'system' as AppTheme, label: 'Системная', icon: Smartphone },
          ].map((themeOpt) => {
            const Icon = themeOpt.icon;
            const isSelected = profile.theme === themeOpt.id;
            return (
              <button
                key={themeOpt.id}
                onClick={() => onUpdateProfile({ theme: themeOpt.id })}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{themeOpt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PWA Installation & Notifications */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Приложение и уведомления
        </label>

        {/* Notifications toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Уведомления об изменениях
              </div>
              <div className="text-xs text-slate-500">
                Предупреждать при смене аудиторий и времени
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`w-12 h-6.5 rounded-full transition-colors relative flex items-center px-1 ${
              profile.notificationsEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                profile.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {notificationMsg && (
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {notificationMsg}
          </p>
        )}

        {/* PWA Install Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <PWAInstallButton />
        </div>
      </div>

      {/* Reset & Cache Clear */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Хранилище
        </label>

        <button
          onClick={() => {
            if (confirm('Очистить сохранённое расписание и настройки и вернуться к выбору роли?')) {
              onResetAllData();
            }
          }}
          className="w-full p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100/60 transition flex items-center justify-center gap-2 text-sm font-semibold"
        >
          <Trash2 className="w-4 h-4" />
          <span>Сбросить локальные данные</span>
        </button>
      </div>

      {/* About Section */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-2.5 text-xs text-slate-500 leading-relaxed">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>О приложении BSUIR Hub</span>
        </div>
        <p>
          Версия <strong>1.0.0 (MVP)</strong>. BSUIR Hub — независимое студенческое приложение, созданное для удобного доступа к расписанию занятий, поиску преподавателей и координации консультаций.
        </p>
        <p>
          Приложение не является официальным представительством учреждения образования «Белорусский государственный университет информатики и радиоэлектроники». Данные расписания синхронизируются через открытый публичный API ИИС БГУИР.
        </p>
      </div>
    </div>
  );
};
