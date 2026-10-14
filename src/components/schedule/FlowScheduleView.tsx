import React, { useState, useMemo } from 'react';
import {
  Calendar,
  RefreshCw,
  Filter,
  ChevronDown,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { ScheduleSource, NormalizedCombinedLesson } from '../../types/scheduleSource';
import { FullScheduleResponse, ScheduleLesson, LessonEmployee } from '../../types/bsuir';
import { CombinedScheduleService } from '../../services/combinedScheduleService';
import { LessonCard } from './LessonCard';
import { ExamsList } from './ExamsList';
import {
  BSUIR_WEEKDAYS,
  getTodayWeekdayName,
  getWeekDates,
  filterLessons,
  sortLessonsChronologically,
} from '../../utils/scheduleUtils';

interface FlowScheduleViewProps {
  activeSource: ScheduleSource | null;
  isCombined: boolean;
  combinedSources: ScheduleSource[];
  schedulesMap: Map<string, FullScheduleResponse>;
  currentWeek: number;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenScheduleSwitcher: () => void;
  onSelectLesson: (lesson: ScheduleLesson | NormalizedCombinedLesson, day: string) => void;
  onOpenTeacher?: (teacher: LessonEmployee) => void;
}

type ViewMode = 'day' | 'week' | 'exams';

export const FlowScheduleView: React.FC<FlowScheduleViewProps> = ({
  activeSource,
  isCombined,
  combinedSources,
  schedulesMap,
  currentWeek,
  isLoading,
  onRefresh,
  onOpenScheduleSwitcher,
  onSelectLesson,
  onOpenTeacher,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek || 3);
  const [subgroupFilter, setSubgroupFilter] = useState<0 | 1 | 2>(
    activeSource?.provider === 'bsuir_group' ? activeSource.subgroup : 0
  );
  const [lessonTypeFilter, setLessonTypeFilter] = useState<string>('all');
  const [filterSources, setFilterSources] = useState<string[]>([]); // in combined mode

  const todayWeekday = getTodayWeekdayName();
  const [selectedDay, setSelectedDay] = useState<string>(
    BSUIR_WEEKDAYS.includes(todayWeekday as any) ? todayWeekday : 'Понедельник'
  );

  // Auto sync week
  React.useEffect(() => {
    if (currentWeek && !selectedWeek) {
      setSelectedWeek(currentWeek);
    }
  }, [currentWeek]);

  // Compute calendar dates for selected academic week
  const weekOffset = selectedWeek - (currentWeek || 3);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Effective sources to show
  const effectiveSources = useMemo(() => {
    if (isCombined) {
      if (filterSources.length > 0) {
        return combinedSources.filter((s) => filterSources.includes(s.id));
      }
      return combinedSources;
    }
    return activeSource ? [activeSource] : [];
  }, [isCombined, combinedSources, filterSources, activeSource]);

  // Merge day lessons
  const { lessons: currentDayLessons, conflicts: currentDayConflicts } = useMemo(() => {
    if (effectiveSources.length === 0) return { lessons: [], conflicts: [] };

    const res = CombinedScheduleService.mergeDay(
      effectiveSources,
      schedulesMap,
      selectedDay,
      selectedWeek
    );

    // Apply client filters if single source
    let filtered = res.lessons;
    if (!isCombined && activeSource?.provider === 'bsuir_group' && subgroupFilter > 0) {
      filtered = filtered.filter((l) => l.numSubgroup === 0 || l.numSubgroup === subgroupFilter);
    }
    if (lessonTypeFilter !== 'all') {
      filtered = filtered.filter((l) => {
        const t = (l.lessonTypeAbbrev || '').toUpperCase();
        if (lessonTypeFilter === 'lecture') return t.includes('ЛК');
        if (lessonTypeFilter === 'practice') return t.includes('ПЗ');
        if (lessonTypeFilter === 'lab') return t.includes('ЛР');
        return true;
      });
    }

    return { lessons: filtered, conflicts: res.conflicts };
  }, [effectiveSources, schedulesMap, selectedDay, selectedWeek, isCombined, activeSource, subgroupFilter, lessonTypeFilter]);

  // Week Mode data
  const weekDaysData = useMemo(() => {
    if (effectiveSources.length === 0) return [];

    return BSUIR_WEEKDAYS.map((dayName) => {
      const res = CombinedScheduleService.mergeDay(
        effectiveSources,
        schedulesMap,
        dayName,
        selectedWeek
      );

      let filtered = res.lessons;
      if (!isCombined && activeSource?.provider === 'bsuir_group' && subgroupFilter > 0) {
        filtered = filtered.filter((l) => l.numSubgroup === 0 || l.numSubgroup === subgroupFilter);
      }
      if (lessonTypeFilter !== 'all') {
        filtered = filtered.filter((l) => {
          const t = (l.lessonTypeAbbrev || '').toUpperCase();
          if (lessonTypeFilter === 'lecture') return t.includes('ЛК');
          if (lessonTypeFilter === 'practice') return t.includes('ПЗ');
          if (lessonTypeFilter === 'lab') return t.includes('ЛР');
          return true;
        });
      }

      return {
        dayName,
        lessons: filtered,
        conflicts: res.conflicts,
        isToday: dayName === todayWeekday,
      };
    });
  }, [effectiveSources, schedulesMap, selectedWeek, isCombined, activeSource, subgroupFilter, lessonTypeFilter, todayWeekday]);

  // Exams collection
  const allExams = useMemo(() => {
    const list: ScheduleLesson[] = [];
    effectiveSources.forEach((s) => {
      const sched = schedulesMap.get(s.id);
      if (sched?.exams) {
        list.push(...sched.exams);
      }
    });
    return list;
  }, [effectiveSources, schedulesMap]);

  const activeTitle = isCombined
    ? `Вместе (${combinedSources.length})`
    : activeSource
    ? activeSource.displayName
    : 'Расписание';

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header: Schedule Switcher Trigger & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <button
            onClick={onOpenScheduleSwitcher}
            className="flex items-center gap-1.5 font-black text-xl text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition group text-left"
          >
            {isCombined ? (
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 shrink-0" />
            ) : activeSource ? (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeSource.colorMarker }}
              />
            ) : null}
            <span className="truncate max-w-[220px]">{activeTitle}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform" />
          </button>
          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span>{isCombined ? 'Объединённый режим' : 'Семестровое расписание'}</span>
            <button
              onClick={onRefresh}
              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition"
              title="Обновить"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl shrink-0 self-start sm:self-auto border border-slate-200/50 dark:border-slate-800/50">
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
                ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Экзамены {allExams.length > 0 && `(${allExams.length})`}
          </button>
        </div>
      </div>

      {/* Week Selector Bar (1, 2, 3, 4) */}
      {viewMode !== 'exams' && (
        <div className="flex items-center justify-between gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
          <span className="text-xs font-bold text-slate-500 pl-2">
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
                  className={`relative px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{w}</span>
                  {isCurrent && (
                    <span
                      className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-amber-300 ring-1 ring-indigo-600' : 'bg-indigo-600'
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

      {/* Contextual Filters: Subgroup / Type / Sources */}
      {viewMode !== 'exams' && (
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
          {/* Subgroups (if group source) */}
          {!isCombined && activeSource?.provider === 'bsuir_group' && (
            <div className="flex items-center gap-1 shrink-0 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
              {[
                { id: 0 as const, label: 'Все' },
                { id: 1 as const, label: '1 п.' },
                { id: 2 as const, label: '2 п.' },
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
          )}

          {/* Sources Filter (if combined mode) */}
          {isCombined && (
            <div className="flex items-center gap-1 shrink-0 overflow-x-auto">
              {combinedSources.map((s) => {
                const isActive = filterSources.length === 0 || filterSources.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (filterSources.includes(s.id)) {
                        setFilterSources(filterSources.filter((id) => id !== s.id));
                      } else {
                        setFilterSources([...filterSources, s.id]);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.colorMarker }} />
                    <span>{s.displayName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Lesson Types */}
          <div className="flex items-center gap-1 shrink-0 p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl ml-auto">
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
        <div className="space-y-4">
          {/* Calendar Carousel */}
          <div className="grid grid-cols-6 gap-1.5 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-xs">
            {weekDates.map((item) => {
              const isSelected = selectedDay === item.weekdayName;
              return (
                <button
                  key={item.weekdayName}
                  onClick={() => setSelectedDay(item.weekdayName)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold shadow-sm'
                      : item.isToday
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {item.shortLabel}
                  </span>
                  <span className="text-sm font-black mt-0.5 tabular-nums">
                    {item.dayNumber}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Day Header & Conflict warning if any */}
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{selectedDay}</span>
              {selectedDay === todayWeekday && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  Сегодня
                </span>
              )}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {currentDayLessons.length} {currentDayLessons.length === 1 ? 'пара' : currentDayLessons.length < 5 ? 'пары' : 'пар'}
            </span>
          </div>

          {/* Conflict banner */}
          {currentDayConflicts.length > 0 && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-800 dark:text-rose-200">
              <span className="font-bold">Пересечение расписаний в этот день ({currentDayConflicts[0].timeRange})</span>
            </div>
          )}

          {/* Day Lessons List */}
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
              <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            </div>
          ) : currentDayLessons.length === 0 ? (
            <div className="py-14 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Занятий нет
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                В этот день пары отсутствуют по расписанию для {selectedWeek}-й недели.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentDayLessons.map((lesson) => (
                <LessonCard
                  key={lesson.lessonId}
                  lesson={lesson as any}
                  onClick={() => onSelectLesson(lesson, selectedDay)}
                  onOpenTeacher={onOpenTeacher}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Week View */}
      {viewMode === 'week' && (
        <div className="space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
              <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
            </div>
          ) : (
            weekDaysData.map((dayItem) => (
              <div key={dayItem.dayName} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{dayItem.dayName}</span>
                    {dayItem.isToday && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        Сегодня
                      </span>
                    )}
                    {dayItem.conflicts.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                        Конфликт
                      </span>
                    )}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {dayItem.lessons.length > 0 ? `${dayItem.lessons.length} пар` : 'Нет пар'}
                  </span>
                </div>

                {dayItem.lessons.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 text-[11px] text-slate-400 text-center">
                    Свободный день
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayItem.lessons.map((lesson) => (
                      <LessonCard
                        key={lesson.lessonId}
                        lesson={lesson as any}
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
          exams={allExams}
          onSelectLesson={(lesson) => onSelectLesson(lesson, 'Экзамен')}
          onOpenTeacher={onOpenTeacher}
        />
      )}
    </div>
  );
};
