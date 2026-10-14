import { StudentGroupSummary, EmployeeSummary, FullScheduleResponse, FreeTimeSlot } from '../types/bsuir';
import { StorageService } from './storage';
import { detectScheduleDiff } from './diff';

export interface ApiScheduleResult {
  data: FullScheduleResponse;
  isOffline: boolean;
  cachedAt?: number;
}

export const ApiService = {
  async fetchHealth(): Promise<{ status: string; currentWeek: number }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return { status: 'offline', currentWeek: 3 };
    }
  },

  async fetchCurrentWeek(): Promise<number> {
    try {
      const res = await fetch('/api/current-week');
      if (res.ok) {
        const json = await res.json();
        return json.currentWeek || 3;
      }
    } catch (e) {
      console.warn('Network error fetching current week:', e);
    }
    return 3; // sensible default for BSUIR autumn semester cycle
  },

  async fetchGroups(): Promise<StudentGroupSummary[]> {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const json = await res.json();
        const groups: StudentGroupSummary[] = json.groups || [];
        if (groups.length > 0) {
          StorageService.saveCachedGroups(groups);
          return groups;
        }
      }
    } catch (e) {
      console.warn('Network error fetching groups, checking offline cache:', e);
    }

    const cached = StorageService.getCachedGroups();
    if (cached && cached.length > 0) {
      return cached;
    }
    return [];
  },

  async fetchTeachers(): Promise<EmployeeSummary[]> {
    try {
      const res = await fetch('/api/teachers');
      if (res.ok) {
        const json = await res.json();
        const teachers: EmployeeSummary[] = json.teachers || [];
        if (teachers.length > 0) {
          StorageService.saveCachedTeachers(teachers);
          return teachers;
        }
      }
    } catch (e) {
      console.warn('Network error fetching teachers, checking offline cache:', e);
    }

    const cached = StorageService.getCachedTeachers();
    if (cached && cached.length > 0) {
      return cached;
    }
    return [];
  },

  async fetchGroupSchedule(groupNumber: string, saveAndDiff = true): Promise<ApiScheduleResult> {
    const key = `group_${groupNumber}`;
    const cachedEntry = StorageService.getCachedSchedule(key);

    try {
      const res = await fetch(`/api/schedule/groups/${encodeURIComponent(groupNumber)}`);
      if (res.ok) {
        const data: FullScheduleResponse = await res.json();

        if (saveAndDiff) {
          if (cachedEntry?.data) {
            const diffs = detectScheduleDiff(cachedEntry.data, data);
            diffs.forEach((diff) => StorageService.addNotification(diff));
          }
          StorageService.saveCachedSchedule(key, data);
        }

        return {
          data,
          isOffline: false,
          cachedAt: Date.now(),
        };
      }
    } catch (e) {
      console.warn(`Error fetching schedule for group ${groupNumber}, falling back to cache:`, e);
    }

    if (cachedEntry) {
      return {
        data: cachedEntry.data,
        isOffline: true,
        cachedAt: cachedEntry.timestamp,
      };
    }

    throw new Error(`Не удалось загрузить расписание для группы ${groupNumber}`);
  },

  async fetchTeacherSchedule(urlId: string, saveAndDiff = true): Promise<ApiScheduleResult> {
    const key = `teacher_${urlId}`;
    const cachedEntry = StorageService.getCachedSchedule(key);

    try {
      const res = await fetch(`/api/schedule/teachers/${encodeURIComponent(urlId)}`);
      if (res.ok) {
        const data: FullScheduleResponse = await res.json();

        if (saveAndDiff) {
          if (cachedEntry?.data) {
            const diffs = detectScheduleDiff(cachedEntry.data, data);
            diffs.forEach((diff) => StorageService.addNotification(diff));
          }
          StorageService.saveCachedSchedule(key, data);
        }

        return {
          data,
          isOffline: false,
          cachedAt: Date.now(),
        };
      }
    } catch (e) {
      console.warn(`Error fetching schedule for teacher ${urlId}, falling back to cache:`, e);
    }

    if (cachedEntry) {
      return {
        data: cachedEntry.data,
        isOffline: true,
        cachedAt: cachedEntry.timestamp,
      };
    }

    throw new Error(`Не удалось загрузить расписание для преподавателя ${urlId}`);
  },

  async fetchGroupExams(groupNumber: string): Promise<any[]> {
    try {
      const res = await fetch(`/api/exams/groups/${encodeURIComponent(groupNumber)}`);
      if (res.ok) {
        const json = await res.json();
        return json.exams || [];
      }
    } catch (e) {
      console.warn('Error fetching group exams:', e);
    }
    return [];
  },

  async fetchTeacherExams(urlId: string): Promise<any[]> {
    try {
      const res = await fetch(`/api/exams/teachers/${encodeURIComponent(urlId)}`);
      if (res.ok) {
        const json = await res.json();
        return json.exams || [];
      }
    } catch (e) {
      console.warn('Error fetching teacher exams:', e);
    }
    return [];
  },

  async findFreeSlots(
    groupNumber: string,
    teacherUrlId: string,
    weekday: string,
    weekNumber: number,
    subgroup = 0
  ): Promise<{ freeSlots: FreeTimeSlot[]; disclaimer: string }> {
    const res = await fetch('/api/free-slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupNumber,
        teacherUrlId,
        weekday,
        weekNumber,
        subgroup,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Не удалось рассчитать общее свободное время');
    }

    return await res.json();
  },
};
