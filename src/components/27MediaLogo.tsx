import React from 'react';

interface MediaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Wordmark next to the mark; false renders the mark alone. */
  showSubtitle?: boolean;
  animate?: boolean;
}

/** 27 Media EPMS lockup from the brand kit: the "27" mark beside a two-line MEDIA / EPMS wordmark. */
export function Media27Logo({ size = 'md', showSubtitle = true, animate = false }: MediaLogoProps) {
  const markHeight = { sm: 34, md: 42, lg: 58 }[size];
  const wordSize = { sm: 12, md: 14.5, lg: 19 }[size];

  return (
    <span className="inline-flex items-center gap-2.5 select-none" aria-label="27 Media EPMS" role="img">
      <span className={`brand-mark ${animate ? 'animate-mark' : ''}`} style={{ height: markHeight }} aria-hidden="true" />
      {showSubtitle && (
        <span className="wordmark flex flex-col" style={{ fontSize: wordSize }} aria-hidden="true">
          <span>Media</span>
          <span>EPMS</span>
        </span>
      )}
    </span>
  );
}
