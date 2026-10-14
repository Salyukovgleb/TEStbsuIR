/**
 * BSUIR Hub — Main Application
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/common/Header';
import { BottomNav, NavTab } from './components/common/BottomNav';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { StudentHome } from './components/home/StudentHome';
import { TeacherHome } from './components/home/TeacherHome';
import { ScheduleView } from './components/schedule/ScheduleView';
import { SearchView } from './components/search/SearchView';
import { ProfileView } from './components/profile/ProfileView';
import { LessonDetailModal } from './components/home/LessonDetailModal';
import { TeacherProfileModal } from './components/teacher/TeacherProfileModal';
import { FreeSlotsModal } from './components/meeting/FreeSlotsModal';

import {
  StudentGroupSummary,
  EmployeeSummary,
  FullScheduleResponse,
  ScheduleLesson,
  LessonEmployee,
  ScheduleDiffItem,
} from './types/bsuir';
import { UserProfile, FavoriteItem } from './types/user';
import { StorageService } from './services/storage';
import { ApiService } from './services/api';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // User Profile
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getUserProfile());

  // Navigation state
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Academic week
  const [currentWeek, setCurrentWeek] = useState<number>(3);

  // Catalogs
  const [groups, setGroups] = useState<StudentGroupSummary[]>([]);
  const [teachers, setTeachers] = useState<EmployeeSummary[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false);

  // User's own primary schedule
  const [userSchedule, setUserSchedule] = useState<FullScheduleResponse | null>(null);
  const [isLoadingUserSchedule, setIsLoadingUserSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Currently viewed schedule in "Расписание" tab (defaults to user schedule, but can be any group or teacher viewed from search)
  const [viewingTarget, setViewingTarget] = useState<{
    type: 'user' | 'group' | 'teacher';
    id: string;
    title: string;
    schedule: FullScheduleResponse | null;
  } | null>(null);

  // Modals & Drawers
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!profile.isOnboarded);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ScheduleDiffItem[]>(() =>
    StorageService.getNotifications()
  );
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    StorageService.getUnreadCount()
  );

  // Lesson Detail Modal
  const [selectedLesson, setSelectedLesson] = useState<{
    lesson: ScheduleLesson;
    day: string;
  } | null>(null);

  // Teacher Profile Modal
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<EmployeeSummary | null>(null);

  // Free Slots Modal
  const [isFreeSlotsOpen, setIsFreeSlotsOpen] = useState(false);
  const [freeSlotsTeacher, setFreeSlotsTeacher] = useState<EmployeeSummary | null>(null);

  // Apply Theme
  useEffect(() => {
    const root = document.documentElement;
    if (profile.theme === 'dark') {
      root.classList.add('dark');
    } else if (profile.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    }
  }, [profile.theme]);

  // Load Initial Academic Week and Catalogs
  useEffect(() => {
    ApiService.fetchCurrentWeek().then((w) => setCurrentWeek(w));

    setIsLoadingCatalogs(true);
    Promise.all([ApiService.fetchGroups(), ApiService.fetchTeachers()])
      .then(([gList, tList]) => {
        setGroups(gList);
        setTeachers(tList);
      })
      .finally(() => setIsLoadingCatalogs(false));
  }, []);

  // Load Primary User Schedule
  const loadUserSchedule = useCallback(async () => {
    if (!profile.isOnboarded) return;

    setIsLoadingUserSchedule(true);
    setScheduleError(null);

    try {
      if (profile.role === 'student' && profile.groupNumber) {
        const res = await ApiService.fetchGroupSchedule(profile.groupNumber, true);
        setUserSchedule(res.data);
      } else if (profile.role === 'teacher' && profile.teacherUrlId) {
        const res = await ApiService.fetchTeacherSchedule(profile.teacherUrlId, true);
        setUserSchedule(res.data);
      }
      // Refresh notifications and unread
      setNotifications(StorageService.getNotifications());
      setUnreadCount(StorageService.getUnreadCount());
    } catch (err) {
      console.error('Failed to load user schedule:', err);
      setScheduleError(err instanceof Error ? err.message : 'Ошибка загрузки расписания');
    } finally {
      setIsLoadingUserSchedule(false);
    }
  }, [profile]);

  useEffect(() => {
    loadUserSchedule();
  }, [loadUserSchedule]);

  // Update Profile
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updated };
    setProfile(newProfile);
    StorageService.saveUserProfile(newProfile);
  };

  // Onboarding Complete
  const handleOnboardingComplete = (data: Partial<UserProfile>) => {
    const updated = {
      ...profile,
      ...data,
      isOnboarded: true,
    };
    setProfile(updated);
    StorageService.saveUserProfile(updated);
    setIsOnboardingOpen(false);
    setViewingTarget(null); // reset any foreign view
  };

  // Toggle Favorite
  const handleToggleFavorite = (item: FavoriteItem) => {
    const isAdded = StorageService.toggleFavorite(item);
    setProfile(StorageService.getUserProfile());
  };

  // Select Group from Search -> switch to Schedule tab
  const handleSelectGroupFromSearch = async (group: StudentGroupSummary) => {
    setViewingTarget({
      type: 'group',
      id: group.name,
      title: `Группа ${group.name}`,
      schedule: null,
    });
    setActiveTab('schedule');

    try {
      const res = await ApiService.fetchGroupSchedule(group.name, false);
      setViewingTarget((prev) => (prev ? { ...prev, schedule: res.data } : null));
    } catch (err) {
      console.warn('Failed to load group schedule:', err);
    }
  };

  // Select Favorite item from quick bar
  const handleSelectFavoriteSchedule = async (item: FavoriteItem) => {
    if (item.type === 'group') {
      setViewingTarget({
        type: 'group',
        id: item.id,
        title: `Группа ${item.title}`,
        schedule: null,
      });
      setActiveTab('schedule');
      try {
        const res = await ApiService.fetchGroupSchedule(item.id, false);
        setViewingTarget((prev) => (prev ? { ...prev, schedule: res.data } : null));
      } catch (err) {
        console.warn('Failed to load favorite group schedule:', err);
      }
    } else {
      setViewingTarget({
        type: 'teacher',
        id: item.id,
        title: item.title,
        schedule: null,
      });
      setActiveTab('schedule');
      try {
        const res = await ApiService.fetchTeacherSchedule(item.id, false);
        setViewingTarget((prev) => (prev ? { ...prev, schedule: res.data } : null));
      } catch (err) {
        console.warn('Failed to load favorite teacher schedule:', err);
      }
    }
  };

  // Select Teacher from Search or Lesson -> open Teacher Profile Modal
  const handleSelectTeacher = (teacher: EmployeeSummary | LessonEmployee) => {
    const fullTeacher =
      teachers.find((t) => t.urlId === teacher.urlId) || {
        id: teacher.id,
        urlId: teacher.urlId,
        firstName: teacher.firstName || '',
        lastName: teacher.lastName || '',
        middleName: teacher.middleName || '',
        fio: teacher.fio || `${teacher.lastName} ${teacher.firstName}`,
        degree: teacher.degree,
        rank: teacher.rank,
        photoLink: teacher.photoLink,
      };
    setSelectedTeacherModal(fullTeacher);
  };

  // Reset all data
  const handleResetAllData = () => {
    StorageService.clearAllData();
    const fresh = StorageService.getUserProfile();
    setProfile(fresh);
    setUserSchedule(null);
    setViewingTarget(null);
    setNotifications([]);
    setUnreadCount(0);
    setIsOnboardingOpen(true);
  };

  // Active schedule being viewed in "Расписание" tab
  const activeScheduleToRender =
    viewingTarget && viewingTarget.type !== 'user'
      ? viewingTarget.schedule
      : userSchedule;

  const activeScheduleTitle =
    viewingTarget && viewingTarget.type !== 'user'
      ? viewingTarget.title
      : profile.role === 'student'
      ? `Группа ${profile.groupNumber}`
      : profile.teacherFio || 'Моё расписание';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Header */}
      <Header
        currentWeek={currentWeek}
        unreadCount={unreadCount}
        onOpenNotifications={() => {
          setIsNotificationsOpen(true);
          StorageService.markNotificationsRead();
          setUnreadCount(0);
        }}
        subtitle={
          profile.role === 'student' && profile.groupNumber
            ? `Группа ${profile.groupNumber}`
            : profile.teacherFio || undefined
        }
      />

      {/* Viewing foreign schedule banner if viewing another group/teacher */}
      {activeTab === 'schedule' && viewingTarget && viewingTarget.type !== 'user' && (
        <div className="bg-indigo-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 truncate">
            <span className="opacity-90">Просмотр расписания:</span>
            <span className="font-extrabold">{viewingTarget.title}</span>
          </div>
          <button
            onClick={() => setViewingTarget(null)}
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg transition active:scale-95 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Вернуться к моему</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 sm:pt-6">
        {/* Error State if initial user schedule failed and not offline cached */}
        {scheduleError && !userSchedule && activeTab === 'home' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{scheduleError}</span>
            </div>
            <button
              onClick={loadUserSchedule}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition shrink-0"
            >
              Повторить
            </button>
          </div>
        )}

        {/* Tab 1: Home */}
        {activeTab === 'home' &&
          (profile.role === 'student' ? (
            <StudentHome
              groupNumber={profile.groupNumber || ''}
              subgroup={profile.subgroup}
              facultyName={profile.facultyName}
              schedule={userSchedule}
              currentWeek={currentWeek}
              isLoading={isLoadingUserSchedule}
              onOpenSchedule={() => {
                setViewingTarget(null);
                setActiveTab('schedule');
              }}
              onOpenSearch={() => setActiveTab('search')}
              onOpenFreeSlots={() => {
                setFreeSlotsTeacher(teachers[0] || null);
                setIsFreeSlotsOpen(true);
              }}
              onSelectLesson={(lesson) =>
                setSelectedLesson({ lesson, day: 'Сегодня' })
              }
              onOpenTeacherProfile={handleSelectTeacher}
              onOpenExams={() => {
                setViewingTarget(null);
                setActiveTab('schedule');
              }}
            />
          ) : (
            <TeacherHome
              teacherFio={profile.teacherFio || ''}
              teacherDepartment={profile.teacherDepartment}
              schedule={userSchedule}
              currentWeek={currentWeek}
              isLoading={isLoadingUserSchedule}
              onOpenSchedule={() => {
                setViewingTarget(null);
                setActiveTab('schedule');
              }}
              onOpenSearch={() => setActiveTab('search')}
              onSelectLesson={(lesson) =>
                setSelectedLesson({ lesson, day: 'Сегодня' })
              }
            />
          ))}

        {/* Tab 2: Schedule */}
        {activeTab === 'schedule' && (
          <ScheduleView
            schedule={activeScheduleToRender}
            targetTitle={activeScheduleTitle}
            currentWeek={currentWeek}
            userSubgroup={profile.subgroup}
            favorites={profile.favorites}
            isViewingForeign={!!viewingTarget && viewingTarget.type !== 'user'}
            isLoading={
              viewingTarget && viewingTarget.type !== 'user'
                ? !viewingTarget.schedule
                : isLoadingUserSchedule
            }
            onRefresh={loadUserSchedule}
            onSelectLesson={(lesson, day) => setSelectedLesson({ lesson, day })}
            onOpenTeacher={handleSelectTeacher}
            onSelectFavorite={handleSelectFavoriteSchedule}
            onResetToMySchedule={() => setViewingTarget(null)}
          />
        )}

        {/* Tab 3: Search */}
        {activeTab === 'search' && (
          <SearchView
            groups={groups}
            teachers={teachers}
            favorites={profile.favorites}
            isLoading={isLoadingCatalogs}
            onToggleFavorite={handleToggleFavorite}
            onSelectTeacher={handleSelectTeacher}
            onSelectGroup={handleSelectGroupFromSearch}
          />
        )}

        {/* Tab 4: Profile */}
        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onResetAllData={handleResetAllData}
            onOpenRoleChange={() => setIsOnboardingOpen(true)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
        groups={groups}
        teachers={teachers}
        isLoadingData={isLoadingCatalogs}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() => {
          StorageService.markNotificationsRead();
          setUnreadCount(0);
        }}
      />

      {/* Lesson Detail Modal */}
      <LessonDetailModal
        isOpen={!!selectedLesson}
        lesson={selectedLesson?.lesson || null}
        dayName={selectedLesson?.day}
        onClose={() => setSelectedLesson(null)}
        onOpenTeacherProfile={handleSelectTeacher}
        onFindFreeSlotsWithTeacher={(teacher) => {
          const found = teachers.find((t) => t.urlId === teacher.urlId) || null;
          setFreeSlotsTeacher(found);
          setIsFreeSlotsOpen(true);
        }}
      />

      {/* Teacher Profile Modal */}
      <TeacherProfileModal
        isOpen={!!selectedTeacherModal}
        teacher={selectedTeacherModal}
        onClose={() => setSelectedTeacherModal(null)}
        isFavorite={
          selectedTeacherModal
            ? StorageService.isFavorite(selectedTeacherModal.urlId, 'teacher')
            : false
        }
        onToggleFavorite={() => {
          if (selectedTeacherModal) {
            handleToggleFavorite({
              id: selectedTeacherModal.urlId,
              type: 'teacher',
              title: selectedTeacherModal.fio,
              subtitle: (selectedTeacherModal.academicDepartment || [])[0],
              photoLink: selectedTeacherModal.photoLink,
            });
          }
        }}
        onOpenFreeSlots={(teacher) => {
          setFreeSlotsTeacher(teacher);
          setIsFreeSlotsOpen(true);
        }}
        onSelectLesson={(lesson) =>
          setSelectedLesson({ lesson, day: 'Расписание' })
        }
        currentWeek={currentWeek}
      />

      {/* Free Slots Finder Modal */}
      <FreeSlotsModal
        isOpen={isFreeSlotsOpen}
        onClose={() => setIsFreeSlotsOpen(false)}
        userGroupNumber={profile.groupNumber || '310101'}
        userSubgroup={profile.subgroup}
        initialTeacher={freeSlotsTeacher}
        teachersList={teachers}
        currentWeek={currentWeek}
      />
    </div>
  );
}
