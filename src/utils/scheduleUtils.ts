import { ScheduleLesson, WeekScheduleMap } from '../types/bsuir';

export const BSUIR_WEEKDAYS = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
] as const;

export const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export function getMinskDate(): Date {
  // Use current local or Intl format to get Minsk calendar date
  return new Date();
}

export function getTodayWeekdayName(date: Date = new Date()): string {
  const day = date.getDay();
  switch (day) {
    case 1:
      return 'Понедельник';
    case 2:
      return 'Вторник';
    case 3:
      return 'Среда';
    case 4:
      return 'Четверг';
    case 5:
      return 'Пятница';
    case 6:
      return 'Суббота';
    default:
      return 'Воскресенье';
  }
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Resolves BSUIR campus auditory string into building number and physical street address.
 * E.g., '412-4к' -> building: '4 корпус', address: 'ул. Гикало, 9'
 */
export interface AuditoryLocation {
  room: string;
  building: string;
  address: string;
  isRemote: boolean;
  isSport: boolean;
}

export function parseAuditoryBuilding(auditoryStr: string): AuditoryLocation {
  if (!auditoryStr) {
    return { room: '', building: '', address: '', isRemote: false, isSport: false };
  }

  const lower = auditoryStr.toLowerCase().trim();

  if (lower.includes('дист') || lower.includes('teams') || lower.includes('zoom') || lower.includes('online')) {
    return { room: auditoryStr, building: 'Дистанционно', address: 'Онлайн', isRemote: true, isSport: false };
  }

  if (lower.includes('с/з') || lower.includes('спорт') || lower.includes('стадион')) {
    return { room: auditoryStr, building: 'Спорткомплекс', address: 'ул. Б. Хмельницкого, 9', isRemote: false, isSport: true };
  }

  // Common pattern: 412-4к, 203-1 к., 301-2, 501-5к, 701-7к
  const match = lower.match(/([0-9а-яa-z]+)\s*[-/]\s*([0-9])\s*к?/i);
  if (match) {
    const room = match[1];
    const bNum = match[2];

    const addressMap: Record<string, string> = {
      '1': 'ул. П. Бровки, 6',
      '2': 'ул. П. Бровки, 4',
      '3': 'ул. П. Бровки, 10',
      '4': 'ул. Гикало, 9',
      '5': 'ул. Платонова, 39',
      '6': 'ул. П. Бровки, 4',
      '7': 'ул. Козлова, 28',
      '8': 'ул. Скорины, 8',
    };

    return {
      room: `${room} (${bNum}к)`,
      building: `${bNum} корпус`,
      address: addressMap[bNum] || `Корпус ${bNum}`,
      isRemote: false,
      isSport: false,
    };
  }

  return {
    room: auditoryStr,
    building: 'БГУИР',
    address: 'Минск',
    isRemote: false,
    isSport: false,
  };
}

export function getCurrentTimeMinutes(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}

export interface LessonStatusInfo {
  statusText: string;
  isOngoing: boolean;
  isUpcoming: boolean;
  isCompleted: boolean;
  startsInMinutes?: number;
  progressPercent?: number;
  minutesLeft?: number;
}

export function getLessonStatus(
  lesson: ScheduleLesson,
  isToday: boolean,
  currentTimeMinutes: number
): LessonStatusInfo {
  if (!isToday || !lesson.startLessonTime || !lesson.endLessonTime) {
    return {
      statusText: '',
      isOngoing: false,
      isUpcoming: false,
      isCompleted: false,
    };
  }

  const start = parseTimeToMinutes(lesson.startLessonTime);
  const end = parseTimeToMinutes(lesson.endLessonTime);

  if (currentTimeMinutes >= start && currentTimeMinutes <= end) {
    const totalDuration = Math.max(1, end - start);
    const elapsed = Math.max(0, currentTimeMinutes - start);
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    const minLeft = end - currentTimeMinutes;
    return {
      statusText: `Сейчас идёт · ещё ${minLeft} мин`,
      isOngoing: true,
      isUpcoming: false,
      isCompleted: false,
      progressPercent,
      minutesLeft: minLeft,
    };
  }

  if (currentTimeMinutes < start) {
    const diff = start - currentTimeMinutes;
    let label = '';
    if (diff <= 60) {
      label = `Начнётся через ${diff} мин`;
    } else {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      label = `Начнётся через ${hours} ч ${mins > 0 ? `${mins} мин` : ''}`;
    }
    return {
      statusText: label,
      isOngoing: false,
      isUpcoming: true,
      isCompleted: false,
      startsInMinutes: diff,
    };
  }

  return {
    statusText: 'Завершено',
    isOngoing: false,
    isUpcoming: false,
    isCompleted: true,
  };
}

export interface WeekDayDate {
  weekdayName: string;
  shortLabel: string;
  dayNumber: number;
  monthShort: string;
  isToday: boolean;
  dateStr: string;
}

export function getWeekDates(offsetWeeks = 0): WeekDayDate[] {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sun
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday + offsetWeeks * 7);

  const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const shorts = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const fullNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  return fullNames.map((weekdayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const isToday = d.toDateString() === now.toDateString();
    return {
      weekdayName,
      shortLabel: shorts[idx],
      dayNumber: d.getDate(),
      monthShort: months[d.getMonth()],
      isToday,
      dateStr: `${d.getDate()} ${months[d.getMonth()]}`,
    };
  });
}

