import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createBsuirClient } from 'bsuir-iis-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize BSUIR client with internal caching
const bsuir = createBsuirClient({
  cache: {
    ttlMs: 15 * 60 * 1000, // 15 min internal cache
  },
  timeoutMs: 12000,
  retries: 2,
});

// Server-side in-memory cache to ensure resilient, fast responses
interface CacheItem<T> {
  data: T;
  timestamp: number;
}
const memoryCache = new Map<string, CacheItem<unknown>>();

function getFromCache<T>(key: string, maxAgeMs: number): T | null {
  const item = memoryCache.get(key) as CacheItem<T> | undefined;
  if (!item) return null;
  if (Date.now() - item.timestamp > maxAgeMs) {
    return null;
  }
  return item.data;
}

function setInCache<T>(key: string, data: T): void {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

// 1. Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const week = await bsuir.schedule.getCurrentWeek().catch(() => 3);
    res.json({
      status: 'ok',
      service: 'BSUIR Hub API Proxy',
      currentWeek: week,
      timestamp: new Date().toISOString(),
      bsuirApi: 'connected',
    });
  } catch (error) {
    res.json({
      status: 'degraded',
      service: 'BSUIR Hub API Proxy',
      error: error instanceof Error ? error.message : 'Unknown',
      timestamp: new Date().toISOString(),
    });
  }
});

// 2. Current academic week
app.get('/api/current-week', async (_req: Request, res: Response) => {
  const cacheKey = 'current_week';
  const cached = getFromCache<number>(cacheKey, 30 * 60 * 1000);
  if (cached !== null) {
    return res.json({ currentWeek: cached, fromCache: true });
  }

  try {
    const currentWeek = await bsuir.schedule.getCurrentWeek();
    setInCache(cacheKey, currentWeek);
    res.json({ currentWeek, fromCache: false });
  } catch (error) {
    // Default fallback week 3 if API temporarily down
    console.error('Error fetching current week:', error);
    res.json({ currentWeek: 3, fallback: true });
  }
});

