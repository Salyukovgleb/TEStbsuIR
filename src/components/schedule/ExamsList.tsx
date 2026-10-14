import React from 'react';
import { Award, Clock, MapPin, User, Calendar } from 'lucide-react';
import { ScheduleLesson, LessonEmployee } from '../../types/bsuir';
import { getLessonTypeMeta } from '../../utils/scheduleUtils';

interface ExamsListProps {
  exams: ScheduleLesson[];
  onSelectLesson: (lesson: ScheduleLesson) => void;
  onOpenTeacher?: (teacher: LessonEmployee) => void;
}

export const ExamsList: React.FC<ExamsListProps> = ({
  exams,
  onSelectLesson,
  onOpenTeacher,
}) => {
  if (exams.length === 0) {
    return (
      <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto mb-3">
          <Award className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Экзамены ещё не назначены
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Расписание сессии обычно публикуется деканатом ближе к началу зачётно-экзаменационной сессии.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {exams.map((exam, idx) => {
        const typeMeta = getLessonTypeMeta(exam.lessonTypeAbbrev || 'Экзамен');
        const teacher = exam.employees?.[0];
        const auditories = (exam.auditories || []).join(', ');

        return (
          <div
            key={idx}
            onClick={() => onSelectLesson(exam)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition cursor-pointer select-none space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${typeMeta.bgLightClass} ${typeMeta.colorClass} ${typeMeta.borderClass}`}
              >
                {typeMeta.label}
              </span>

              {exam.dateLesson && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{exam.dateLesson}</span>
                </div>
              )}
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {exam.subjectFullName || exam.subject}
            </h4>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {exam.startLessonTime || 'Время уточняется'}
                  {exam.endLessonTime ? ` — ${exam.endLessonTime}` : ''}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {auditories || 'Ауд. не указана'}
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
                  className="col-span-2 flex items-center gap-1.5 hover:underline text-slate-700 dark:text-slate-300 font-medium"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{teacher.fio || teacher.lastName}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
