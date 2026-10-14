import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Search,
  Sparkles,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Coffee,
  Layers,
} from 'lucide-react';
import { BrandWordmark } from '../common/BrandWordmark';
import { ScheduleSource, NormalizedCombinedLesson, CombinedConflict } from '../../types/scheduleSource';
import { FullScheduleResponse, ScheduleLesson, LessonEmployee } from '../../types/bsuir';
import { CombinedScheduleService } from '../../services/combinedScheduleService';
import {
  getTodayWeekdayName,
  getLessonStatus,
  getLessonTypeMeta,
  getWeekDates,
  parseTimeToMinutes,
  getCurrentTimeMinutes,
} from '../../utils/scheduleUtils';

interface FlowHomeProps {
  activeSource: ScheduleSource | null;
  isCombined: boolean;
  combinedSources: ScheduleSource[];
  schedulesMap: Map<string, FullScheduleResponse>;
  currentWeek: number;
  isLoading: boolean;
  onOpenScheduleSwitcher: () => void;
  onOpenScheduleTab: () => void;
  onOpenSearchTab: () => void;
  onOpenFreeSlots: () => void;
  onSelectLesson: (lesson: ScheduleLesson | NormalizedCombinedLesson) => void;
  onOpenTeacherProfile?: (teacher: LessonEmployee) => void;
}

