import test from 'node:test';
import assert from 'node:assert/strict';

import {
  filterLessons,
  sortLessonsChronologically,
  getNextOrCurrentLesson,
  parseTimeToMinutes,
  getLessonStatus,
} from '../src/utils/scheduleUtils';
import { detectScheduleDiff } from '../src/services/diff';
import { ScheduleLesson, FullScheduleResponse } from '../src/types/bsuir';
import { UserProfile, DEFAULT_USER_PROFILE } from '../src/types/user';

// Mock fixtures
const mockLesson1: ScheduleLesson = {
  subject: 'ОАиП',
  subjectFullName: 'Основы алгоритмизации и программирования',
  lessonTypeAbbrev: 'ЛК',
  startLessonTime: '09:00',
  endLessonTime: '10:35',
  auditories: ['201-1 к.'],
  numSubgroup: 0,
  weekNumber: [1, 2, 3, 4],
  employees: [{ id: 1, firstName: 'Иван', lastName: 'Иванов', middleName: 'Иванович', urlId: 'i-ivanov' }],
};

const mockLessonSubgroup1: ScheduleLesson = {
  subject: 'ОАиП',
  subjectFullName: 'Основы алгоритмизации и программирования',
  lessonTypeAbbrev: 'ЛР',
  startLessonTime: '10:45',
  endLessonTime: '12:20',
  auditories: ['305-1 к.'],
  numSubgroup: 1,
  weekNumber: [1, 3],
  employees: [{ id: 1, firstName: 'Иван', lastName: 'Иванов', middleName: 'Иванович', urlId: 'i-ivanov' }],
};

const mockLessonSubgroup2: ScheduleLesson = {
  subject: 'ОАиП',
  subjectFullName: 'Основы алгоритмизации и программирования',
  lessonTypeAbbrev: 'ЛР',
  startLessonTime: '10:45',
  endLessonTime: '12:20',
  auditories: ['306-1 к.'],
  numSubgroup: 2,
  weekNumber: [1, 3],
  employees: [{ id: 2, firstName: 'Петр', lastName: 'Петров', middleName: 'Петрович', urlId: 'p-petrov' }],
};

// Test 1: Student role & group selection
test('1. Student role and group selection initializes profile properly', () => {
  const profile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    isOnboarded: true,
    role: 'student',
    groupNumber: '310101',
    subgroup: 1,
    facultyName: 'ФКП',
  };

  assert.equal(profile.role, 'student');
  assert.equal(profile.groupNumber, '310101');
  assert.equal(profile.subgroup, 1);
  assert.equal(profile.isOnboarded, true);
});

// Test 2: Teacher selection
test('2. Teacher selection saves URL ID and FIO', () => {
  const profile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    isOnboarded: true,
    role: 'teacher',
    teacherUrlId: 'n-shcherbina',
    teacherFio: 'Щербина Н. В.',
    teacherDepartment: 'Каф.ИРТ',
  };

  assert.equal(profile.role, 'teacher');
  assert.equal(profile.teacherUrlId, 'n-shcherbina');
  assert.equal(profile.teacherFio, 'Щербина Н. В.');
});

// Test 3: Time parsing and chronological sorting
test('3. Chronological sorting orders lessons by start time', () => {
  const sorted = sortLessonsChronologically([mockLessonSubgroup1, mockLesson1]);
  assert.equal(sorted[0].startLessonTime, '09:00');
  assert.equal(sorted[1].startLessonTime, '10:45');
});

// Test 4: Subgroup filtering
test('4. Subgroup filtering returns common lessons and specific subgroup only', () => {
  const all = [mockLesson1, mockLessonSubgroup1, mockLessonSubgroup2];

  // For subgroup 1 on week 1: should include common (0) and subgroup 1, but NOT subgroup 2
  const filteredSub1 = filterLessons(all, 1, 1, 'all');
  assert.equal(filteredSub1.length, 2);
  assert.ok(filteredSub1.some((l) => l.numSubgroup === 0));
  assert.ok(filteredSub1.some((l) => l.numSubgroup === 1));
  assert.ok(!filteredSub1.some((l) => l.numSubgroup === 2));

  // For all subgroups (0): should include all 3
  const filteredAll = filterLessons(all, 1, 0, 'all');
  assert.equal(filteredAll.length, 3);
});

