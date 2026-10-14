import React from 'react';
import { Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { ScheduleLesson, LessonEmployee } from '../../types/bsuir';
import { getLessonTypeMeta, parseAuditoryBuilding } from '../../utils/scheduleUtils';

interface LessonCardProps {
  lesson: ScheduleLesson;
  onClick: () => void;
  onOpenTeacher?: (teacher: LessonEmployee) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onClick,
  onOpenTeacher,
}) => {
  const typeMeta = getLessonTypeMeta(lesson.lessonTypeAbbrev);
  const teacher = lesson.employees?.[0];
  const rawAuditory = (lesson.auditories || []).join(', ');
  const location = parseAuditoryBuilding(rawAuditory);
  const weeksStr = (lesson.weekNumber || []).sort().join(', ');

  return (
    <div
      onClick={onClick}
      className="group relative p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-sm transition cursor-pointer select-none active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeMeta.bgLightClass} ${typeMeta.colorClass} ${typeMeta.borderClass}`}
          >
            {typeMeta.label}
          </span>
          {lesson.numSubgroup > 0 && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {lesson.numSubgroup} п/г
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white tabular-nums bg-slate-50 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{lesson.startLessonTime} — {lesson.endLessonTime}</span>
        </div>
      </div>

      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
        {lesson.subjectFullName || lesson.subject}
      </h4>

      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate max-w-[150px] sm:max-w-[220px]">
            {location.room || 'Без ауд.'}
          </span>
        </div>

        {teacher ? (
          <div
            onClick={(e) => {
              if (onOpenTeacher) {
                e.stopPropagation();
                onOpenTeacher(teacher);
              }
            }}
            className="flex items-center gap-1 truncate font-medium hover:underline hover:text-slate-900 dark:hover:text-white ml-auto"
          >
            <User className="w-3 h-3 shrink-0 text-slate-400" />
            <span className="truncate">{teacher.fio || teacher.lastName}</span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
          </div>
        ) : (
          <span className="text-[10px] text-slate-400">
            {weeksStr ? `${weeksStr} нед.` : ''}
          </span>
        )}
      </div>
    </div>
  );
};
