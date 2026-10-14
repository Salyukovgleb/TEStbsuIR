import React from 'react';
import { Star, ChevronRight, User } from 'lucide-react';
import { EmployeeSummary } from '../../types/bsuir';

interface TeacherCardProps {
  teacher: EmployeeSummary;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  isFavorite,
  onToggleFavorite,
  onClick,
}) => {
  const departments = (teacher.academicDepartment || []).join(', ') || 'БГУИР';

  return (
    <div
      onClick={onClick}
      className="group relative p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-[#0f1422] border border-slate-200/70 dark:border-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs transition flex items-center gap-3 cursor-pointer select-none active:scale-[0.99]"
    >
      {/* Avatar with photo or initials */}
      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-50 to-blue-50 dark:from-indigo-950/80 dark:to-blue-950/80 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 border border-indigo-100/60 dark:border-indigo-900/40 overflow-hidden">
        {teacher.photoLink ? (
          <img
            src={teacher.photoLink}
            alt={teacher.fio}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}
        <span className="text-xs font-extrabold uppercase">
          {teacher.lastName?.[0] || 'П'}{teacher.firstName?.[0] || ''}
        </span>
      </div>

      {/* Teacher Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {teacher.fio || `${teacher.lastName} ${teacher.firstName} ${teacher.middleName}`}
        </h4>
        <div className="text-[11px] text-slate-400 truncate mt-0.5">
          {departments}
          {teacher.degree ? ` · ${teacher.degree}` : ''}
        </div>
      </div>

      {/* Favorite Toggle Button */}
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