export function filterLessons(
  lessons: ScheduleLesson[],
  weekNumber: number,
  subgroupChoice: number = 0,
  lessonTypeFilter: string = 'all'
): ScheduleLesson[] {
  return lessons.filter((lesson) => {
    // 1. Week check
    if (lesson.weekNumber && lesson.weekNumber.length > 0) {
      if (!lesson.weekNumber.includes(weekNumber)) {
        return false;
      }
    }

    // 2. Subgroup check
    if (subgroupChoice !== 0 && lesson.numSubgroup !== 0) {
      if (lesson.numSubgroup !== subgroupChoice) {
        return false;
      }
    }

    // 3. Lesson type filter
    if (lessonTypeFilter !== 'all') {
      const type = (lesson.lessonTypeAbbrev || '').toUpperCase();
      if (lessonTypeFilter === 'lecture' && !type.includes('ЛК')) return false;
      if (lessonTypeFilter === 'practice' && !type.includes('ПЗ')) return false;
      if (lessonTypeFilter === 'lab' && !type.includes('ЛР')) return false;
    }

    return true;
  });
}

export function sortLessonsChronologically(lessons: ScheduleLesson[]): ScheduleLesson[] {
  return [...lessons].sort((a, b) => {
    const aStart = parseTimeToMinutes(a.startLessonTime);
    const bStart = parseTimeToMinutes(b.startLessonTime);
    return aStart - bStart;
  });
}

/**
 * Calculates lesson count for each weekday to render minimalist density indicators
 */
export function calculateDayDensity(
  schedules: WeekScheduleMap | undefined | null,
  weekNumber: number,
  subgroupChoice: number = 0
): Record<string, number> {
  const result: Record<string, number> = {};
  if (!schedules) return result;

  for (const day of BSUIR_WEEKDAYS) {
    const raw = schedules[day] || [];
    const filtered = filterLessons(raw, weekNumber, subgroupChoice, 'all');
    result[day] = filtered.length;
  }
  return result;
}

