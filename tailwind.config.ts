import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        apple: {
          bg: '#000000',
          elevated: '#161618',
          card: '#1c1c1e',
          secondary: '#2c2c2e',
          tertiary: '#3a3a3c',
          border: 'rgba(255, 255, 255, 0.08)',
          borderLight: 'rgba(255, 255, 255, 0.15)',
          blue: '#0071e3',
          blueHover: '#0077ed',
          green: '#30d158',
          orange: '#ff9f0a',
          red: '#ff453a',
          gray: '#86868b',
          grayLight: '#98989d',
        },
      },
      boxShadow: {
        'apple-card': '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'apple-popover': '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        'apple-pill': '0 2px 8px rgba(0, 0, 0, 0.25)',
      },
      transitionTimingFunction: {
        'apple-spring': 'cubic-bezier(0.2, 0.0, 0, 1)',
        'apple-ease': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
