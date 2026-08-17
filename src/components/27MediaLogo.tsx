import React from 'react';

interface MediaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export function Media27Logo({ size = 'md', showSubtitle = true }: MediaLogoProps) {
  const iconSizes = { sm: 28, md: 36, lg: 48 };
  const fontSizes = { sm: '1rem', md: '1.25rem', lg: '1.75rem' };
  const subSizes = { sm: '0.625rem', md: '0.6875rem', lg: '0.75rem' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, userSelect: 'none' }}>
      {/* 27 Media Agency Luxury Crest Icon */}
      <div
        style={{
          width: iconSizes[size],
          height: iconSizes[size],
          borderRadius: 8,
          background: 'linear-gradient(135deg, #E5C158 0%, #D4AF37 50%, #8A6913 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#070709',
          fontWeight: 900,
          fontFamily: 'system-ui, sans-serif',
          fontSize: size === 'sm' ? 14 : size === 'md' ? 18 : 24,
          letterSpacing: '-0.05em',
          boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
          flexShrink: 0,
        }}
      >
        27
      </div>

      <div>
        <div
          style={{
            fontSize: fontSizes[size],
            fontWeight: 800,
            letterSpacing: '0.04em',
            lineHeight: 1.1,
            color: '#F8FAFC',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          27 MEDIA
          <span style={{ color: '#D4AF37', fontWeight: 300 }}>AGENCY</span>
        </div>
        {showSubtitle && (
          <div
            style={{
              fontSize: subSizes[size],
              fontWeight: 600,
              letterSpacing: '0.14em',
              color: '#94A3B8',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            Pass & Access Systems
          </div>
        )}
      </div>
    </div>
  );
}
