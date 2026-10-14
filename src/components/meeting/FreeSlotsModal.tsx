import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, AlertTriangle, Calendar, User, Users } from 'lucide-react';
import { EmployeeSummary, FreeTimeSlot, StudentGroupSummary } from '../../types/bsuir';
import { ApiService } from '../../services/api';
import { BSUIR_WEEKDAYS, getTodayWeekdayName } from '../../utils/scheduleUtils';

interface FreeSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userGroupNumber: string;
  userSubgroup: number;
  initialTeacher?: EmployeeSummary | null;
  teachersList: EmployeeSummary[];
  currentWeek: number;
}

export const FreeSlotsModal: React.FC<FreeSlotsModalProps> = ({
  isOpen,
  onClose,
  userGroupNumber,
  userSubgroup,
  initialTeacher,
  teachersList,
  currentWeek,
}) => {
  const [selectedTeacher, setSelectedTeacher] = useState<EmployeeSummary | null>(initialTeacher || null);
  const [selectedDay, setSelectedDay] = useState<string>(
    BSUIR_WEEKDAYS.includes(getTodayWeekdayName() as any) ? getTodayWeekdayName() : 'Понедельник'
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek || 3);
  const [freeSlots, setFreeSlots] = useState<FreeTimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Update selected teacher if initialTeacher prop changes
  useEffect(() => {
    if (initialTeacher) {
      setSelectedTeacher(initialTeacher);
    } else if (!selectedTeacher && teachersList.length > 0) {
      setSelectedTeacher(teachersList[0]);
    }
  }, [initialTeacher, teachersList]);

  // Fetch free slots
  const calculateSlots = async () => {
    if (!userGroupNumber || !selectedTeacher?.urlId) {
      setErrorMessage('Укажите группу и преподавателя');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await ApiService.findFreeSlots(
        userGroupNumber,
        selectedTeacher.urlId,
        selectedDay,
        selectedWeek,
        userSubgroup
      );
      setFreeSlots(res.freeSlots || []);
    } catch (err) {
      console.error('Error finding free slots:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Не удалось получить данные');
      setFreeSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userGroupNumber && selectedTeacher?.urlId) {
      calculateSlots();
    }
  }, [isOpen, selectedTeacher, selectedDay, selectedWeek, userGroupNumber, userSubgroup]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-250">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Когда можно встретиться?
              </h2>
              <p className="text-xs text-slate-500">
                Поиск свободных окон в расписании
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Target details */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            {/* Teacher selector */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Преподаватель:
              </label>
              <select
                value={selectedTeacher?.urlId || ''}
                onChange={(e) => {
                  const found = teachersList.find((t) => t.urlId === e.target.value);
                  if (found) setSelectedTeacher(found);
                }}
                className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {teachersList.map((t) => (
                  <option key={t.urlId} value={t.urlId}>
                    {t.fio || `${t.lastName} ${t.firstName}`} — {(t.academicDepartment || [])[0] || 'БГУИР'}
                  </option>
                ))}
              </select>
            </div>

            {/* Student group tag */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Ваша группа: <strong className="text-slate-900 dark:text-white">{userGroupNumber}</strong> ({userSubgroup > 0 ? `${userSubgroup} подгр.` : 'вся группа'})</span>
            </div>
          </div>

          {/* Week & Day controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-slate-500">Неделя:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeek(w)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      selectedWeek === w
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {w} нед.
                  </button>
                ))}
              </div>
            </div>

            {/* Days carousel */}
            <div className="grid grid-cols-6 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {BSUIR_WEEKDAYS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    selectedDay === d
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][i]}
                </button>
              ))}
            </div>
          </div>

          {/* Important Legal & Academic Disclaimer */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Потенциальное свободное время по расписанию.</strong> Отсутствие занятий в расписании не гарантирует, что преподаватель свободен для консультации.
            </p>
          </div>

          {/* Slots list */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Свободные промежутки ({selectedDay}, {selectedWeek}-я неделя)
            </h3>

            {isLoading ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Анализируем пересечение расписаний...
              </div>
            ) : errorMessage ? (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs text-center">
                {errorMessage}
              </div>
            ) : freeSlots.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl text-slate-500 text-xs">
                В этот день пересекающихся свободных окон длительностью от 30 минут не найдено.
              </div>
            ) : (
              <div className="space-y-2">
                {freeSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                          {slot.startTime} — {slot.endTime}
                        </div>
                        <div className="text-xs text-slate-500">
                          Окно без занятий у обеих сторон
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      {slot.durationMinutes} мин
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
