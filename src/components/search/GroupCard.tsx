import React from 'react';
import { Star, ChevronRight, Users } from 'lucide-react';
import { StudentGroupSummary } from '../../types/bsuir';

interface GroupCardProps {
  group: StudentGroupSummary;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  isFavorite,
  onToggleFavorite,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="group relative p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition flex items-center gap-3 cursor-pointer select-none active:scale-[0.99]"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-blue-950/80 dark:to-indigo-950/80 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0 border border-blue-100/60 dark:border-blue-900/40">
        <Users className="w-4.5 h-4.5 stroke-[2]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Группа {group.name}
          </h4>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md">
            {group.course} курс
          </span>
        </div>
        <div className="text-[11px] text-slate-400 truncate mt-0.5">
          {group.facultyAbbrev || group.facultyName || 'БГУИР'}
          {group.specialityAbbrev || group.specialityName ? ` · ${group.specialityAbbrev || group.specialityName}` : ''}
        </div>
      </div>

      <button
        onClick={onToggleFavorite}
        className={`p-1.5 rounded-xl transition active:scale-90 shrink-0 ${
          isFavorite
            ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/60'
            : 'text-slate-300 dark:text-slate-600 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
      >
        <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
      </button>

      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
    </div>
  );
};