// 3. Student Groups list
app.get('/api/groups', async (_req: Request, res: Response) => {
  const cacheKey = 'groups_list';
  const cached = getFromCache<unknown[]>(cacheKey, 60 * 60 * 1000); // 1 hour
  if (cached) {
    return res.json({ groups: cached, fromCache: true });
  }

  try {
    const groups = await bsuir.groups.listAll();
    setInCache(cacheKey, groups);
    res.json({ groups, fromCache: false });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(502).json({
      error: 'Не удалось получить список групп из ИИС БГУИР',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// 4. Employees / Teachers list
app.get(['/api/teachers', '/api/employees'], async (_req: Request, res: Response) => {
  const cacheKey = 'teachers_list';
  const cached = getFromCache<unknown[]>(cacheKey, 60 * 60 * 1000); // 1 hour
  if (cached) {
    return res.json({ teachers: cached, fromCache: true });
  }

  try {
    const teachers = await bsuir.employees.listAll();
    setInCache(cacheKey, teachers);
    res.json({ teachers, fromCache: false });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(502).json({
      error: 'Не удалось получить список преподавателей из ИИС БГУИР',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// 5. Group Schedule
app.get('/api/schedule/groups/:groupNumber', async (req: Request, res: Response) => {
  const groupNumber = req.params.groupNumber?.trim();
  if (!groupNumber || !/^[0-9a-zA-Z\-_]+$/.test(groupNumber)) {
    return res.status(400).json({ error: 'Некорректный номер группы' });
  }

  const cacheKey = `schedule_group_${groupNumber}`;
  const cached = getFromCache<unknown>(cacheKey, 10 * 60 * 1000); // 10 min
  if (cached) {
    return res.json({ ...(cached as object), fromCache: true });
  }

  try {
    const schedule = await bsuir.schedule.getGroup(groupNumber);
    setInCache(cacheKey, schedule);
    res.json({ ...schedule, fromCache: false });
  } catch (error) {
    console.error(`Error fetching schedule for group ${groupNumber}:`, error);
    res.status(502).json({
      error: `Не удалось загрузить расписание группы ${groupNumber}`,
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// 6. Teacher Schedule
app.get('/api/schedule/teachers/:urlId', async (req: Request, res: Response) => {
  const urlId = req.params.urlId?.trim();
  if (!urlId || !/^[0-9a-zA-Z\-_.]+$/.test(urlId)) {
    return res.status(400).json({ error: 'Некорректный ID преподавателя' });
  }

  const cacheKey = `schedule_teacher_${urlId}`;
  const cached = getFromCache<unknown>(cacheKey, 10 * 60 * 1000); // 10 min
  if (cached) {
    return res.json({ ...(cached as object), fromCache: true });
  }

  try {
    const schedule = await bsuir.schedule.getEmployee(urlId);
    setInCache(cacheKey, schedule);
    res.json({ ...schedule, fromCache: false });
  } catch (error) {
    console.error(`Error fetching schedule for teacher ${urlId}:`, error);
    res.status(502).json({
      error: `Не удалось загрузить расписание преподавателя ${urlId}`,
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// 7. Group Exams
app.get('/api/exams/groups/:groupNumber', async (req: Request, res: Response) => {
  const groupNumber = req.params.groupNumber?.trim();
  if (!groupNumber) {
    return res.status(400).json({ error: 'Не указан номер группы' });
  }

  try {
    const exams = await bsuir.schedule.getGroupExams(groupNumber);
    res.json({ exams });
  } catch (error) {
    console.error(`Error fetching exams for group ${groupNumber}:`, error);
    res.status(502).json({
      error: 'Не удалось получить экзамены группы',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// 8. Teacher Exams
app.get('/api/exams/teachers/:urlId', async (req: Request, res: Response) => {
  const urlId = req.params.urlId?.trim();
  if (!urlId) {
    return res.status(400).json({ error: 'Не указан ID преподавателя' });
  }

  try {
    const exams = await bsuir.schedule.getEmployeeExams(urlId);
    res.json({ exams });
  } catch (error) {
    console.error(`Error fetching exams for teacher ${urlId}:`, error);
    res.status(502).json({
      error: 'Не удалось получить экзамены преподавателя',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// 9. Faculties catalog
app.get('/api/faculties', async (_req: Request, res: Response) => {
  const cacheKey = 'faculties_list';
  const cached = getFromCache<unknown[]>(cacheKey, 24 * 60 * 60 * 1000);
  if (cached) return res.json({ faculties: cached });

  try {
    const faculties = await bsuir.faculties.listAll();
    setInCache(cacheKey, faculties);
    res.json({ faculties });
  } catch (error) {
    res.status(502).json({ error: 'Не удалось получить факультеты' });
  }
});

// 10. Free Slots Calculation (Mutual Free Time Finder)
interface TimeRange {
  start: number; // in minutes from 00:00
  end: number;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

app.post('/api/free-slots', async (req: Request, res: Response) => {
  try {
    const { groupNumber, teacherUrlId, weekday, weekNumber, subgroup = 0 } = req.body;

    if (!groupNumber || !teacherUrlId || !weekday || !weekNumber) {
      return res.status(400).json({ error: 'Необходимо указать groupNumber, teacherUrlId, weekday и weekNumber' });
    }

    // Fetch both schedules
    const [groupSched, teacherSched] = await Promise.all([
      bsuir.schedule.getGroup(groupNumber),
      bsuir.schedule.getEmployee(teacherUrlId),
    ]);

    const occupiedRanges: TimeRange[] = [];

    // Helper to extract busy intervals from day schedule
    const addBusyIntervals = (scheduleMap: any, isGroup = false) => {
      const dayLessons = scheduleMap?.schedules?.[weekday] || [];
      for (const lesson of dayLessons) {
        if (!lesson.startLessonTime || !lesson.endLessonTime) continue;

        // Check if weekNumber matches
        const lessonWeeks: number[] = lesson.weekNumber || [];
        if (lessonWeeks.length > 0 && !lessonWeeks.includes(Number(weekNumber))) {
          continue;
        }

        // For student group, check subgroup
        if (isGroup && subgroup > 0 && lesson.numSubgroup > 0 && lesson.numSubgroup !== Number(subgroup)) {
          continue;
        }

        const start = timeToMinutes(lesson.startLessonTime);
        const end = timeToMinutes(lesson.endLessonTime);
        if (end > start) {
          occupiedRanges.push({ start, end });
        }
      }
    };

    addBusyIntervals(groupSched, true);
    addBusyIntervals(teacherSched, false);

    // Sort intervals
    occupiedRanges.sort((a, b) => a.start - b.start);

    // Merge overlapping intervals
    const merged: TimeRange[] = [];
    for (const range of occupiedRanges) {
      if (merged.length === 0) {
        merged.push({ ...range });
      } else {
        const last = merged[merged.length - 1];
        if (range.start <= last.end) {
          last.end = Math.max(last.end, range.end);
        } else {
          merged.push({ ...range });
        }
      }
    }

    // Working day boundaries: 08:00 (480 min) to 19:30 (1170 min)
    const dayStart = 8 * 60; // 08:00
    const dayEnd = 19 * 60 + 30; // 19:30
    const freeSlots: Array<{ startTime: string; endTime: string; durationMinutes: number }> = [];

    let currentPointer = dayStart;
    for (const busy of merged) {
      if (busy.start > currentPointer) {
        const gap = busy.start - currentPointer;
        if (gap >= 30) {
          freeSlots.push({
            startTime: minutesToTime(currentPointer),
            endTime: minutesToTime(busy.start),
            durationMinutes: gap,
          });
        }
      }
      currentPointer = Math.max(currentPointer, busy.end);
    }

    if (dayEnd > currentPointer) {
      const gap = dayEnd - currentPointer;
      if (gap >= 30) {
        freeSlots.push({
          startTime: minutesToTime(currentPointer),
          endTime: minutesToTime(dayEnd),
          durationMinutes: gap,
        });
      }
    }

    res.json({
      weekday,
      weekNumber,
      groupNumber,
      teacherUrlId,
      freeSlots,
      disclaimer: 'Потенциальное свободное время по расписанию. Отсутствие занятий в расписании не гарантирует, что преподаватель доступен для консультации.',
    });
  } catch (error) {
    console.error('Error finding free slots:', error);
    res.status(500).json({
      error: 'Ошибка при расчёте общего свободного времени',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Vite Middleware or Production Static Handler
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BSUIR Hub] Server running at http://localhost:${PORT}`);
  });
}

setupServer();
