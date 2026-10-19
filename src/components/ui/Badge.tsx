import React from 'react';
import { clsx } from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'amber' | 'red' | 'indigo' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'indigo',
  size = 'md',
  icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 font-bold rounded-full whitespace-nowrap';

  const variants = {
    green: 'bg-positive-500/15 text-positive-400',
    amber: 'bg-amber text-[var(--on-amber)]',
    red: 'bg-negative-500/15 text-negative-400',
    indigo: 'bg-brand text-[var(--on-brand)]',
    slate: 'bg-surface-2 text-fg ring-1 ring-inset ring-line',
  };

  const sizes = {
    sm: 'h-5 px-2 text-[10.5px]',
    md: 'h-[22px] px-[9px] text-[11px]',
  };

  return (
    <span
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
};
