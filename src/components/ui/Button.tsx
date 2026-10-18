import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-full border transition-colors duration-150 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-fg focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-45 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-pill text-on-pill border-transparent hover:opacity-90',
      secondary: 'bg-surface-2 text-fg border-line hover:border-line-2',
      outline: 'bg-surface text-fg border-line-2 hover:bg-surface-2',
      ghost: 'bg-transparent text-muted border-transparent hover:text-fg hover:bg-well',
      danger: 'bg-negative-500/15 text-negative-400 border-negative-500/30 hover:bg-negative-500/25',
    };

    const sizes = {
      sm: 'h-[34px] px-3.5 text-[12.5px] gap-1.5',
      md: 'h-[42px] px-[18px] text-[13.5px] gap-2',
      lg: 'h-12 px-6 text-[15px] gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
