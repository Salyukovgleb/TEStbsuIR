/**
 * BSUIR Hub Data Types
 */

export interface StudentGroupSummary {
  name: string;
  facultyId: number;
  facultyAbbrev?: string;
  facultyName?: string;
  specialityDepartmentEducationFormId: number;
  specialityName: string;
  specialityAbbrev?: string;
  course: number;
  id: number;
  calendarId?: string;
  educationDegree?: number;
}

export interface EmployeeSummary {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string;
  fio: string;
  degree?: string;
  rank?: string | null;
  photoLink?: string;
  calendarId?: string;
  academicDepartment?: string[];
  urlId: string;
}

export interface LessonEmployee {
  id: number;
  firstName: string;
  middleName: string;
  lastName: string;
  fio?: string;
  degree?: string;
  degreeAbbrev?: string;
  rank?: string | null;
  email?: string;
  urlId: string;
  photoLink?: string;
  calendarId?: string;
}

export interface LessonStudentGroup {
  name: string;
  specialityName?: string;
  specialityCode?: string;
  numberOfStudents?: number;
  educationDegree?: number;
}

export interface ScheduleLesson {
  subject: string;
  subjectFullName?: string;
  lessonTypeAbbrev: string; // 'ЛК', 'ПЗ', 'ЛР', 'Консультация', 'Экзамен', 'Зачет'
  startLessonTime: string; // 'HH:MM'
  endLessonTime: string;   // 'HH:MM'
  auditories: string[];
  numSubgroup: number;     // 0 = all, 1 = subgroup 1, 2 = subgroup 2
  weekNumber: number[];    // [1, 2, 3, 4]
  employees?: LessonEmployee[];
  studentGroups?: LessonStudentGroup[];
  note?: string | null;
  startLessonDate?: string | null;
  endLessonDate?: string | null;
  dateLesson?: string | null;
  announcement?: boolean;
  split?: boolean;
}

export type WeekScheduleMap = Record<string, ScheduleLesson[]>;

export interface FullScheduleResponse {
  startDate?: string;
  endDate?: string;
  startExamsDate?: string;
  endExamsDate?: string;
  employeeDto?: EmployeeSummary | null;
  studentGroupDto?: StudentGroupSummary | null;
  schedules: WeekScheduleMap;
  exams?: ScheduleLesson[];
  currentTerm?: string;
  currentPeriod?: string;
  cachedAt?: number;
}

export interface FreeTimeSlot {
  startTime: string;
  endTime: string;
  durationMinutes: number;
  weekday: string;
  dateStr?: string;
  note?: string;
}

export interface ScheduleDiffItem {
  id: string;
  timestamp: number;
  day: string;
  type: 'added' | 'removed' | 'modified';
  message: string;
  subject: string;
  lessonTime: string;
}
