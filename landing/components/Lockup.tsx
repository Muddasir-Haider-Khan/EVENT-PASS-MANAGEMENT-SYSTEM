/** 27 Media EPMS lockup from the brand kit: the "27" mark beside MEDIA / EPMS. */
export function Lockup({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const markHeight = { sm: 30, md: 36, lg: 52 }[size];
  const wordSize = { sm: 11, md: 13, lg: 17 }[size];
  return (
    <span className="lockup" role="img" aria-label="27 Media EPMS">
      <span className="brand-mark" style={{ height: markHeight }} aria-hidden="true" />
      <span className="wordmark" style={{ fontSize: wordSize }} aria-hidden="true">
        <span>Media</span>
        <span>EPMS</span>
      </span>
    </span>
  );
}
