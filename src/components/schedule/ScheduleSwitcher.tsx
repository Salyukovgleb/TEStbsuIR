import React, { useState } from 'react';
import {
  ChevronDown,
  Plus,
  Layers,
  Check,
  MoreVertical,
  Trash2,
  Edit2,
  Star,
  Eye,
  EyeOff,
  X,
  AlertCircle,
} from 'lucide-react';
import { ScheduleSource } from '../../types/scheduleSource';

interface ScheduleSwitcherProps {
  sources: ScheduleSource[];
  activeSourceId: string | 'combined';
  onSelectSource: (id: string | 'combined') => void;
  onOpenAddSchedule: () => void;
  onUpdateSource: (id: string, updates: Partial<ScheduleSource>) => void;
  onRemoveSource: (id: string) => void;
  onSetPrimarySource: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleSwitcher: React.FC<ScheduleSwitcherProps> = ({
  sources,
  activeSourceId,
  onSelectSource,
  onOpenAddSchedule,
  onUpdateSource,
  onRemoveSource,
  onSetPrimarySource,
  isOpen,
  onClose,
}) => {
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuSourceId, setMenuSourceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const combinedCount = sources.filter((s) => s.includeInCombined).length;
  const isCombinedActive = activeSourceId === 'combined';

  const startRename = (source: ScheduleSource) => {
    setEditingSourceId(source.id);
    setEditName(source.displayName);
    setMenuSourceId(null);
  };

  const saveRename = (id: string) => {
    if (editName.trim()) {
      onUpdateSource(id, { displayName: editName.trim() });
    }
    setEditingSourceId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-250">
        {/* Handle for mobile */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Мои расписания
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Один аккаунт — несколько источников
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {/* Combined Mode Option (if >= 2 sources) */}
          {sources.length >= 2 && (
            <button
              onClick={() => {
                onSelectSource('combined');
                onClose();
              }}
              className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center justify-between gap-3 ${
                isCombinedActive
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                  : 'border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Вместе</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                      {combinedCount} источн.
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Общая лента учёбы, преподавания и совмещения
                  </div>
                </div>
              </div>
              {isCombinedActive && <Check className="w-5 h-5 text-indigo-600 shrink-0" />}
            </button>
          )}

          {/* Sources List */}
          {sources.map((source) => {
            const isSelected = !isCombinedActive && activeSourceId === source.id;
            const isEditing = editingSourceId === source.id;
            const isMenuOpen = menuSourceId === source.id;

            return (
              <div
                key={source.id}
                className={`relative p-3.5 rounded-2xl border transition ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Left tap area to select */}
                  <div
                    onClick={() => {
                      onSelectSource(source.id);
                      onClose();
                    }}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  >
                    {/* Color dot */}
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ring-2 ring-white dark:ring-slate-900"
                      style={{ backgroundColor: source.colorMarker }}
                    />

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveRename(source.id)}
                            className="text-xs font-bold px-2 py-1 rounded bg-white dark:bg-slate-800 border border-indigo-500 text-slate-900 dark:text-white outline-none w-full"
                            autoFocus
                          />
                          <button
                            onClick={() => saveRename(source.id)}
                            className="p-1 rounded bg-indigo-600 text-white text-xs font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{source.displayName}</span>
                            {source.isPrimary && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                Основное
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 truncate mt-0.5">
                            {source.provider === 'bsuir_group'
                              ? `Группа ${source.providerEntityId}${source.subgroup > 0 ? ` · ${source.subgroup} п.` : ''}`
                              : source.provider === 'bsuir_employee'
                              ? `Преподаватель (${source.meta?.fio || source.providerEntityId})`
                              : 'Ручное расписание'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions / Menu */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Include in Combined Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateSource(source.id, { includeInCombined: !source.includeInCombined });
                      }}
                      className={`p-1.5 rounded-lg transition ${
                        source.includeInCombined
                          ? 'text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
                          : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
                      }`}
                      title={source.includeInCombined ? 'Включено в «Вместе»' : 'Исключено из «Вместе»'}
                    >
                      {source.includeInCombined ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Context Menu Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuSourceId(isMenuOpen ? null : source.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dropdown Menu for Source */}
                {isMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-2 animate-in fade-in"
                  >
                    <button
                      onClick={() => startRename(source)}
                      className="flex items-center gap-1 hover:text-indigo-600 py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Переименовать</span>
                    </button>

                    {!source.isPrimary && (
                      <button
                        onClick={() => {
                          onSetPrimarySource(source.id);
                          setMenuSourceId(null);
                        }}
                        className="flex items-center gap-1 hover:text-amber-600 py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>Сделать основным</span>
                      </button>
                    )}

                    {sources.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Удалить расписание «${source.displayName}»?`)) {
                            onRemoveSource(source.id);
                          }
                          setMenuSourceId(null);
                        }}
                        className="flex items-center gap-1 text-rose-600 py-1 px-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Удалить</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: + Add Schedule */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => {
              onClose();
              onOpenAddSchedule();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 transition"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Добавить расписание</span>
          </button>
        </div>
      </div>
    </div>
  );
};
