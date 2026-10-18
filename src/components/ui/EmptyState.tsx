import React from 'react';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center rounded-card border border-dashed border-line-2">
      <div className="stat__ico mb-4 text-muted">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-[15px] font-semibold text-fg mb-1">{title}</h3>
      <p className="text-[13px] text-muted max-w-sm mb-5">{description}</p>
      {action}
    </div>
  );
};
