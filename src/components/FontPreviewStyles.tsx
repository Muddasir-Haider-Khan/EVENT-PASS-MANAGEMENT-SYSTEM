/** Loads the Google Fonts offered in the branding pickers so each option previews in its own face. */
export function FontPreviewStyles({ families }: { families: string[] }) {
  const query = families.map((f) => `family=${f.replace(/ /g, '+')}:wght@600`).join('&');
  // eslint-disable-next-line @next/next/no-page-custom-font
  return <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${query}&display=swap`} />;
}
