import React from 'react';

interface MediaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function Media27Logo({ size = 'md', showSubtitle = true }: MediaLogoProps) {
  const mark = { sm: 34, md: 38, lg: 48 }[size];
  const word = { sm: 17, md: 20, lg: 26 }[size];

  return (
    <div className="flex items-center gap-2.5 select-none">
      <span
        className="inline-flex items-center justify-center flex-none bg-pill text-on-pill font-bold num"
        style={{ width: mark, height: mark, borderRadius: Math.round(mark / 3.2), fontSize: mark * 0.42, letterSpacing: '-0.04em' }}
        aria-hidden="true"
      >
        27
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-semibold text-fg" style={{ fontSize: word, letterSpacing: '-0.02em' }}>
          27 media
        </span>
        {showSubtitle && <span className="mt-1 text-[11px] font-medium text-muted">Pass &amp; Access</span>}
      </span>
    </div>
  );
}
