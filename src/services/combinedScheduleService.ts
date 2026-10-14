/**
 * BSUIR Flow — Combined Schedule Merger & Conflict Detection Service
 */

import { FullScheduleResponse, ScheduleLesson } from '../types/bsuir';
import { ScheduleSource, NormalizedCombinedLesson, CombinedConflict } from '../types/scheduleSource';
import { parseTimeToMinutes } from '../utils/scheduleUtils';

export interface CombinedDayResult {
  dayName: string;
  lessons: NormalizedCombinedLesson[];
  conflicts: CombinedConflict[];
}

export const CombinedScheduleService = {
  /**
   * Merges schedule lessons for a specific day and week number from multiple sources
   */
  mergeDay(
    sources: ScheduleSource[],
    schedulesMap: Map<string, FullScheduleResponse>,
    dayName: string,
    weekNumber: number
  ): CombinedDayResult {
    const rawLessons: NormalizedCombinedLesson[] = [];

    sources.forEach((source) => {
      // 1. Check for manual lessons
      if (source.provider === 'manual' && source.manualLessons) {
        source.manualLessons.forEach((ml) => {
          if (ml.weekday === dayName && (ml.weekNumber.length === 0 || ml.weekNumber.includes(weekNumber))) {
            rawLessons.push({
              lessonId: `manual_${source.id}_${ml.id}`,
              sourceId: source.id,
              sourceName: source.displayName,
              sourceColor: source.colorMarker,
              sourceType: source.type,
              subject: ml.subject,
              subjectFullName: ml.subjectFullName || ml.subject,
              lessonTypeAbbrev: ml.lessonTypeAbbrev,
              startLessonTime: ml.startLessonTime,
              endLessonTime: ml.endLessonTime,
              auditories: ml.auditories || [],
              numSubgroup: 0,
              weekNumber: ml.weekNumber,
              note: ml.note,
            });
          }
        });
        return;
      }

      // 2. Check for BSUIR API schedule
      const sched = schedulesMap.get(source.id);
      if (!sched || !sched.schedules) return;

      const dayLessons: ScheduleLesson[] = sched.schedules[dayName] || [];

      dayLessons.forEach((lesson, idx) => {
        // Week number check
        if (lesson.weekNumber && lesson.weekNumber.length > 0) {
          if (!lesson.weekNumber.includes(weekNumber)) {
            return;
          }
        }

        // Subgroup check
        if (source.subgroup > 0 && lesson.numSubgroup > 0 && lesson.numSubgroup !== source.subgroup) {
          return;
        }

        rawLessons.push({
          lessonId: `${source.id}_${dayName}_${idx}_${lesson.subject}_${lesson.startLessonTime}`,
          sourceId: source.id,
          sourceName: source.displayName,
          sourceColor: source.colorMarker,
          sourceType: source.type,
          subject: lesson.subject,
          subjectFullName: lesson.subjectFullName || lesson.subject,
          lessonTypeAbbrev: lesson.lessonTypeAbbrev,
          startLessonTime: lesson.startLessonTime,
          endLessonTime: lesson.endLessonTime,
          auditories: lesson.auditories || [],
          numSubgroup: lesson.numSubgroup,
          weekNumber: lesson.weekNumber || [],
          employees: lesson.employees?.map((e) => ({
            id: e.id,
            firstName: e.firstName,
            lastName: e.lastName,
            middleName: e.middleName,
            fio: e.fio,
            urlId: e.urlId,
          })),
          studentGroups: lesson.studentGroups?.map((g) => ({
            name: g.name,
          })),
          note: lesson.note,
        });
      });
    });

    // Sort chronologically by start time
    rawLessons.sort((a, b) => {
      const aStart = parseTimeToMinutes(a.startLessonTime);
      const bStart = parseTimeToMinutes(b.startLessonTime);
      if (aStart !== bStart) return aStart - bStart;
      return parseTimeToMinutes(a.endLessonTime) - parseTimeToMinutes(b.endLessonTime);
    });

    // Detect Conflicts (overlaps between lessons of DIFFERENT sources)
    const conflicts: CombinedConflict[] = [];

    for (let i = 0; i < rawLessons.length; i++) {
      for (let j = i + 1; j < rawLessons.length; j++) {
        const itemA = rawLessons[i];
        const itemB = rawLessons[j];

        // Only detect conflict between DIFFERENT sources
        if (itemA.sourceId === itemB.sourceId) continue;

        const aStart = parseTimeToMinutes(itemA.startLessonTime);
        const aEnd = parseTimeToMinutes(itemA.endLessonTime);
        const bStart = parseTimeToMinutes(itemB.startLessonTime);
        const bEnd = parseTimeToMinutes(itemB.endLessonTime);

        // Check if intervals overlap
        if (aStart < bEnd && bStart < aEnd) {
          const overlapStartMin = Math.max(aStart, bStart);
          const overlapEndMin = Math.min(aEnd, bEnd);

          const formatMinutes = (m: number) => {
            const h = Math.floor(m / 60).toString().padStart(2, '0');
            const min = (m % 60).toString().padStart(2, '0');
            return `${h}:${min}`;
          };

          const conflictRangeStr = `${formatMinutes(overlapStartMin)} — ${formatMinutes(overlapEndMin)}`;
          const conflictId = `conflict_${itemA.sourceId}_${itemB.sourceId}_${aStart}`;

          itemA.hasConflict = true;
          itemA.conflictId = conflictId;
          itemB.hasConflict = true;
          itemB.conflictId = conflictId;

          // Check if this conflict already registered
          const existing = conflicts.find((c) => c.id === conflictId);
          if (!existing) {
            conflicts.push({
              id: conflictId,
              timeRange: conflictRangeStr,
              weekday: dayName,
              weekNumber,
              sources: [
                {
                  sourceId: itemA.sourceId,
                  sourceName: itemA.sourceName,
                  subject: itemA.subject,
                  lessonType: itemA.lessonTypeAbbrev,
                  room: (itemA.auditories || []).join(', '),
                },
                {
                  sourceId: itemB.sourceId,
                  sourceName: itemB.sourceName,
                  subject: itemB.subject,
                  lessonType: itemB.lessonTypeAbbrev,
                  room: (itemB.auditories || []).join(', '),
                },
              ],
            });
          }
        }
      }
    }

    return {
      dayName,
      lessons: rawLessons,
      conflicts,
    };
  },

  /**
   * Calculates breaks / windows between consecutive lessons
   */
  calculateGaps(lessons: NormalizedCombinedLesson[]): Map<number, number> {
    const gaps = new Map<number, number>(); // index before gap -> duration in minutes
    for (let i = 0; i < lessons.length - 1; i++) {
      const curEnd = parseTimeToMinutes(lessons[i].endLessonTime);
      const nextStart = parseTimeToMinutes(lessons[i + 1].startLessonTime);
      if (nextStart > curEnd) {
        const gapMin = nextStart - curEnd;
        if (gapMin >= 30) {
          gaps.set(i, gapMin);
        }
      }
    }
    return gaps;
  },
};
