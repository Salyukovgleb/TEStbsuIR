import React from 'react';
import { LayoutDashboard, Calendar, Search, User } from 'lucide-react';

export type NavTab = 'home' | 'schedule' | 'search' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Главная', icon: LayoutDashboard },
    { id: 'schedule' as NavTab, label: 'Расписание', icon: Calendar },
    { id: 'search' as NavTab, label: 'Поиск', icon: Search },
    { id: 'profile' as NavTab, label: 'Профиль', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#090d16]/85 backdrop-blur-2xl border-t border-slate-200/60 dark:border-slate-800/60 pb-[env(safe-area-inset-bottom)] transition-colors">
      <div className="max-w-md mx-auto grid grid-cols-4 h-14 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`group flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 transition-all select-none active:scale-95 ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center w-7 h-6">
                <Icon
                  className={`w-4.5 h-4.5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.3]' : 'scale-100 stroke-[1.8]'
                  }`}
                />
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
