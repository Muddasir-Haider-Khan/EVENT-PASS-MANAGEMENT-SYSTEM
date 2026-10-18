import React from 'react';
import { clsx } from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'flat' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'glass',
  padding = 'md',
  ...props
}) => {
  const baseStyles = 'rounded-card text-fg';

  const variants = {
    glass: 'bg-surface border border-line shadow-card',
    flat: 'bg-solid border border-line',
    bordered: 'bg-transparent border border-line-2',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-[18px]',
    lg: 'p-6',
  };

  return (
    <div
      className={clsx(baseStyles, variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
};