export const FlowHome: React.FC<FlowHomeProps> = ({
  activeSource,
  isCombined,
  combinedSources,
  schedulesMap,
  currentWeek,
  isLoading,
  onOpenScheduleSwitcher,
  onOpenScheduleTab,
  onOpenSearchTab,
  onOpenFreeSlots,
  onSelectLesson,
  onOpenTeacherProfile,
}) => {
  const todayDate = new Date();
  const todayFormatted = todayDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
  const todayWeekday = getTodayWeekdayName(todayDate);
  const [selectedDayName, setSelectedDayName] = useState<string>(todayWeekday);

  const weekDates = useMemo(() => getWeekDates(0), []);

  // Compute today's lessons & conflicts
  const { lessons, conflicts } = useMemo(() => {
    const sourcesToUse = isCombined ? combinedSources : activeSource ? [activeSource] : [];
    if (sourcesToUse.length === 0) {
      return { lessons: [], conflicts: [] };
    }
    const result = CombinedScheduleService.mergeDay(
      sourcesToUse,
      schedulesMap,
      selectedDayName,
      currentWeek
    );
    return { lessons: result.lessons, conflicts: result.conflicts };
  }, [isCombined, combinedSources, activeSource, schedulesMap, selectedDayName, currentWeek]);

  // Gaps between lessons
  const gaps = useMemo(() => CombinedScheduleService.calculateGaps(lessons), [lessons]);

  // Determine current or next upcoming lesson
  const currentMinutes = getCurrentTimeMinutes();
  const isSelectedDayToday = selectedDayName === todayWeekday;

  const nextOrOngoingLesson = useMemo(() => {
    if (!isSelectedDayToday || lessons.length === 0) {
      return lessons[0] || null;
    }
    for (const l of lessons) {
      const status = getLessonStatus(l as any, true, currentMinutes);
      if (status.isOngoing || status.isUpcoming) {
        return l;
      }
    }
    return null;
  }, [lessons, isSelectedDayToday, currentMinutes]);

  const ongoingOrUpcomingStatus = useMemo(() => {
    if (!nextOrOngoingLesson || !isSelectedDayToday) return null;
    return getLessonStatus(nextOrOngoingLesson as any, true, currentMinutes);
  }, [nextOrOngoingLesson, isSelectedDayToday, currentMinutes]);

  const activeTitle = isCombined
    ? `Вместе (${combinedSources.length})`
    : activeSource
    ? activeSource.displayName
    : 'Выберите расписание';

  return (
    <div className="space-y-5 pb-24">
      {/* Top Bar Context & Schedule Switcher Trigger */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <div className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Сегодня, {todayFormatted}
          </div>
          <button
            onClick={onOpenScheduleSwitcher}
            className="flex items-center gap-1.5 font-extrabold text-lg text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition active:scale-95 group text-left"
          >
            {isCombined ? (
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 shrink-0" />
            ) : activeSource ? (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeSource.colorMarker }}
              />
            ) : null}
            <span className="truncate max-w-[200px]">{activeTitle}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform" />
          </button>
        </div>

        {/* Current Week Badge */}
        <div className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
          {currentWeek} нед.
        </div>
      </div>

      {/* Mini Horizontal Week Calendar Scroller */}
      <div className="grid grid-cols-6 gap-1 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
        {weekDates.map((item) => {
          const isSelected = selectedDayName === item.weekdayName;
          return (
            <button
              key={item.weekdayName}
              onClick={() => setSelectedDayName(item.weekdayName)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition ${
                isSelected
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold shadow-sm'
                  : item.isToday
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
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

      {/* Hero Next/Current Lesson Card */}
      <div>
        {isLoading ? (
          <div className="h-40 w-full rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse border border-slate-200/60 dark:border-slate-800/60" />
        ) : !nextOrOngoingLesson ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 text-center shadow-xs">
            <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              {isSelectedDayToday ? 'На сегодня всё' : 'В этот день свободно'}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isSelectedDayToday
                ? 'Все занятия на сегодня завершены. Отдыхайте!'
                : `Пар по расписанию на ${selectedDayName} нет.`}
            </p>
          </div>
        ) : (
          (() => {
            const l = nextOrOngoingLesson;
            const typeMeta = getLessonTypeMeta(l.lessonTypeAbbrev);
            const isOngoing = ongoingOrUpcomingStatus?.isOngoing;
            const auditories = (l.auditories || []).join(', ');
            const teacher = l.employees?.[0];

            return (
              <div
                onClick={() => onSelectLesson(l)}
                className={`relative w-full rounded-2xl p-5 border transition-all cursor-pointer shadow-xs select-none overflow-hidden ${
                  isOngoing
                    ? 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Thin top colored progress bar if ongoing */}
                {isOngoing && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${ongoingOrUpcomingStatus?.progressPercent || 0}%` }}
                    />
                  </div>
                )}

                {/* Top strip */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${typeMeta.bgLightClass} ${typeMeta.colorClass} ${typeMeta.borderClass}`}
                    >
                      {typeMeta.label}
                    </span>

                    {/* Source tag if combined */}
                    {isCombined && (
                      <span
                        className="text-[10px] font-extrabold px-1.5 py-0.5 rounded text-white"
                        style={{ backgroundColor: l.sourceColor }}
                      >
                        {l.sourceName}
                      </span>
                    )}

                    {l.numSubgroup > 0 && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {l.numSubgroup} п.
                      </span>
                    )}
                  </div>

                  {/* Status countdown or time pill */}
                  <div className="flex items-center gap-1.5 text-xs font-bold tabular-nums">
                    {isOngoing ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Осталось {ongoingOrUpcomingStatus?.minutesLeft} мин
                      </span>
                    ) : ongoingOrUpcomingStatus?.startsInMinutes !== undefined &&
                      ongoingOrUpcomingStatus.startsInMinutes <= 90 ? (
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        Через {ongoingOrUpcomingStatus.startsInMinutes} мин
                      </span>
                    ) : (
                      <span className="text-slate-500 font-bold">
                        {l.startLessonTime} — {l.endLessonTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Subject Name */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {l.subjectFullName || l.subject}
                </h3>

                {/* Bottom line: Room and teacher */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{auditories || 'Без аудитории'}</span>
                  </div>

                  {teacher ? (
                    <div className="flex items-center gap-1 truncate text-slate-600 dark:text-slate-400 ml-auto">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{teacher.fio || teacher.lastName}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Conflicts Alert Box in Combined Mode */}
      {conflicts.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Обнаружены пересечения занятий:</span>
          </div>
          {conflicts.map((c) => (
            <div key={c.id} className="pl-6 text-[11px] space-y-0.5">
              <span className="font-extrabold">{c.timeRange}:</span>
              {c.sources.map((s, idx) => (
                <div key={idx} className="opacity-90">
                  • [{s.sourceName}] {s.subject} ({s.lessonType}) — {s.room || 'без ауд.'}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Two Compact Quick Actions (Section 13) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenSearchTab}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition flex items-center gap-2.5 active:scale-97 text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Найти преподавателя
            </div>
            <div className="text-[10px] text-slate-400">
              Поиск по кафедрам
            </div>
          </div>
        </button>

        <button
          onClick={onOpenFreeSlots}
          className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-xs transition flex items-center gap-2.5 active:scale-97 text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Свободное время
            </div>
            <div className="text-[10px] text-slate-400">
              Окна для консультации
            </div>
          </div>
        </button>
      </div>

      {/* Today Timeline List */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <span>{selectedDayName}</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {lessons.length}
            </span>
          </h2>
          <button
            onClick={onOpenScheduleTab}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            <span>Вся неделя →</span>
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-400">
            В этот день занятий нет
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, idx) => {
              const status = getLessonStatus(lesson as any, isSelectedDayToday, currentMinutes);
              const typeMeta = getLessonTypeMeta(lesson.lessonTypeAbbrev);
              const teacher = lesson.employees?.[0];
              const auditories = (lesson.auditories || []).join(', ');
              const gapAfter = gaps.get(idx);

              return (
                <React.Fragment key={lesson.lessonId}>
                  <div
                    onClick={() => onSelectLesson(lesson)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                      lesson.hasConflict
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                        : status.isOngoing
                        ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : status.isCompleted
                        ? 'border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 opacity-60'
                        : 'border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Time */}
                    <div className="w-12 shrink-0 pt-0.5">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {lesson.startLessonTime}
                      </div>
                      <div className="text-[10px] text-slate-400 tabular-nums">
                        {lesson.endLessonTime}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${typeMeta.bgLightClass} ${typeMeta.colorClass} ${typeMeta.borderClass}`}
                        >
                          {typeMeta.label}
                        </span>

                        {isCombined && (
                          <span
                            className="text-[9px] font-extrabold px-1.5 py-0.2 rounded text-white"
                            style={{ backgroundColor: lesson.sourceColor }}
                          >
                            {lesson.sourceName}
                          </span>
                        )}

                        {lesson.numSubgroup > 0 && (
                          <span className="text-[10px] text-slate-400">
                            {lesson.numSubgroup} подгр.
                          </span>
                        )}

                        {lesson.hasConflict && (
                          <span className="text-[9px] font-extrabold text-rose-600 bg-rose-100 dark:bg-rose-950 px-1 rounded ml-auto">
                            Конфликт
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                        {lesson.subjectFullName || lesson.subject}
                      </h4>

                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {auditories || 'Без ауд.'}
                        </span>
                        {teacher && (
                          <span className="truncate">
                            {teacher.fio || teacher.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Window / Break pill */}
                  {gapAfter && (
                    <div className="py-1 px-3 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      <Coffee className="w-3 h-3" />
                      <span>Окно · {Math.floor(gapAfter / 60) > 0 ? `${Math.floor(gapAfter / 60)} ч ` : ''}{gapAfter % 60 > 0 ? `${gapAfter % 60} мин` : ''}</span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
