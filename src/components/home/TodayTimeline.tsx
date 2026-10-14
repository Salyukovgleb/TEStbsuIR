import React from 'react';
import { Clock, MapPin, User, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { ScheduleLesson, LessonEmployee } from '../../types/bsuir';
import { getLessonStatus, getLessonTypeMeta, getCurrentTimeMinutes, parseAuditoryBuilding } from '../../utils/scheduleUtils';

interface TodayTimelineProps {
  lessons: ScheduleLesson[];
  onSelectLesson: (lesson: ScheduleLesson) => void;
  onOpenTeacher?: (teacher: LessonEmployee) => void;
}

export const TodayTimeline: React.FC<TodayTimelineProps> = ({
  lessons,
  onSelectLesson,
  onOpenTeacher,
}) => {
  const currentMinutes = getCurrentTimeMinutes();

  if (lessons.length === 0) {
    return (
      <div className="py-10 px-6 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/60 dark:border-slate-800/60 text-center shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-2.5">
          <Sparkles className="w-4.5 h-4.5 stroke-[1.8]" />
        </div>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
          На сегодня пар нет
        </p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          Свободный день по текущему расписанию
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-2.5">
      {lessons.map((lesson, idx) => {
        const status = getLessonStatus(lesson, true, currentMinutes);
        const typeMeta = getLessonTypeMeta(lesson.lessonTypeAbbrev);
        const teacher = lesson.employees?.[0];
        const rawAuditory = (lesson.auditories || []).join(', ');
        const location = parseAuditoryBuilding(rawAuditory);

        return (
          <div
            key={idx}
            onClick={() => onSelectLesson(lesson)}
            className={`group relative p-3.5 sm:p-4 rounded-2xl border transition-all duration-150 cursor-pointer flex items-start gap-3 select-none active:scale-[0.99] ${
              status.isOngoing
                ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800/80 shadow-xs ring-1 ring-indigo-500/10'
                : status.isCompleted
                ? 'bg-slate-50/50 dark:bg-[#0c101a]/50 border-slate-200/40 dark:border-slate-800/40 opacity-55'
                : 'bg-white dark:bg-[#0f1422] border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
            }`}
          >
            {/* Left time slot */}
            <div className="flex flex-col items-center shrink-0 w-12 pt-0.5 text-center">
              <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {lesson.startLessonTime}
              </span>
              <span className="text-[10px] text-slate-400 font-medium tabular-nums mt-0.5">
                {lesson.endLessonTime}
              </span>
              {status.isCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-2" />
              )}
              {status.isOngoing && (
                <span className="relative flex h-2 w-2 mt-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600 dark:bg-indigo-400" />
                </span>
              )}
            </div>

            {/* Vertical timeline divider line */}
            <div className="w-px self-stretch bg-slate-200/70 dark:bg-slate-800/70 shrink-0 my-0.5" />

            {/* Lesson details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${typeMeta.bgLightClass} ${typeMeta.colorClass} border ${typeMeta.borderClass}`}
                >
                  {typeMeta.label}
                </span>
                {lesson.numSubgroup > 0 && (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {lesson.numSubgroup} п/г
                  </span>
                )}
                {status.isOngoing && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider ml-auto">
                    Идёт пара
                  </span>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {lesson.subjectFullName || lesson.subject}
              </h4>

              <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 shrink-0 font-medium text-slate-700 dark:text-slate-300">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">
                    {location.room || 'Без ауд.'}
                  </span>
                </div>
                {teacher && (
                  <div
                    onClick={(e) => {
                      if (onOpenTeacher) {
                        e.stopPropagation();
                        onOpenTeacher(teacher);
                      }
                    }}
                    className="flex items-center gap-1 truncate hover:underline hover:text-slate-900 dark:hover:text-white ml-auto"
                  >
                    <User className="w-3 h-3 shrink-0 text-slate-400" />
                    <span className="truncate">{teacher.fio || teacher.lastName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
