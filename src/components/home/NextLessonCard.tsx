import React from 'react';
import { Clock, MapPin, User, ChevronRight, Moon, Building2 } from 'lucide-react';
import { ScheduleLesson, LessonEmployee } from '../../types/bsuir';
import { getLessonTypeMeta, getCurrentTimeMinutes, parseTimeToMinutes, parseAuditoryBuilding } from '../../utils/scheduleUtils';

interface NextLessonCardProps {
  lesson: ScheduleLesson | null;
  dayName: string;
  statusText: string;
  isToday: boolean;
  startsInMinutes?: number;
  onClick: () => void;
  onOpenTeacher?: (teacher: LessonEmployee) => void;
}

export const NextLessonCard: React.FC<NextLessonCardProps> = ({
  lesson,
  dayName,
  statusText,
  isToday,
  onClick,
  onOpenTeacher,
}) => {
  if (!lesson) {
    return (
      <div className="w-full rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/60 dark:border-slate-800/60 p-6 text-center shadow-xs transition-colors">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <Moon className="w-5 h-5 stroke-[1.8]" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Пар больше нет
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
          {statusText || 'Все занятия на сегодня завершены. Отличное время для отдыха или курсового проекта!'}
        </p>
      </div>
    );
  }

  const typeMeta = getLessonTypeMeta(lesson.lessonTypeAbbrev);
  const teacher = lesson.employees?.[0];
  const rawAuditory = (lesson.auditories || []).join(', ');
  const location = parseAuditoryBuilding(rawAuditory);

  const isOngoing = statusText.includes('Сейчас идёт');

  // Compute live progress percentage if ongoing
  let progressPercent = 0;
  let remainingMinutes = 0;
  if (isOngoing && lesson.startLessonTime && lesson.endLessonTime) {
    const cur = getCurrentTimeMinutes();
    const start = parseTimeToMinutes(lesson.startLessonTime);
    const end = parseTimeToMinutes(lesson.endLessonTime);
    if (end > start) {
      progressPercent = Math.min(100, Math.max(0, Math.round(((cur - start) / (end - start)) * 100)));
      remainingMinutes = Math.max(0, end - cur);
    }
  }

  return (
    <div
      onClick={onClick}
      className={`group relative w-full rounded-2xl p-5 sm:p-5.5 cursor-pointer transition-all duration-200 overflow-hidden select-none active:scale-[0.99] ${
        isOngoing
          ? 'bg-gradient-to-br from-indigo-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/15 ring-1 ring-white/10'
          : 'bg-white dark:bg-[#0f1422] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Dynamic progress bar at top for ongoing pair */}
      {isOngoing && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
          <div
            className="h-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Top badges bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              isOngoing
                ? 'bg-white/20 text-white backdrop-blur-sm'
                : `${typeMeta.bgLightClass} ${typeMeta.colorClass} border ${typeMeta.borderClass}`
            }`}
          >
            {typeMeta.label}
          </span>
          {lesson.numSubgroup > 0 && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                isOngoing
                  ? 'bg-white/15 text-indigo-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              {lesson.numSubgroup} п/г
            </span>
          )}
        </div>

        {/* Live status badge */}
        <div
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
            isOngoing
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
          }`}
        >
          {isOngoing ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Осталось {remainingMinutes} мин</span>
            </>
          ) : (
            <span>{statusText}</span>
          )}
        </div>
      </div>

      {/* Discipline Name */}
      <h3
        className={`text-base sm:text-lg font-bold tracking-tight leading-snug line-clamp-2 ${
          isOngoing ? 'text-white' : 'text-slate-900 dark:text-white'
        }`}
      >
        {lesson.subjectFullName || lesson.subject}
      </h3>

      {/* Info strip */}
      <div
        className={`mt-4 pt-3 border-t grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs ${
          isOngoing ? 'border-white/15' : 'border-slate-100 dark:border-slate-800/60'
        }`}
      >
        {/* Time */}
        <div
          className={`flex items-center gap-1.5 ${
            isOngoing ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0 opacity-75" />
          <span className="font-semibold tabular-nums">
            {lesson.startLessonTime} — {lesson.endLessonTime}
          </span>
          {!isToday && <span className="opacity-75">({dayName})</span>}
        </div>

        {/* Auditory & Campus */}
        <div
          className={`flex items-center gap-1.5 ${
            isOngoing ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-400'
          }`}
          title={location.address}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0 opacity-75" />
          <span className="font-semibold truncate">
            {location.room || 'Аудитория уточняется'}
            {location.address && location.address !== 'Минск' && !location.isRemote && (
              <span className="opacity-75 font-normal ml-1">· {location.address}</span>
            )}
          </span>
        </div>

        {/* Teacher */}
        {teacher && (
          <div
            onClick={(e) => {
              if (onOpenTeacher) {
                e.stopPropagation();
                onOpenTeacher(teacher);
              }
            }}
            className={`flex items-center gap-1.5 col-span-1 sm:col-span-2 pt-0.5 transition hover:underline ${
              isOngoing ? 'text-white font-medium' : 'text-slate-700 dark:text-slate-300 font-medium'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0 opacity-75" />
            <span className="truncate">
              {teacher.fio || `${teacher.lastName} ${teacher.firstName} ${teacher.middleName}`}
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60 ml-auto group-hover:translate-x-0.5 transition-transform" />
          </div>
        )}
      </div>
    </div>
  );
};
