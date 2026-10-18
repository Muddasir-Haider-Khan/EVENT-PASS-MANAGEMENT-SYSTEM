import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[13px] font-medium text-fg"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-faint pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={clsx(
              // Enforce 16px font-size minimum to eliminate mobile Safari auto-zoom
              'w-full h-11 bg-surface border text-base sm:text-sm text-fg placeholder:text-faint rounded-field transition-colors duration-150 focus:outline-none focus:border-fg focus:ring-[3px] focus:ring-line',
              leftIcon ? 'pl-11' : 'pl-4',
              rightIcon ? 'pr-11' : 'pr-4',
              error
                ? 'border-negative-500'
                : 'border-line-2 hover:border-faint',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-faint">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-negative-400 font-semibold">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-muted">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
