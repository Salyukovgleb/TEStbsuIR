import React, { useState } from 'react';
import { X, Clock, MapPin, User, Users, Calendar, Copy, Check, Sparkles, Building2 } from 'lucide-react';
import { ScheduleLesson, LessonEmployee } from '../../types/bsuir';
import { getLessonTypeMeta, parseAuditoryBuilding } from '../../utils/scheduleUtils';

interface LessonDetailModalProps {
  lesson: ScheduleLesson | null;
  dayName?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenTeacherProfile?: (teacher: LessonEmployee) => void;
  onFindFreeSlotsWithTeacher?: (teacher: LessonEmployee) => void;
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  lesson,
  dayName,
  isOpen,
  onClose,
  onOpenTeacherProfile,
  onFindFreeSlotsWithTeacher,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !lesson) return null;

  const typeMeta = getLessonTypeMeta(lesson.lessonTypeAbbrev);
  const rawAuditory = (lesson.auditories || []).join(', ');
  const location = parseAuditoryBuilding(rawAuditory);
  const weeksStr = (lesson.weekNumber || []).sort().join(', ');
  const primaryTeacher = lesson.employees?.[0];

  const handleCopy = () => {
    const text = [
      `📚 ${lesson.subjectFullName || lesson.subject} (${typeMeta.label})`,
      `⏰ ${lesson.startLessonTime} — ${lesson.endLessonTime}${dayName ? ` (${dayName})` : ''}`,
      `📍 ${location.room || 'Аудитория уточняется'}${location.address && location.address !== 'Минск' ? ` · ${location.building} (${location.address})` : ''}`,
      primaryTeacher ? `👨‍🏫 ${primaryTeacher.fio || primaryTeacher.lastName}` : '',
      lesson.numSubgroup > 0 ? `👥 ${lesson.numSubgroup}-я подгруппа` : '',
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#0f1422] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Mobile drag handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${typeMeta.bgLightClass} ${typeMeta.colorClass} ${typeMeta.borderClass}`}
              >
                {typeMeta.label}
              </span>
              {lesson.numSubgroup > 0 && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {lesson.numSubgroup} подгруппа
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {lesson.subjectFullName || lesson.subject}
            </h2>
            {lesson.subjectFullName && lesson.subject !== lesson.subjectFullName && (
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {lesson.subject}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
          {/* Time & Weeks */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0c101a] border border-slate-200/60 dark:border-slate-800/60">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs shrink-0">
              <Clock className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                {lesson.startLessonTime} — {lesson.endLessonTime}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {dayName ? `${dayName} · ` : ''}учебные недели: {weeksStr || 'Все'}
              </div>
            </div>
          </div>

          {/* Location / Campus Address */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0c101a] border border-slate-200/60 dark:border-slate-800/60">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
              <MapPin className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {location.room || 'Аудитория уточняется'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {location.building} · {location.address}
              </div>
            </div>
          </div>

          {/* Teacher(s) */}
          {lesson.employees && lesson.employees.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Преподаватель
              </div>
              {lesson.employees.map((teacher) => (
                <div
                  key={teacher.id || teacher.urlId}
                  className="p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-[#0f1422] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {teacher.firstName?.[0] || 'П'}{teacher.lastName?.[0] || ''}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {teacher.fio || `${teacher.lastName} ${teacher.firstName} ${teacher.middleName}`}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {teacher.degree || teacher.rank || 'Преподаватель кафедры'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onFindFreeSlotsWithTeacher && (
                      <button
                        onClick={() => {
                          onClose();
                          onFindFreeSlotsWithTeacher(teacher);
                        }}
                        className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition"
                        title="Найти свободное время"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onOpenTeacherProfile && teacher.urlId && (
                      <button
                        onClick={() => onOpenTeacherProfile(teacher)}
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                      >
                        Профиль
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 active:scale-97"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Скопировано в буфер</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Скопировать для чата</span>
                </>
              )}
            </button>

            {primaryTeacher && onFindFreeSlotsWithTeacher && (
              <button
                onClick={() => {
                  onClose();
                  onFindFreeSlotsWithTeacher(primaryTeacher);
                }}
                className="py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-xs active:scale-97"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Свободные окна</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
