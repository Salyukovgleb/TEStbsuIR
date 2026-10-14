import React, { useMemo } from 'react';
import { Calendar, Search, Sparkles, Award, ChevronRight } from 'lucide-react';
import { FullScheduleResponse, ScheduleLesson, LessonEmployee } from '../../types/bsuir';
import { SubgroupChoice } from '../../types/user';
import { NextLessonCard } from './NextLessonCard';
import { TodayTimeline } from './TodayTimeline';
import {
  getTodayWeekdayName,
  getNextOrCurrentLesson,
  filterLessons,
  sortLessonsChronologically,
  getWeekDates,
  calculateDayDensity,
} from '../../utils/scheduleUtils';

interface StudentHomeProps {
  groupNumber: string;
  subgroup: SubgroupChoice;
  facultyName?: string;
  schedule: FullScheduleResponse | null;
  currentWeek: number;
  isLoading: boolean;
  onOpenSchedule: () => void;
  onOpenSearch: () => void;
  onOpenFreeSlots: () => void;
  onSelectLesson: (lesson: ScheduleLesson) => void;
  onOpenTeacherProfile: (teacher: LessonEmployee) => void;
  onOpenExams: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({
  groupNumber,
  subgroup,
  facultyName,
  schedule,
  currentWeek,
  isLoading,
  onOpenSchedule,
  onOpenSearch,
  onOpenFreeSlots,
  onSelectLesson,
  onOpenTeacherProfile,
  onOpenExams,
}) => {
  const todayDate = new Date();
  const todayFormatted = todayDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formattedDateCapitalized =
    todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const todayWeekday = getTodayWeekdayName(todayDate);
  const weekDates = useMemo(() => getWeekDates(0), []);

  // Day workload density dots
  const dayDensity = useMemo(() => {
    return calculateDayDensity(schedule?.schedules, currentWeek, subgroup);
  }, [schedule, currentWeek, subgroup]);

  // Today lessons
  const todayLessons = useMemo(() => {
    if (!schedule?.schedules) return [];
    const raw = schedule.schedules[todayWeekday] || [];
    const filtered = filterLessons(raw, currentWeek, subgroup, 'all');
    return sortLessonsChronologically(filtered);
  }, [schedule, todayWeekday, currentWeek, subgroup]);

  // Next or current lesson
  const nextLessonInfo = useMemo(() => {
    if (!schedule?.schedules) {
      return {
        lesson: null,
        day: todayWeekday,
        statusText: 'Загрузка расписания...',
        isToday: true,
      };
    }
    return getNextOrCurrentLesson(schedule.schedules, currentWeek, subgroup);
  }, [schedule, currentWeek, subgroup, todayWeekday]);

  const examsCount = schedule?.exams?.length || 0;

  return (
    <div className="space-y-5 pb-24">
      {/* Top Bar: Minimalist Greeting & Group Pill */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Привет! 👋
          </h1>
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
            {formattedDateCapitalized}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white shadow-xs">
            {groupNumber} {subgroup > 0 ? `· ${subgroup} п/г` : ''}
          </div>
          {facultyName && (
            <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:block">
              {facultyName}
            </div>
          )}
        </div>
      </div>

      {/* Week Day Carousel with Density Dots */}
      <div className="grid grid-cols-6 gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
        {weekDates.map((item) => {
          const count = dayDensity[item.weekdayName] || 0;
          return (
            <button
              key={item.weekdayName}
              onClick={onOpenSchedule}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition active:scale-95 ${
                item.isToday
                  ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                {item.shortLabel}
              </span>
              <span className="text-xs font-extrabold mt-0.5 tabular-nums">
                {item.dayNumber}
              </span>
              {/* Density dots */}
              <div className="flex items-center gap-0.5 h-1.5 mt-1">
                {count > 0 ? (
                  Array.from({ length: Math.min(3, count) }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        item.isToday ? 'bg-white' : 'bg-indigo-500/70 dark:bg-indigo-400/70'
                      }`}
                    />
                  ))
                ) : (
                  <span className="w-1 h-1 rounded-full opacity-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hero Next/Current Lesson Card */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {nextLessonInfo.statusText.includes('Сейчас идёт')
              ? 'Текущая пара'
              : 'Ближайшая пара'}
          </h2>
        </div>

        {isLoading ? (
          <div className="h-40 w-full rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200/50 dark:border-slate-800/50" />
        ) : (
          <NextLessonCard
            lesson={nextLessonInfo.lesson}
            dayName={nextLessonInfo.day}
            statusText={nextLessonInfo.statusText}
            isToday={nextLessonInfo.isToday}
            onClick={() => nextLessonInfo.lesson && onSelectLesson(nextLessonInfo.lesson)}
            onOpenTeacher={onOpenTeacherProfile}
          />
        )}
      </div>

      {/* Minimalist Bento Quick Access */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <button
          onClick={onOpenSchedule}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition flex flex-col items-start gap-2.5 active:scale-97 text-left group"
        >
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 transition-colors">
            <Calendar className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Расписание
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {todayLessons.length} {todayLessons.length === 1 ? 'пара' : todayLessons.length > 4 ? 'пар' : 'пары'} сегодня
            </div>
          </div>
        </button>

        <button
          onClick={onOpenSearch}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition flex flex-col items-start gap-2.5 active:scale-97 text-left group"
        >
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 transition-colors">
            <Search className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Поиск
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Преподаватели и группы
            </div>
          </div>
        </button>

        <button
          onClick={onOpenFreeSlots}
          className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 hover:border-indigo-300 dark:hover:border-indigo-800 shadow-xs transition flex flex-col items-start gap-2.5 active:scale-97 text-left group"
        >
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Свободные окна
            </div>
            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
              Встреча с лектором
            </div>
          </div>
        </button>
      </div>

      {/* Block: "Сегодня" */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Расписание на сегодня</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {todayLessons.length}
            </span>
          </h2>
          <button
            onClick={onOpenSchedule}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            <span>Вся неделя</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
          </div>
        ) : (
          <TodayTimeline
            lessons={todayLessons}
            onSelectLesson={onSelectLesson}
            onOpenTeacher={onOpenTeacherProfile}
          />
        )}
      </div>

      {/* Upcoming Exams compact banner if any exist */}
      {examsCount > 0 && (
        <div
          onClick={onOpenExams}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer flex items-center justify-between shadow-xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <Award className="w-4.5 h-4.5 stroke-[2]" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Сессия и экзамены
              </div>
              <div className="text-[11px] text-slate-400">
                Запланировано событий: {examsCount}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      )}
    </div>
  );
};
