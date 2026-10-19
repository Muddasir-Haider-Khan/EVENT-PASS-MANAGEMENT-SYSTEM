import type { Config } from 'tailwindcss';

// Each ramp resolves to a CSS variable (see globals.css) so the same class
// follows the active theme: `bg-ink-950` is the canvas in dark and light.
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const ramp = (name: string) =>
  Object.fromEntries(STEPS.map((s) => [s, `rgb(var(--${name}-${s}) / <alpha-value>)`]));

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: ramp('ink'),
        accent: ramp('accent'),
        positive: ramp('positive'),
        negative: ramp('negative'),
        caution: ramp('caution'),
        canvas: 'var(--canvas)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        solid: 'var(--solid)',
        float: 'var(--float)',
        well: 'var(--well)',
        line: 'var(--line)',
        'line-2': 'var(--line-2)',
        fg: 'var(--text)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        pill: 'var(--pill)',
        'on-pill': 'var(--on-pill)',
        brand: 'var(--brand)',
        navy: 'var(--navy)',
        amber: 'var(--amber)',
        tile: 'var(--tile)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: 'var(--r-card)',
        tile: 'var(--r-tile)',
        field: 'var(--r-field)',
      },
      boxShadow: {
        card: 'var(--shadow)',
        pop: 'var(--shadow-pop)',
      },
      transitionTimingFunction: {
        out: 'var(--ease)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
export default config;
