import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ className, padding = 'md', ...props }: CardProps) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-8',
    lg: 'p-12',
  };

  return (
    <div
      className={cn(
        'bg-white border-2 border-black shadow-brutalist rounded-none',
        paddings[padding],
        className
      )}
      {...props}
    />
  );
};
