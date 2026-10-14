import React, { useState, useEffect, useMemo } from 'react';
import { X, Star, Calendar, Sparkles, BookOpen, Users, Clock, MapPin, ChevronRight } from 'lucide-react';
import { EmployeeSummary, FullScheduleResponse, ScheduleLesson } from '../../types/bsuir';
import { ApiService } from '../../services/api';
import { LessonCard } from '../schedule/LessonCard';
import { getTodayWeekdayName, filterLessons, sortLessonsChronologically } from '../../utils/scheduleUtils';

interface TeacherProfileModalProps {
  teacher: EmployeeSummary | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenFreeSlots: (teacher: EmployeeSummary) => void;
  onSelectLesson: (lesson: ScheduleLesson) => void;
  currentWeek: number;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  teacher,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenFreeSlots,
  onSelectLesson,
  currentWeek,
}) => {
  const [schedule, setSchedule] = useState<FullScheduleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'schedule' | 'subjects' | 'groups'>('schedule');

  useEffect(() => {
    if (isOpen && teacher?.urlId) {
      setIsLoading(true);
      ApiService.fetchTeacherSchedule(teacher.urlId, false)
        .then((res) => setSchedule(res.data))
        .catch((err) => {
          console.warn('Error fetching teacher schedule:', err);
          setSchedule(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, teacher]);

  const todayWeekday = getTodayWeekdayName();

  // Extract taught subjects and groups from schedule
  const { taughtSubjects, taughtGroups, allLessons } = useMemo(() => {
    if (!schedule?.schedules) {
      return { taughtSubjects: [], taughtGroups: [], allLessons: [] };
    }
    const subjectsMap = new Map<string, string>();
    const groupsSet = new Set<string>();
    const lessonsList: ScheduleLesson[] = [];

    Object.values(schedule.schedules).forEach((dayLessons) => {
      dayLessons.forEach((l) => {
        lessonsList.push(l);
        if (l.subject) {
          subjectsMap.set(l.subject, l.subjectFullName || l.subject);
        }
        (l.studentGroups || []).forEach((g) => {
          if (g.name) groupsSet.add(g.name);
        });
      });
    });

    return {
      taughtSubjects: Array.from(subjectsMap.entries()).map(([short, full]) => ({ short, full })),
      taughtGroups: Array.from(groupsSet).sort(),
      allLessons: lessonsList,
    };
  }, [schedule]);

  // Today lessons for teacher
  const todayLessons = useMemo(() => {
    if (!schedule?.schedules) return [];
    const dayRaw = schedule.schedules[todayWeekday] || [];
    const filtered = filterLessons(dayRaw, currentWeek, 0, 'all');
    return sortLessonsChronologically(filtered);
  }, [schedule, todayWeekday, currentWeek]);

  if (!isOpen || !teacher) return null;

  const department = (teacher.academicDepartment || []).join(', ') || 'БГУИР';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-250">
        {/* Top bar with close & favorite */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Профиль преподавателя
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onToggleFavorite}
              className={`p-2 rounded-xl transition active:scale-90 ${
                isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Header Hero */}
        <div className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-100 to-blue-100 dark:from-indigo-950 dark:to-blue-950 text-indigo-600 dark:text-indigo-400 font-extrabold text-xl flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60 overflow-hidden shadow-sm">
              {teacher.photoLink ? (
                <img
                  src={teacher.photoLink}
                  alt={teacher.fio}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : null}
              <span>{teacher.lastName?.[0] || 'П'}{teacher.firstName?.[0] || ''}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {teacher.fio || `${teacher.lastName} ${teacher.firstName} ${teacher.middleName}`}
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                {department}
              </p>
              {teacher.degree && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                  {teacher.degree} {teacher.rank ? `· ${teacher.rank}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Action Button: "Когда можно встретиться?" */}
          <button
            onClick={() => onOpenFreeSlots(teacher)}
            className="mt-5 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Когда можно встретиться?</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 flex gap-2 border-b border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-2.5 font-bold transition border-b-2 ${
              activeTab === 'schedule'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Расписание
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`pb-2.5 font-bold transition border-b-2 ${
              activeTab === 'subjects'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Дисциплины ({taughtSubjects.length})
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`pb-2.5 font-bold transition border-b-2 ${
              activeTab === 'groups'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Группы ({taughtGroups.length})
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3 py-6">
              <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            </div>
          ) : activeTab === 'schedule' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Занятия на сегодня ({todayWeekday})
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {currentWeek}-я неделя
                </span>
              </div>

              {todayLessons.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-500 text-center">
                  Сегодня у преподавателя нет занятий по расписанию
                </div>
              ) : (
                <div className="space-y-2">
                  {todayLessons.map((l, idx) => (
                    <LessonCard
                      key={idx}
                      lesson={l}
                      onClick={() => onSelectLesson(l)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'subjects' ? (
            <div className="space-y-2">
              {taughtSubjects.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Список дисциплин недоступен
                </p>
              ) : (
                taughtSubjects.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 flex items-center gap-3"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {sub.full}
                      </div>
                      {sub.full !== sub.short && (
                        <div className="text-xs text-slate-400">
                          {sub.short}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {taughtGroups.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Список групп недоступен
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {taughtGroups.map((grp) => (
                    <div
                      key={grp}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-center font-bold text-sm text-slate-800 dark:text-slate-200"
                    >
                      {grp}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
