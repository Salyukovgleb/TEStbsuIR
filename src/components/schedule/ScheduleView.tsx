import React, { useState, useMemo } from 'react';
import { Calendar, RefreshCw, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { FullScheduleResponse, ScheduleLesson, LessonEmployee } from '../../types/bsuir';
import { SubgroupChoice } from '../../types/user';
import { LessonCard } from './LessonCard';
import { ExamsList } from './ExamsList';
import {
  BSUIR_WEEKDAYS,
  getTodayWeekdayName,
  filterLessons,
  sortLessonsChronologically,
  getWeekDates,
  calculateDayDensity,
  getCurrentTimeMinutes,
  parseTimeToMinutes,
} from '../../utils/scheduleUtils';

import { FavoriteItem } from '../../types/user';

interface ScheduleViewProps {
  schedule: FullScheduleResponse | null;
  targetTitle: string;
  currentWeek: number;
  userSubgroup: SubgroupChoice;
  isLoading: boolean;
  favorites?: FavoriteItem[];
  isViewingForeign?: boolean;
  onRefresh?: () => void;
  onSelectLesson: (lesson: ScheduleLesson, day: string) => void;
  onOpenTeacher?: (teacher: LessonEmployee) => void;
  onSelectFavorite?: (fav: FavoriteItem) => void;
  onResetToMySchedule?: () => void;
}

type ViewMode = 'day' | 'week' | 'exams';

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  schedule,
  targetTitle,
  currentWeek,
  userSubgroup,
  isLoading,
  favorites = [],
  isViewingForeign = false,
  onRefresh,
  onSelectLesson,
  onOpenTeacher,
  onSelectFavorite,
  onResetToMySchedule,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek || 3);
  const [subgroupFilter, setSubgroupFilter] = useState<SubgroupChoice>(userSubgroup);
  const [lessonTypeFilter, setLessonTypeFilter] = useState<string>('all');

  const todayWeekday = getTodayWeekdayName();
  const [selectedDay, setSelectedDay] = useState<string>(
    BSUIR_WEEKDAYS.includes(todayWeekday as any) ? todayWeekday : 'Понедельник'
  );

  // Compute calendar dates for the selected academic week
  const weekOffset = selectedWeek - (currentWeek || 3);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Day workload density dots
  const dayDensity = useMemo(() => {
    return calculateDayDensity(schedule?.schedules, selectedWeek, subgroupFilter);
  }, [schedule, selectedWeek, subgroupFilter]);

  // Sync selectedWeek if currentWeek loads
  React.useEffect(() => {
    if (currentWeek && !selectedWeek) {
      setSelectedWeek(currentWeek);
    }
  }, [currentWeek]);

  // Lessons for selected day
  const currentDayLessons = useMemo(() => {
    if (!schedule?.schedules) return [];
    const dayRaw = schedule.schedules[selectedDay] || [];
    const filtered = filterLessons(dayRaw, selectedWeek, subgroupFilter, lessonTypeFilter);
    return sortLessonsChronologically(filtered);
  }, [schedule, selectedDay, selectedWeek, subgroupFilter, lessonTypeFilter]);

  // Lessons for week view
  const weekDaysData = useMemo(() => {
    if (!schedule?.schedules) return [];
    return BSUIR_WEEKDAYS.map((dayName) => {
      const dayRaw = schedule.schedules[dayName] || [];
      const filtered = filterLessons(dayRaw, selectedWeek, subgroupFilter, lessonTypeFilter);
      return {
        dayName,
        lessons: sortLessonsChronologically(filtered),
        isToday: dayName === todayWeekday,
      };
    });
  }, [schedule, selectedWeek, subgroupFilter, lessonTypeFilter, todayWeekday]);

  const exams = schedule?.exams || [];

  // Next / Previous day handler
  const handlePrevDay = () => {
    const currentIndex = BSUIR_WEEKDAYS.indexOf(selectedDay as any);
    if (currentIndex > 0) {
      setSelectedDay(BSUIR_WEEKDAYS[currentIndex - 1]);
    } else {
      setSelectedDay(BSUIR_WEEKDAYS[BSUIR_WEEKDAYS.length - 1]);
    }
  };

  const handleNextDay = () => {
    const currentIndex = BSUIR_WEEKDAYS.indexOf(selectedDay as any);
    if (currentIndex < BSUIR_WEEKDAYS.length - 1) {
      setSelectedDay(BSUIR_WEEKDAYS[currentIndex + 1]);
    } else {
      setSelectedDay(BSUIR_WEEKDAYS[0]);
    }
  };

  const currentMinutes = getCurrentTimeMinutes();
  const isTodaySelected = selectedDay === todayWeekday && selectedWeek === currentWeek;

  return (
    <div className="space-y-4 pb-24">
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {targetTitle}
            </h1>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90"
                title="Обновить расписание"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Семестровое расписание занятий
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-[#0f1422] rounded-2xl shrink-0 self-start sm:self-auto border border-slate-200/60 dark:border-slate-800/60">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'day'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            День
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'week'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Неделя
          </button>
          <button
            onClick={() => setViewMode('exams')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              viewMode === 'exams'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Экзамены {exams.length > 0 && `(${exams.length})`}
          </button>
        </div>
      </div>

      {/* Quick Pinned / Favorites Bar */}
      {favorites.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          <button
            onClick={onResetToMySchedule}
            className={`px-2.5 py-1 rounded-xl font-bold transition shrink-0 active:scale-95 text-[11px] flex items-center gap-1 ${
              !isViewingForeign
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <span>Моё расписание</span>
          </button>
          {favorites.map((fav) => {
            const isActive = isViewingForeign && targetTitle.includes(fav.title);
            return (
              <button
                key={`${fav.type}-${fav.id}`}
                onClick={() => onSelectFavorite && onSelectFavorite(fav)}
                className={`px-2.5 py-1 rounded-xl font-medium transition shrink-0 active:scale-95 text-[11px] flex items-center gap-1 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'bg-white dark:bg-[#0f1422] border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span className="text-amber-500 font-bold">★</span>
                <span className="truncate max-w-[120px]">{fav.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Week Selector Bar */}
      {viewMode !== 'exams' && (
        <div className="flex items-center justify-between gap-2 p-1.5 bg-white dark:bg-[#0f1422] rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 pl-2">
            Неделя:
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((w) => {
              const isSelected = selectedWeek === w;
              const isCurrent = currentWeek === w;
              return (
                <button
                  key={w}
                  onClick={() => setSelectedWeek(w)}
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{w}</span>
                  {isCurrent && (
                    <span
                      className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-amber-300 ring-1 ring-indigo-600' : 'bg-indigo-600 dark:bg-indigo-400'
                      }`}
                      title="Текущая учебная неделя"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Row: Subgroup & Lesson Type */}
      {viewMode !== 'exams' && (
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 text-xs">
          {/* Subgroups */}
          <div className="flex items-center gap-1 shrink-0 p-0.5 bg-slate-100 dark:bg-[#0f1422] rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            {[
              { id: 0 as SubgroupChoice, label: 'Все' },
              { id: 1 as SubgroupChoice, label: '1 п/г' },
              { id: 2 as SubgroupChoice, label: '2 п/г' },
            ].map((sg) => (
              <button
                key={sg.id}
                onClick={() => setSubgroupFilter(sg.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  subgroupFilter === sg.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {sg.label}
              </button>
            ))}
          </div>

          {/* Lesson Types */}
          <div className="flex items-center gap-1 shrink-0 p-0.5 bg-slate-100 dark:bg-[#0f1422] rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            {[
              { id: 'all', label: 'Все' },
              { id: 'lecture', label: 'Лекции' },
              { id: 'practice', label: 'Практ.' },
              { id: 'lab', label: 'Лабы' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setLessonTypeFilter(t.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  lessonTypeFilter === t.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode 1: Day View */}
      {viewMode === 'day' && (
        <div className="space-y-3.5">
          {/* Calendar Carousel with actual dates and density dots */}
          <div className="grid grid-cols-6 gap-1.5 p-1 bg-white dark:bg-[#0f1422] rounded-2xl border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
            {weekDates.map((item) => {
              const isSelected = selectedDay === item.weekdayName;
              const count = dayDensity[item.weekdayName] || 0;

              return (
                <button
                  key={item.weekdayName}
                  onClick={() => setSelectedDay(item.weekdayName)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition active:scale-95 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/25'
                      : item.isToday
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-900/60'
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
                            isSelected ? 'bg-white' : 'bg-indigo-500/70 dark:bg-indigo-400/70'
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

          {/* Current Day Header with Prev/Next Controls */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevDay}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90"
                title="Предыдущий день"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{selectedDay}</span>
                {selectedDay === todayWeekday && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    Сегодня
                  </span>
                )}
              </h3>

              <button
                onClick={handleNextDay}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition active:scale-90"
                title="Следующий день"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedDay !== todayWeekday && (
                <button
                  onClick={() => setSelectedDay(todayWeekday)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-1.5 py-0.5"
                >
                  К сегодняшнему
                </button>
              )}
              <span className="text-xs text-slate-400 font-medium">
                {currentDayLessons.length} {currentDayLessons.length === 1 ? 'пара' : currentDayLessons.length < 5 ? 'пары' : 'пар'}
              </span>
            </div>
          </div>

          {/* Day Lessons List */}
          {isLoading ? (
            <div className="space-y-2.5">
              <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
              <div className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            </div>
          ) : currentDayLessons.length === 0 ? (
            <div className="py-12 text-center bg-white dark:bg-[#0f1422] rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                <Calendar className="w-5 h-5 stroke-[1.8]" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Занятий нет
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
                В этот день пары отсутствуют по расписанию для {selectedWeek}-й недели.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentDayLessons.map((lesson, idx) => {
                // If it's today, check if current time line should be displayed before this lesson
                const startM = parseTimeToMinutes(lesson.startLessonTime);
                const prevLesson = idx > 0 ? currentDayLessons[idx - 1] : null;
                const prevEndM = prevLesson ? parseTimeToMinutes(prevLesson.endLessonTime) : 0;
                const showCurrentTimeMarker =
                  isTodaySelected &&
                  currentMinutes < startM &&
                  (idx === 0 || currentMinutes >= prevEndM);

                return (
                  <React.Fragment key={idx}>
                    {showCurrentTimeMarker && (
                      <div className="flex items-center gap-2 py-1 px-1">
                        <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Сейчас ({Math.floor(currentMinutes / 60)}:{(currentMinutes % 60).toString().padStart(2, '0')})
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/50 to-transparent" />
                      </div>
                    )}
                    <LessonCard
                      lesson={lesson}
                      onClick={() => onSelectLesson(lesson, selectedDay)}
                      onOpenTeacher={onOpenTeacher}
                    />
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Week View */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
              <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            </div>
          ) : (
            weekDaysData.map((dayItem) => (
              <div key={dayItem.dayName} className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{dayItem.dayName}</span>
                    {dayItem.isToday && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        Сегодня
                      </span>
                    )}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {dayItem.lessons.length > 0 ? `${dayItem.lessons.length} пар(ы)` : 'Нет пар'}
                  </span>
                </div>

                {dayItem.lessons.length === 0 ? (
                  <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-[#0c101a]/70 border border-slate-200/40 dark:border-slate-800/40 text-[11px] text-slate-400 text-center">
                    Свободный день
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayItem.lessons.map((lesson, idx) => (
                      <LessonCard
                        key={idx}
                        lesson={lesson}
                        onClick={() => onSelectLesson(lesson, dayItem.dayName)}
                        onOpenTeacher={onOpenTeacher}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Mode 3: Exams View */}
      {viewMode === 'exams' && (
        <ExamsList
          exams={exams}
          onSelectLesson={(lesson) => onSelectLesson(lesson, 'Экзамен')}
          onOpenTeacher={onOpenTeacher}
        />
      )}
    </div>
  );
};
