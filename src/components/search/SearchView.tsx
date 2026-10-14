import React, { useState, useMemo } from 'react';
import { Search, X, Star, Users, GraduationCap, Sparkles } from 'lucide-react';
import { StudentGroupSummary, EmployeeSummary } from '../../types/bsuir';
import { FavoriteItem } from '../../types/user';
import { TeacherCard } from './TeacherCard';
import { GroupCard } from './GroupCard';

interface SearchViewProps {
  groups: StudentGroupSummary[];
  teachers: EmployeeSummary[];
  favorites: FavoriteItem[];
  isLoading: boolean;
  onToggleFavorite: (item: FavoriteItem) => void;
  onSelectTeacher: (teacher: EmployeeSummary) => void;
  onSelectGroup: (group: StudentGroupSummary) => void;
}

type SearchCategory = 'all' | 'teachers' | 'groups' | 'favorites';

export const SearchView: React.FC<SearchViewProps> = ({
  groups,
  teachers,
  favorites,
  isLoading,
  onToggleFavorite,
  onSelectTeacher,
  onSelectGroup,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');

  // Fast normalization helper
  const normalize = (str: string) => str.toLowerCase().replace(/ё/g, 'е').trim();

  const isFavorite = (id: string, type: 'group' | 'teacher') => {
    return favorites.some((f) => f.id === id && f.type === type);
  };

  // Filtered Groups
  const matchingGroups = useMemo(() => {
    if (category === 'teachers') return [];
    const q = normalize(query);
    if (!q) {
      return category === 'groups' ? groups.slice(0, 40) : groups.slice(0, 15);
    }
    return groups.filter((g) => {
      const name = normalize(g.name);
      const faculty = normalize(g.facultyAbbrev || g.facultyName || '');
      const spec = normalize(g.specialityAbbrev || g.specialityName || '');
      return name.includes(q) || faculty.includes(q) || spec.includes(q);
    }).slice(0, 40);
  }, [groups, query, category]);

  // Filtered Teachers
  const matchingTeachers = useMemo(() => {
    if (category === 'groups') return [];
    const q = normalize(query);
    if (!q) {
      return category === 'teachers' ? teachers.slice(0, 40) : teachers.slice(0, 15);
    }
    return teachers.filter((t) => {
      const fio = normalize(t.fio || `${t.lastName} ${t.firstName} ${t.middleName}`);
      const dept = normalize((t.academicDepartment || []).join(' '));
      return fio.includes(q) || dept.includes(q);
    }).slice(0, 40);
  }, [teachers, query, category]);

  // Favorites List
  const favoriteItems = useMemo(() => {
    if (category !== 'favorites' && category !== 'all') return [];
    return favorites;
  }, [favorites, category]);

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div className="pt-1">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Поиск
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Быстрый доступ к расписаниям преподавателей и групп БГУИР
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти преподавателя или группу..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 outline-none shadow-xs transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Quick Search Tags for convenience */}
      {!query && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-500">
          <span className="shrink-0 text-[11px] font-semibold text-slate-400 pl-0.5">Факультеты:</span>
          {['ФКП', 'ФИТУ', 'ФКСИС', 'ФРЭ', 'ИЭФ'].map((fac) => (
            <button
              key={fac}
              onClick={() => setQuery(fac)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 font-bold text-[11px] text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0 active:scale-95"
            >
              {fac}
            </button>
          ))}
        </div>
      )}

      {/* Category Filter Pills (Functional Buttons) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-x-auto text-xs border border-slate-200/50 dark:border-slate-800/50">
        {[
          { id: 'all' as SearchCategory, label: 'Все' },
          { id: 'teachers' as SearchCategory, label: 'Преподаватели' },
          { id: 'groups' as SearchCategory, label: 'Группы' },
          { id: 'favorites' as SearchCategory, label: `Избранное (${favorites.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 ${
              category === tab.id
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results View */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : category === 'favorites' ? (
        /* Favorites only */
        <div className="space-y-2.5">
          {favorites.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Избранных записей пока нет
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Нажимайте на звездочку рядом с любой группой или преподавателем, чтобы иметь к ним мгновенный доступ.
              </p>
            </div>
          ) : (
            favorites.map((fav) => {
              if (fav.type === 'teacher') {
                const teacherObj = teachers.find((t) => t.urlId === fav.id) || {
                  id: 0,
                  urlId: fav.id,
                  fio: fav.title,
                  firstName: '',
                  lastName: fav.title,
                  middleName: '',
                  academicDepartment: fav.subtitle ? [fav.subtitle] : [],
                  photoLink: fav.photoLink,
                };
                return (
                  <TeacherCard
                    key={`fav-t-${fav.id}`}
                    teacher={teacherObj}
                    isFavorite={true}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(fav);
                    }}
                    onClick={() => onSelectTeacher(teacherObj)}
                  />
                );
              } else {
                const groupObj = groups.find((g) => g.name === fav.id) || {
                  id: 0,
                  name: fav.id,
                  facultyId: 0,
                  specialityDepartmentEducationFormId: 0,
                  specialityName: fav.subtitle || '',
                  course: 1,
                };
                return (
                  <GroupCard
                    key={`fav-g-${fav.id}`}
                    group={groupObj}
                    isFavorite={true}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(fav);
                    }}
                    onClick={() => onSelectGroup(groupObj)}
                  />
                );
              }
            })
          )}
        </div>
      ) : (
        /* Standard search view */
        <div className="space-y-6">
          {/* Teachers Section */}
          {matchingTeachers.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Преподаватели ({matchingTeachers.length})
                </h3>
              </div>
              <div className="space-y-2">
                {matchingTeachers.map((teacher) => (
                  <TeacherCard
                    key={teacher.id || teacher.urlId}
                    teacher={teacher}
                    isFavorite={isFavorite(teacher.urlId, 'teacher')}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      onToggleFavorite({
                        id: teacher.urlId,
                        type: 'teacher',
                        title: teacher.fio || `${teacher.lastName} ${teacher.firstName}`,
                        subtitle: (teacher.academicDepartment || [])[0],
                        photoLink: teacher.photoLink,
                      });
                    }}
                    onClick={() => onSelectTeacher(teacher)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Groups Section */}
          {matchingGroups.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Учебные группы ({matchingGroups.length})
                </h3>
              </div>
              <div className="space-y-2">
                {matchingGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    group={group}
                    isFavorite={isFavorite(group.name, 'group')}
                    onToggleFavorite={(e) => {
                      e.stopPropagation();
                      onToggleFavorite({
                        id: group.name,
                        type: 'group',
                        title: `Группа ${group.name}`,
                        subtitle: group.facultyAbbrev || group.specialityName,
                      });
                    }}
                    onClick={() => onSelectGroup(group)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty search results */}
          {matchingTeachers.length === 0 && matchingGroups.length === 0 && (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ничего не найдено
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Попробуйте изменить запрос или проверить написание фамилии или номера группы.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
