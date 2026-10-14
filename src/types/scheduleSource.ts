/**
 * BSUIR Flow — Schedule Source & User State Types
 */

export type ScheduleSourceType =
  | 'student'           // Моя учёба
  | 'teacher'           // Моё преподавание
  | 'secondary_study'   // Вторая учёба / магистратура
  | 'friend'            // Расписание друга
  | 'saved_group'       // Сохранённая учебная группа
  | 'saved_teacher'     // Сохранённый преподаватель
  | 'manual';           // Своё расписание (локальные занятия)

export type ScheduleProviderType = 'bsuir_group' | 'bsuir_employee' | 'manual';

export interface ManualLesson {
  id: string;
  subject: string;
  subjectFullName?: string;
  lessonTypeAbbrev: string;
  startLessonTime: string; // 'HH:MM'
  endLessonTime: string;   // 'HH:MM'
  auditories: string[];
  weekday: string;         // 'Понедельник' | ...
  weekNumber: number[];    // [1, 2, 3, 4]
  note?: string;
}

export interface ScheduleSource {
  id: string;
  type: ScheduleSourceType;
  provider: ScheduleProviderType;
  providerEntityId: string; // group name (e.g. '576701') or employee urlId (e.g. 'n-shcherbina') or 'manual'
  displayName: string;
  subgroup: 0 | 1 | 2; // 0 = all, 1 = first, 2 = second
  isPrimary: boolean;
  includeInCombined: boolean;
  isFavorite: boolean;
  colorMarker: string; // hex
  order: number;
  createdAt: number;
  updatedAt: number;
  meta?: {
    facultyAbbrev?: string;
    course?: number;
    department?: string;
    fio?: string;
    degree?: string;
    photoLink?: string;
  };
  manualLessons?: ManualLesson[];
}

export interface CombinedConflict {
  id: string;
  timeRange: string; // e.g. "14:00 — 15:30"
  weekday: string;
  weekNumber: number;
  sources: Array<{
    sourceId: string;
    sourceName: string;
    subject: string;
    lessonType: string;
    room: string;
  }>;
}

export interface NormalizedCombinedLesson {
  lessonId: string;
  sourceId: string;
  sourceName: string;
  sourceColor: string;
  sourceType: ScheduleSourceType;
  subject: string;
  subjectFullName?: string;
  lessonTypeAbbrev: string;
  startLessonTime: string;
  endLessonTime: string;
  auditories: string[];
  numSubgroup: number;
  weekNumber: number[];
  employees?: Array<{
    id: number;
    firstName: string;
    lastName: string;
    middleName: string;
    fio?: string;
    urlId: string;
  }>;
  studentGroups?: Array<{
    name: string;
  }>;
  note?: string | null;
  hasConflict?: boolean;
  conflictId?: string;
}

export type AppTheme = 'light' | 'dark' | 'system';

export interface FlowAppState {
  version: number;
  sources: ScheduleSource[];
  activeSourceId: string | 'combined'; // id of active source or 'combined'
  theme: AppTheme;
  notificationsEnabled: boolean;
  selectedScheduleWeek?: number; // 1, 2, 3, 4
  recentSearches: string[];
  favorites: Array<{
    id: string;
    type: 'group' | 'teacher';
    title: string;
    subtitle?: string;
  }>;
}

export const SOURCE_COLORS = [
  '#4F46E5', // Indigo
  '#0EA5E9', // Sky
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
];
