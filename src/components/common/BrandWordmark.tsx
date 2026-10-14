import React from 'react';

interface BrandWordmarkProps {
  showSlogan?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  showSlogan = false,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl sm:text-3xl',
  }[size];

  const sloganSizeClasses = {
    sm: 'text-[10px] mt-0.5',
    md: 'text-xs mt-1',
    lg: 'text-sm mt-1.5',
  }[size];

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className={`font-sans tracking-tight leading-none ${sizeClasses}`}>
        <span className="font-extrabold text-slate-900 dark:text-white">
          BSUIR
        </span>
        <span className="inline-block w-1.5" />
        <span className="italic font-normal text-slate-900 dark:text-white">
          Flow
        </span>
      </div>
      {showSlogan && (
        <span className={`font-medium text-slate-400 dark:text-slate-400 leading-none ${sloganSizeClasses}`}>
          Твой ритм университета
        </span>
      )}
    </div>
  );
};
