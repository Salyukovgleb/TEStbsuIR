import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Briefcase,
  Search,
  Check,
  ArrowRight,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { BrandWordmark } from '../common/BrandWordmark';
import { StudentGroupSummary, EmployeeSummary } from '../../types/bsuir';
import { ScheduleSource, SOURCE_COLORS } from '../../types/scheduleSource';

interface FlowOnboardingProps {
  isOpen: boolean;
  onComplete: (source: Omit<ScheduleSource, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  groups: StudentGroupSummary[];
  teachers: EmployeeSummary[];
  isLoadingData?: boolean;
}

export const FlowOnboarding: React.FC<FlowOnboardingProps> = ({
  isOpen,
  onComplete,
  groups,
  teachers,
  isLoadingData = false,
}) => {
  const [step, setStep] = useState<'welcome' | 'role' | 'search'>('welcome');
  const [role, setRole] = useState<'student' | 'teacher' | 'other'>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<StudentGroupSummary | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<EmployeeSummary | null>(null);
  const [subgroup, setSubgroup] = useState<0 | 1 | 2>(0);

  if (!isOpen) return null;

  // Filter groups
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups.slice(0, 30);
    const q = searchQuery.toLowerCase().trim();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.facultyAbbrev && g.facultyAbbrev.toLowerCase().includes(q)) ||
        (g.specialityName && g.specialityName.toLowerCase().includes(q))
    ).slice(0, 30);
  }, [groups, searchQuery]);

  // Filter teachers (normalize e/ё)
  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return teachers.slice(0, 30);
    const q = searchQuery.toLowerCase().replace(/ё/g, 'е').trim();
    return teachers.filter((t) => {
      const full = `${t.lastName} ${t.firstName} ${t.middleName}`.toLowerCase().replace(/ё/g, 'е');
      const dept = (t.academicDepartment || []).join(' ').toLowerCase();
      return full.includes(q) || dept.includes(q);
    }).slice(0, 30);
  }, [teachers, searchQuery]);

  const handleFinish = () => {
    if (role === 'student' && selectedGroup) {
      onComplete({
        type: 'student',
        provider: 'bsuir_group',
        providerEntityId: selectedGroup.name,
        displayName: 'Моя учёба',
        subgroup,
        isPrimary: true,
        includeInCombined: true,
        isFavorite: true,
        colorMarker: SOURCE_COLORS[0],
        meta: {
          facultyAbbrev: selectedGroup.facultyAbbrev || selectedGroup.facultyName,
          course: selectedGroup.course,
        },
      });
    } else if (role === 'teacher' && selectedTeacher) {
      onComplete({
        type: 'teacher',
        provider: 'bsuir_employee',
        providerEntityId: selectedTeacher.urlId,
        displayName: 'Преподаю',
        subgroup: 0,
        isPrimary: true,
        includeInCombined: true,
        isFavorite: true,
        colorMarker: SOURCE_COLORS[0],
        meta: {
          fio: selectedTeacher.fio,
          department: (selectedTeacher.academicDepartment || [])[0],
          photoLink: selectedTeacher.photoLink,
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Step 1: Welcome Screen */}
        {step === 'welcome' && (
          <div className="p-7 sm:p-8 flex flex-col items-center text-center">
            {/* Minimalist Brand Mark */}
            <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-2xl tracking-tighter mb-6 shadow-md">
              B
            </div>

            {/* Logo matching exact specification: BSUIR Flow / Твой ритм университета */}
            <BrandWordmark size="lg" showSlogan={true} className="items-center" />

            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-6 leading-relaxed">
              Все твои расписания в одном месте.
            </p>

            <button
              onClick={() => setStep('role')}
              className="mt-8 w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 active:scale-98 transition"
            >
              <span>Начать</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step 2: What to add first? */}
        {step === 'role' && (
          <div className="p-6 sm:p-7 flex flex-col">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Что добавим первым?
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Позже вы сможете добавить любые другие расписания
            </p>

            <div className="mt-5 space-y-2.5">
              <button
                onClick={() => {
                  setRole('student');
                  setStep('search');
                }}
                className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900 text-left transition flex items-center gap-3.5 active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Я учусь
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Студенческая группа БГУИР
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setRole('teacher');
                  setStep('search');
                }}
                className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900 text-left transition flex items-center gap-3.5 active:scale-98"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Я преподаю
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Поиск по ФИО в списке сотрудников
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setRole('student');
                  setStep('search');
                }}
                className="text-xs font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
              >
                Другое расписание
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Search group / teacher */}
        {step === 'search' && (
          <div className="p-6 flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setStep('role')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {role === 'student' ? 'Поиск группы' : 'Поиск преподавателя'}
              </h2>
            </div>

            {/* Subgroup selector if student */}
            {role === 'student' && (
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-slate-500">Подгруппа:</span>
                <div className="flex gap-1">
                  {[
                    { id: 0 as const, label: 'Вся' },
                    { id: 1 as const, label: '1 п.' },
                    { id: 2 as const, label: '2 п.' },
                  ].map((sg) => (
                    <button
                      key={sg.id}
                      onClick={() => setSubgroup(sg.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                        subgroup === sg.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {sg.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={role === 'student' ? 'Например: 576701' : 'Например: Щербина'}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600"
                autoFocus
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-56">
              {isLoadingData ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Загрузка данных БГУИР...
                </div>
              ) : role === 'student' ? (
                filteredGroups.map((g) => {
                  const isSelected = selectedGroup?.id === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroup(g)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-600'
                          : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {g.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {g.facultyAbbrev || g.facultyName} · {g.course} курс
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                filteredTeachers.map((t) => {
                  const isSelected = selectedTeacher?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacher(t)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-600'
                          : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.fio || `${t.lastName} ${t.firstName}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {(t.academicDepartment || [])[0] || 'БГУИР'}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Confirm */}
            <button
              disabled={role === 'student' ? !selectedGroup : !selectedTeacher}
              onClick={handleFinish}
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <span>Сохранить расписание</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
