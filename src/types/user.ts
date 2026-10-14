export type UserRole = 'student' | 'teacher';

export type SubgroupChoice = 0 | 1 | 2; // 0 = all, 1 = first, 2 = second

export type AppTheme = 'light' | 'dark' | 'system';

export interface FavoriteItem {
  id: string; // group number or employee urlId
  type: 'group' | 'teacher';
  title: string;
  subtitle?: string;
  photoLink?: string;
}

export interface UserProfile {
  isOnboarded: boolean;
  role: UserRole;
  // Student fields
  groupNumber?: string;
  subgroup: SubgroupChoice;
  facultyName?: string;
  // Teacher fields
  teacherUrlId?: string;
  teacherFio?: string;
  teacherDepartment?: string;
  teacherPhoto?: string;
  // Common preferences
  theme: AppTheme;
  favorites: FavoriteItem[];
  notificationsEnabled: boolean;
  selectedScheduleWeek?: number; // 1, 2, 3, 4
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  isOnboarded: false,
  role: 'student',
  groupNumber: '',
  subgroup: 0,
  theme: 'system',
  favorites: [],
  notificationsEnabled: false,
};