export function getNextOrCurrentLesson(
  schedules: WeekScheduleMap,
  currentWeek: number,
  subgroup: number = 0
): {
  lesson: ScheduleLesson | null;
  day: string;
  statusText: string;
  isToday: boolean;
  startsInMinutes?: number;
} {
  const now = new Date();
  const currentMinutes = getCurrentTimeMinutes(now);
  const todayName = getTodayWeekdayName(now);

  // Check today's lessons first
  const todayRaw = schedules[todayName] || [];
  const todayFiltered = sortLessonsChronologically(
    filterLessons(todayRaw, currentWeek, subgroup, 'all')
  );

  // Check if a lesson is ongoing or upcoming today
  for (const lesson of todayFiltered) {
    const status = getLessonStatus(lesson, true, currentMinutes);
    if (status.isOngoing || status.isUpcoming) {
      return {
        lesson,
        day: todayName,
        statusText: status.statusText,
        isToday: true,
        startsInMinutes: status.startsInMinutes,
      };
    }
  }

  // If no upcoming lessons today, find next lesson in upcoming days
  const dayOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const todayIndex = dayOrder.indexOf(todayName);

  // Check subsequent days this week or next week
  for (let offset = 1; offset <= 6; offset++) {
    const nextDayIndex = (todayIndex + offset) % 6;
    const nextDayName = dayOrder[nextDayIndex];
    const isNextWeek = todayIndex + offset >= 6;
    const targetWeek = isNextWeek ? (currentWeek % 4) + 1 : currentWeek;

    const nextDayRaw = schedules[nextDayName] || [];
    const nextDayFiltered = sortLessonsChronologically(
      filterLessons(nextDayRaw, targetWeek, subgroup, 'all')
    );

    if (nextDayFiltered.length > 0) {
      const nextLesson = nextDayFiltered[0];
      const isTomorrow = offset === 1;
      return {
        lesson: nextLesson,
        day: nextDayName,
        statusText: isTomorrow
          ? `Следующая пара завтра в ${nextLesson.startLessonTime}`
          : `${nextDayName} в ${nextLesson.startLessonTime}`,
        isToday: false,
      };
    }
  }

  return {
    lesson: null,
    day: todayName,
    statusText: 'Сегодня и на ближайшие дни занятий больше нет',
    isToday: true,
  };
}

export function getLessonTypeMeta(abbrev: string): {
  label: string;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
  accentHex: string;
} {
  const norm = (abbrev || '').trim().toUpperCase();
  if (norm.includes('ЛК')) {
    return {
      label: 'Лекция',
      colorClass: 'text-[#146C55] dark:text-[#5EEAD4]',
      bgLightClass: 'bg-[#E8F6F0] dark:bg-[#0C2B22]',
      borderClass: 'border-[#A7F3D0]/70 dark:border-[#134E48]',
      accentHex: '#16866C',
    };
  }
  if (norm.includes('ПЗ')) {
    return {
      label: 'Практика',
      colorClass: 'text-[#90640B] dark:text-[#FDE047]',
      bgLightClass: 'bg-[#FFF5DC] dark:bg-[#2B1F08]',
      borderClass: 'border-[#FDE68A]/70 dark:border-[#78350F]',
      accentHex: '#B98521',
    };
  }
  if (norm.includes('ЛР')) {
    return {
      label: 'Лабораторная',
      colorClass: 'text-[#AC4148] dark:text-[#FCA5A5]',
      bgLightClass: 'bg-[#FDEBEC] dark:bg-[#331417]',
      borderClass: 'border-[#FECDD3]/70 dark:border-[#881337]',
      accentHex: '#D65E61',
    };
  }
  if (norm.includes('КОНС') || norm.includes('КП')) {
    return {
      label: 'Консультация',
      colorClass: 'text-[#305D9F] dark:text-[#93C5FD]',
      bgLightClass: 'bg-[#EBF3FF] dark:bg-[#11233F]',
      borderClass: 'border-[#BFDBFE]/70 dark:border-[#1E3A8A]',
      accentHex: '#477BC6',
    };
  }
  if (norm.includes('ЭКЗ')) {
    return {
      label: 'Экзамен',
      colorClass: 'text-[#68429A] dark:text-[#D8B4FE]',
      bgLightClass: 'bg-[#F3EDFC] dark:bg-[#24143B]',
      borderClass: 'border-[#E9D5FF]/70 dark:border-[#581C87]',
      accentHex: '#8359BC',
    };
  }
  if (norm.includes('ЗАЧ')) {
    return {
      label: 'Зачёт',
      colorClass: 'text-[#0369A1] dark:text-[#7DD3FC]',
      bgLightClass: 'bg-[#F0F9FF] dark:bg-[#0C2338]',
      borderClass: 'border-[#BAE6FD]/70 dark:border-[#075985]',
      accentHex: '#0284C7',
    };
  }
  return {
    label: abbrev || 'Занятие',
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgLightClass: 'bg-slate-100 dark:bg-slate-800',
    borderClass: 'border-slate-200 dark:border-slate-700',
    accentHex: '#64748B',
  };
}
