import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Users,
  Search,
  Check,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  ScheduleSource,
  ScheduleSourceType,
  ScheduleProviderType,
  SOURCE_COLORS,
} from '../../types/scheduleSource';
import { StudentGroupSummary, EmployeeSummary } from '../../types/bsuir';

interface AddScheduleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (source: Omit<ScheduleSource, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  groups: StudentGroupSummary[];
  teachers: EmployeeSummary[];
  existingSourcesCount: number;
}

export const AddScheduleSheet: React.FC<AddScheduleSheetProps> = ({
  isOpen,
  onClose,
  onAddSource,
  groups,
  teachers,
  existingSourcesCount,
}) => {
  const [step, setStep] = useState<'purpose' | 'details' | 'manual'>('purpose');
  const [selectedType, setSelectedType] = useState<ScheduleSourceType>('student');
  const [providerType, setProviderType] = useState<ScheduleProviderType>('bsuir_group');

  // Search & details
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<StudentGroupSummary | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<EmployeeSummary | null>(null);
  const [subgroup, setSubgroup] = useState<0 | 1 | 2>(0);
  const [customName, setCustomName] = useState('');

  // Manual lesson fields if creating manual schedule
  const [manualSubject, setManualSubject] = useState('');
  const [manualTimeStart, setManualTimeStart] = useState('09:00');
  const [manualTimeEnd, setManualTimeEnd] = useState('10:35');
  const [manualDay, setManualDay] = useState('Понедельник');
  const [manualRoom, setManualRoom] = useState('');

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

  const handleSelectPurpose = (type: ScheduleSourceType, provider: ScheduleProviderType) => {
    setSelectedType(type);
    setProviderType(provider);
    setSearchQuery('');
    setSelectedGroup(null);
    setSelectedTeacher(null);

    if (type === 'student') setCustomName('Моя учёба');
    else if (type === 'teacher') setCustomName('Преподаю');
    else if (type === 'secondary_study') setCustomName('Магистратура');
    else if (type === 'friend') setCustomName('Расписание друга');
    else setCustomName('Дополнительное расписание');

    setStep('details');
  };

  const handleSave = () => {
    const color = SOURCE_COLORS[existingSourcesCount % SOURCE_COLORS.length];

    if (providerType === 'bsuir_group' && selectedGroup) {
      onAddSource({
        type: selectedType,
        provider: 'bsuir_group',
        providerEntityId: selectedGroup.name,
        displayName: customName.trim() || `Группа ${selectedGroup.name}`,
        subgroup,
        isPrimary: existingSourcesCount === 0,
        includeInCombined: selectedType !== 'friend',
        isFavorite: true,
        colorMarker: color,
        meta: {
          facultyAbbrev: selectedGroup.facultyAbbrev || selectedGroup.facultyName,
          course: selectedGroup.course,
        },
      });
      onClose();
    } else if (providerType === 'bsuir_employee' && selectedTeacher) {
      onAddSource({
        type: selectedType,
        provider: 'bsuir_employee',
        providerEntityId: selectedTeacher.urlId,
        displayName: customName.trim() || selectedTeacher.fio || selectedTeacher.lastName,
        subgroup: 0,
        isPrimary: existingSourcesCount === 0,
        includeInCombined: selectedType !== 'friend',
        isFavorite: true,
        colorMarker: color,
        meta: {
          fio: selectedTeacher.fio,
          department: (selectedTeacher.academicDepartment || [])[0],
          photoLink: selectedTeacher.photoLink,
        },
      });
      onClose();
    } else if (providerType === 'manual' && manualSubject.trim()) {
      onAddSource({
        type: selectedType,
        provider: 'manual',
        providerEntityId: 'manual_' + Date.now(),
        displayName: customName.trim() || 'Своё расписание',
        subgroup: 0,
        isPrimary: existingSourcesCount === 0,
        includeInCombined: true,
        isFavorite: true,
        colorMarker: color,
        manualLessons: [
          {
            id: 'm1',
            subject: manualSubject.trim(),
            lessonTypeAbbrev: 'ЗАН',
            startLessonTime: manualTimeStart,
            endLessonTime: manualTimeEnd,
            auditories: manualRoom ? [manualRoom] : [],
            weekday: manualDay,
            weekNumber: [1, 2, 3, 4],
          },
        ],
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-250">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step !== 'purpose' && (
              <button
                onClick={() => setStep('purpose')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {step === 'purpose' ? 'Добавить расписание' : 'Параметры расписания'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Purpose Selection */}
        {step === 'purpose' && (
          <div className="p-5 overflow-y-auto space-y-2.5">
            <p className="text-xs text-slate-400 font-medium mb-1">
              Для чего вы хотите добавить новое расписание?
            </p>

            {[
              {
                type: 'student' as ScheduleSourceType,
                provider: 'bsuir_group' as ScheduleProviderType,
                title: 'Моя учёба',
                desc: 'Основная студенческая группа БГУИР',
                icon: GraduationCap,
              },
              {
                type: 'teacher' as ScheduleSourceType,
                provider: 'bsuir_employee' as ScheduleProviderType,
                title: 'Преподаю',
                desc: 'Расписание преподавателя или ассистента',
                icon: Briefcase,
              },
              {
                type: 'secondary_study' as ScheduleSourceType,
                provider: 'bsuir_group' as ScheduleProviderType,
                title: 'Вторая учёба',
                desc: 'Магистратура или параллельная специальность',
                icon: BookOpen,
              },
              {
                type: 'friend' as ScheduleSourceType,
                provider: 'bsuir_group' as ScheduleProviderType,
                title: 'Расписание друга',
                desc: 'Следите за парами однокурсника или знакомого',
                icon: Users,
              },
              {
                type: 'manual' as ScheduleSourceType,
                provider: 'manual' as ScheduleProviderType,
                title: 'Своё расписание (вручную)',
                desc: 'Курсы, факультативы или сторонние занятия',
                icon: Calendar,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={() => handleSelectPurpose(item.type, item.provider)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900 text-left transition flex items-center gap-3.5 active:scale-98"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Details / Search */}
        {step === 'details' && (
          <div className="p-5 flex flex-col flex-1 overflow-hidden space-y-3">
            {/* Display Name Input */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Название в приложении
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Например: Моя учёба, Артём, Магистратура..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* If Group Provider: Search Group & Select Subgroup */}
            {providerType === 'bsuir_group' && (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Номер группы БГУИР
                  </label>
                  {selectedType !== 'friend' && (
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
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {sg.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Например: 576701 или ФКП..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600"
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-56">
                  {filteredGroups.map((g) => {
                    const isSelected = selectedGroup?.id === g.id;
                    return (
                      <button
                        key={g.id}
                        onClick={() => {
                          setSelectedGroup(g);
                          if (!customName || customName === 'Моя учёба' || customName === 'Вторая учёба') {
                            setCustomName(`${selectedType === 'friend' ? 'Друг' : 'Учёба'} (${g.name})`);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-600'
                            : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {g.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {g.facultyAbbrev || g.facultyName} · {g.course} курс
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* If Teacher Provider: Search Teacher */}
            {providerType === 'bsuir_employee' && (
              <>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  ФИО преподавателя
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Например: Щербина или Каф.ИРТ..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600"
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-56">
                  {filteredTeachers.map((t) => {
                    const isSelected = selectedTeacher?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTeacher(t);
                          if (!customName || customName === 'Преподаю') {
                            setCustomName(t.fio || `${t.lastName} ${t.firstName}`);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-1 ring-indigo-600'
                            : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white">
                            {t.fio || `${t.lastName} ${t.firstName} ${t.middleName}`}
                          </div>
                          <div className="text-xs text-slate-400">
                            {(t.academicDepartment || [])[0] || 'БГУИР'}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* If Manual Provider */}
            {providerType === 'manual' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Название предмета
                  </label>
                  <input
                    type="text"
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    placeholder="Например: Английский язык B2"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Начало
                    </label>
                    <input
                      type="time"
                      value={manualTimeStart}
                      onChange={(e) => setManualTimeStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Окончание
                    </label>
                    <input
                      type="time"
                      value={manualTimeEnd}
                      onChange={(e) => setManualTimeEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-bold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      День недели
                    </label>
                    <select
                      value={manualDay}
                      onChange={(e) => setManualDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm font-semibold outline-none"
                    >
                      {['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Аудитория
                    </label>
                    <input
                      type="text"
                      value={manualRoom}
                      onChange={(e) => setManualRoom(e.target.value)}
                      placeholder="Например: 102"
                      className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-sm outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Add Action */}
            <div className="pt-2">
              <button
                disabled={
                  providerType === 'bsuir_group'
                    ? !selectedGroup
                    : providerType === 'bsuir_employee'
                    ? !selectedTeacher
                    : !manualSubject.trim()
                }
                onClick={handleSave}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-sm shadow-md shadow-indigo-600/20 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Добавить в «Мои расписания»</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
