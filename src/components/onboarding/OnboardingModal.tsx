import React, { useState, useMemo } from 'react';
import { GraduationCap, Briefcase, Search, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { UserRole, SubgroupChoice, UserProfile } from '../../types/user';
import { StudentGroupSummary, EmployeeSummary } from '../../types/bsuir';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: Partial<UserProfile>) => void;
  groups: StudentGroupSummary[];
  teachers: EmployeeSummary[];
  isLoadingData?: boolean;
}

type OnboardingStep = 'welcome' | 'role_select' | 'details_select' | 'confirm';

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
  groups,
  teachers,
  isLoadingData = false,
}) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [role, setRole] = useState<UserRole>('student');
  const [selectedGroup, setSelectedGroup] = useState<StudentGroupSummary | null>(null);
  const [subgroup, setSubgroup] = useState<SubgroupChoice>(0);
  const [selectedTeacher, setSelectedTeacher] = useState<EmployeeSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  if (!isOpen) return null;

  const handleFinish = () => {
    if (role === 'student' && selectedGroup) {
      onComplete({
        isOnboarded: true,
        role: 'student',
        groupNumber: selectedGroup.name,
        subgroup,
        facultyName: selectedGroup.facultyAbbrev || selectedGroup.facultyName || '',
      });
    } else if (role === 'teacher' && selectedTeacher) {
      onComplete({
        isOnboarded: true,
        role: 'teacher',
        teacherUrlId: selectedTeacher.urlId,
        teacherFio: selectedTeacher.fio || `${selectedTeacher.lastName} ${selectedTeacher.firstName[0]}.${selectedTeacher.middleName[0]}.`,
        teacherDepartment: (selectedTeacher.academicDepartment || [])[0] || '',
        teacherPhoto: selectedTeacher.photoLink,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Step 1: Welcome Screen */}
        {step === 'welcome' && (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-white font-black text-2xl tracking-tighter mb-6">
              BH
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              BSUIR Hub
            </h1>
            <p className="text-base font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
              «Твой университет. В одном приложении.»
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 leading-relaxed max-w-xs">
              Расписание, преподаватели и всё важное для учёбы — всегда под рукой.
            </p>

            <button
              onClick={() => setStep('role_select')}
              className="mt-8 w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition active:scale-98"
            >
              <span>Начать</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Role Selection */}
        {step === 'role_select' && (
          <div className="p-6 sm:p-8 flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Выберите вашу роль
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Это поможет настроить приложение персонально для вас
            </p>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setRole('student')}
                className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-4 ${
                  role === 'student'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-3 rounded-xl ${
                    role === 'student'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    Студент
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Следи за парами, находи преподавателей и планируй учёбу
                  </div>
                </div>
              </button>

              <button
                onClick={() => setRole('teacher')}
                className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-4 ${
                  role === 'teacher'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-3 rounded-xl ${
                    role === 'teacher'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    Преподаватель
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Управляй своим учебным днём и быстро находи расписания групп
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep('welcome')}
                className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStep('details_select');
                }}
                className="flex-1 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition"
              >
                <span>Далее</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Details Select (Group for Student, Teacher search for Teacher) */}
        {step === 'details_select' && (
          <div className="p-6 flex flex-col flex-1 overflow-hidden">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {role === 'student' ? 'Выберите учебную группу' : 'Найдите себя в списке'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {role === 'student'
                ? 'Начните вводить номер группы или факультет'
                : 'Введите фамилию или кафедру'}
            </p>

            {/* Search Input */}
            <div className="relative mt-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={role === 'student' ? 'Например: 310101 или ФКП' : 'Например: Щербина или Каф.ИРТ'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 outline-none"
                autoFocus
              />
            </div>

            {/* Subgroup selector if student */}
            {role === 'student' && (
              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Ваша подгруппа:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 0 as SubgroupChoice, label: 'Вся группа' },
                    { id: 1 as SubgroupChoice, label: '1 подгруппа' },
                    { id: 2 as SubgroupChoice, label: '2 подгруппа' },
                  ].map((sg) => (
                    <button
                      key={sg.id}
                      onClick={() => setSubgroup(sg.id)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                        subgroup === sg.id
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {sg.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
              {isLoadingData ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  Загрузка справочника БГУИР...
                </div>
              ) : role === 'student' ? (
                filteredGroups.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Группа не найдена. Проверьте номер.
                  </div>
                ) : (
                  filteredGroups.map((g) => {
                    const isSelected = selectedGroup?.id === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroup(g)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-600'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {g.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {g.facultyAbbrev || g.facultyName} · {g.course} курс · {g.specialityAbbrev || g.specialityName}
                          </div>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })
                )
              ) : filteredTeachers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Преподаватель не найден. Попробуйте другую фамилию.
                </div>
              ) : (
                filteredTeachers.map((t) => {
                  const isSelected = selectedTeacher?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacher(t)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {t.fio || `${t.lastName} ${t.firstName} ${t.middleName}`}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {(t.academicDepartment || []).join(', ') || 'БГУИР'}
                          {t.degree ? ` · ${t.degree}` : ''}
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setStep('role_select')}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                disabled={role === 'student' ? !selectedGroup : !selectedTeacher}
                onClick={handleFinish}
                className="flex-1 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition"
              >
                <span>Завершить настройку</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
