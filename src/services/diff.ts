import { FullScheduleResponse, ScheduleLesson, ScheduleDiffItem } from '../types/bsuir';

/**
 * Normalizes a lesson for comparison
 */
function createLessonSignature(lesson: ScheduleLesson): string {
  const aud = (lesson.auditories || []).join(',');
  const employees = (lesson.employees || []).map((e) => e.fio || `${e.lastName} ${e.firstName}`).sort().join(';');
  const weeks = (lesson.weekNumber || []).sort().join(',');
  return `${lesson.subject}__${lesson.lessonTypeAbbrev}__${lesson.startLessonTime}-${lesson.endLessonTime}__${lesson.numSubgroup}__w[${weeks}]__aud[${aud}]__emp[${employees}]`;
}

/**
 * Compares old and new schedules and detects changes
 */
export function detectScheduleDiff(
  oldSchedule: FullScheduleResponse | null,
  newSchedule: FullScheduleResponse
): ScheduleDiffItem[] {
  if (!oldSchedule || !oldSchedule.schedules) {
    return [];
  }

  const diffs: ScheduleDiffItem[] = [];
  const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

  for (const day of days) {
    const oldLessons: ScheduleLesson[] = oldSchedule.schedules[day] || [];
    const newLessons: ScheduleLesson[] = newSchedule.schedules[day] || [];

    const oldSignatures = new Map<string, ScheduleLesson>();
    for (const l of oldLessons) {
      oldSignatures.set(createLessonSignature(l), l);
    }

    const newSignatures = new Map<string, ScheduleLesson>();
    for (const l of newLessons) {
      newSignatures.set(createLessonSignature(l), l);
    }

    // Check for added lessons
    for (const [sig, newLesson] of newSignatures.entries()) {
      if (!oldSignatures.has(sig)) {
        // Check if there was a lesson with same subject and time (i.e. room or teacher changed)
        const modifiedCandidate = oldLessons.find(
          (o) => o.subject === newLesson.subject && o.startLessonTime === newLesson.startLessonTime
        );

        if (modifiedCandidate) {
          const oldAud = (modifiedCandidate.auditories || []).join(', ');
          const newAud = (newLesson.auditories || []).join(', ');
          diffs.push({
            id: `mod_${day}_${newLesson.subject}_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            day,
            type: 'modified',
            subject: newLesson.subject,
            lessonTime: `${newLesson.startLessonTime} - ${newLesson.endLessonTime}`,
            message: `Изменена пара по «${newLesson.subject}» (${day}): ${oldAud !== newAud ? `аудитория с ${oldAud || 'без ауд.'} на ${newAud}` : 'обновлены данные'}.`,
          });
        } else {
          diffs.push({
            id: `add_${day}_${newLesson.subject}_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            day,
            type: 'added',
            subject: newLesson.subject,
            lessonTime: `${newLesson.startLessonTime} - ${newLesson.endLessonTime}`,
            message: `Добавлено занятие по «${newLesson.subject}» (${newLesson.lessonTypeAbbrev}) в ${newLesson.startLessonTime} (${day}).`,
          });
        }
      }
    }

    // Check for removed lessons (only if not counted as modified)
    for (const [sig, oldLesson] of oldSignatures.entries()) {
      if (!newSignatures.has(sig)) {
        const stillExistsModified = newLessons.some(
          (n) => n.subject === oldLesson.subject && n.startLessonTime === oldLesson.startLessonTime
        );
        if (!stillExistsModified) {
          diffs.push({
            id: `rem_${day}_${oldLesson.subject}_${Date.now()}_${Math.random()}`,
            timestamp: Date.now(),
            day,
            type: 'removed',
            subject: oldLesson.subject,
            lessonTime: `${oldLesson.startLessonTime} - ${oldLesson.endLessonTime}`,
            message: `Занятие по «${oldLesson.subject}» (${oldLesson.lessonTypeAbbrev}) в ${oldLesson.startLessonTime} (${day}) удалено из расписания.`,
          });
        }
      }
    }
  }

  return diffs;
}