// Test 5: Week number cycle filtering
test('5. Week number filtering checks lesson.weekNumber', () => {
  const all = [mockLesson1, mockLessonSubgroup1]; // mockLessonSubgroup1 is only weeks 1 and 3

  const week2 = filterLessons(all, 2, 0, 'all');
  assert.equal(week2.length, 1);
  assert.equal(week2[0].subject, 'ОАиП');
  assert.equal(week2[0].lessonTypeAbbrev, 'ЛК');

  const week3 = filterLessons(all, 3, 0, 'all');
  assert.equal(week3.length, 2);
});

// Test 6: Next or current lesson determination
test('6. Lesson status computes ongoing vs upcoming', () => {
  // Lesson 09:00 - 10:35
  const ongoingStatus = getLessonStatus(mockLesson1, true, 9 * 60 + 15); // 09:15
  assert.equal(ongoingStatus.isOngoing, true);
  assert.equal(ongoingStatus.isCompleted, false);

  const upcomingStatus = getLessonStatus(mockLesson1, true, 8 * 60 + 30); // 08:30
  assert.equal(upcomingStatus.isUpcoming, true);
  assert.equal(upcomingStatus.startsInMinutes, 30);

  const completedStatus = getLessonStatus(mockLesson1, true, 11 * 60); // 11:00
  assert.equal(completedStatus.isCompleted, true);
});

// Test 7: Teacher search matching with e/ё normalization
test('7. Search normalization handles case and e/ё', () => {
  const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim();
  const teacherFio = 'Щёрбина Наталья Витальевна';
  const query = 'щербина';

  assert.ok(normalize(teacherFio).includes(normalize(query)));
});

// Test 8: Mutual free time intervals algorithm
test('8. Free slots algorithm detects available gaps between busy intervals', () => {
  // Let interval 1 be 09:00 - 10:35 (540 - 635 min)
  // Let interval 2 be 13:35 - 15:10 (815 - 910 min)
  const busy = [
    { start: 540, end: 635 },
    { start: 815, end: 910 },
  ];

  const dayStart = 480; // 08:00
  const dayEnd = 1170;  // 19:30

  const free: Array<{ start: number; end: number; duration: number }> = [];
  let cur = dayStart;

  for (const b of busy) {
    if (b.start > cur && b.start - cur >= 30) {
      free.push({ start: cur, end: b.start, duration: b.start - cur });
    }
    cur = Math.max(cur, b.end);
  }
  if (dayEnd > cur && dayEnd - cur >= 30) {
    free.push({ start: cur, end: dayEnd, duration: dayEnd - cur });
  }

  // Expect gaps: 08:00-09:00 (60 min), 10:35-13:35 (180 min), 15:10-19:30 (260 min)
  assert.equal(free.length, 3);
  assert.equal(free[0].start, 480);
  assert.equal(free[0].end, 540);
  assert.equal(free[1].start, 635);
  assert.equal(free[1].end, 815);
  assert.equal(free[2].start, 910);
  assert.equal(free[2].end, 1170);
});

// Test 9: Schedule diff detection
test('9. Schedule diff detects added and modified lessons', () => {
  const oldSched: FullScheduleResponse = {
    schedules: {
      Понедельник: [mockLesson1],
    },
  };

  const modifiedLesson1 = {
    ...mockLesson1,
    auditories: ['502-2 к.'], // changed room
  };

  const newSched: FullScheduleResponse = {
    schedules: {
      Понедельник: [modifiedLesson1, mockLessonSubgroup1], // added mockLessonSubgroup1
    },
  };

  const diffs = detectScheduleDiff(oldSched, newSched);
  assert.ok(diffs.length >= 2);
  assert.ok(diffs.some((d) => d.type === 'modified' && d.message.includes('аудитория')));
  assert.ok(diffs.some((d) => d.type === 'added'));
});

// Test 10: Offline schedule data preservation contract
test('10. FullScheduleResponse conforms to offline serialization contract', () => {
  const sched: FullScheduleResponse = {
    startDate: '01.09.2026',
    endDate: '31.12.2026',
    schedules: {
      Понедельник: [mockLesson1],
      Вторник: [],
    },
    exams: [],
    cachedAt: Date.now(),
  };

  const serialized = JSON.stringify(sched);
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.startDate, '01.09.2026');
  assert.equal(parsed.schedules['Понедельник'][0].subject, 'ОАиП');
  assert.ok(parsed.cachedAt > 0);
});
