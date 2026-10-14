import { UserProfile, DEFAULT_USER_PROFILE, FavoriteItem } from '../types/user';
import { FullScheduleResponse, ScheduleDiffItem } from '../types/bsuir';

const KEYS = {
  USER_PROFILE: 'bsuir_hub_profile_v1',
  CACHED_GROUPS: 'bsuir_hub_cached_groups',
  CACHED_TEACHERS: 'bsuir_hub_cached_teachers',
  SCHEDULE_PREFIX: 'bsuir_hub_schedule_',
  NOTIFICATIONS: 'bsuir_hub_notifications',
  UNREAD_NOTIFICATIONS: 'bsuir_hub_unread_count',
  LAST_UPDATE_TIME: 'bsuir_hub_last_update_',
};

export const StorageService = {
  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(KEYS.USER_PROFILE);
      if (!data) return DEFAULT_USER_PROFILE;
      return { ...DEFAULT_USER_PROFILE, ...JSON.parse(data) };
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  },

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  },

  getFavorites(): FavoriteItem[] {
    const profile = this.getUserProfile();
    return profile.favorites || [];
  },

  toggleFavorite(item: FavoriteItem): boolean {
    const profile = this.getUserProfile();
    const existingIndex = profile.favorites.findIndex(
      (f) => f.id === item.id && f.type === item.type
    );
    let isAdded = false;
    if (existingIndex >= 0) {
      profile.favorites.splice(existingIndex, 1);
      isAdded = false;
    } else {
      profile.favorites.push(item);
      isAdded = true;
    }
    this.saveUserProfile(profile);
    return isAdded;
  },

  isFavorite(id: string, type: 'group' | 'teacher'): boolean {
    const profile = this.getUserProfile();
    return profile.favorites?.some((f) => f.id === id && f.type === type) || false;
  },

  getCachedSchedule(key: string): { data: FullScheduleResponse; timestamp: number } | null {
    try {
      const raw = localStorage.getItem(KEYS.SCHEDULE_PREFIX + key);
      const timeRaw = localStorage.getItem(KEYS.LAST_UPDATE_TIME + key);
      if (!raw) return null;
      return {
        data: JSON.parse(raw),
        timestamp: timeRaw ? Number(timeRaw) : Date.now(),
      };
    } catch {
      return null;
    }
  },

  saveCachedSchedule(key: string, data: FullScheduleResponse): void {
    try {
      localStorage.setItem(KEYS.SCHEDULE_PREFIX + key, JSON.stringify(data));
      localStorage.setItem(KEYS.LAST_UPDATE_TIME + key, String(Date.now()));
    } catch (e) {
      console.warn('LocalStorage limit reached or quota exceeded:', e);
    }
  },

  getCachedGroups(): any[] | null {
    try {
      const raw = localStorage.getItem(KEYS.CACHED_GROUPS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveCachedGroups(groups: any[]): void {
    try {
      localStorage.setItem(KEYS.CACHED_GROUPS, JSON.stringify(groups));
    } catch {}
  },

  getCachedTeachers(): any[] | null {
    try {
      const raw = localStorage.getItem(KEYS.CACHED_TEACHERS);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveCachedTeachers(teachers: any[]): void {
    try {
      localStorage.setItem(KEYS.CACHED_TEACHERS, JSON.stringify(teachers));
    } catch {}
  },

  getNotifications(): ScheduleDiffItem[] {
    try {
      const raw = localStorage.getItem(KEYS.NOTIFICATIONS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  addNotification(diff: ScheduleDiffItem): void {
    try {
      const current = this.getNotifications();
      const updated = [diff, ...current].slice(0, 30); // keep up to 30 notifications
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(updated));
      const unread = this.getUnreadCount() + 1;
      localStorage.setItem(KEYS.UNREAD_NOTIFICATIONS, String(unread));
    } catch {}
  },

  getUnreadCount(): number {
    try {
      const val = localStorage.getItem(KEYS.UNREAD_NOTIFICATIONS);
      return val ? Math.max(0, parseInt(val, 10)) : 0;
    } catch {
      return 0;
    }
  },

  markNotificationsRead(): void {
    try {
      localStorage.setItem(KEYS.UNREAD_NOTIFICATIONS, '0');
    } catch {}
  },

  clearAllData(): void {
    localStorage.clear();
  },
};
