export const designTokens = {
  colors: {
    charcoal: {
      950: '#0b0c10',
      900: '#11131a',
      850: '#161a23',
      800: '#1b202b',
      700: '#262c3a',
    },
    slate: {
      900: '#121826',
      800: '#1a2233',
      700: '#243046',
      600: '#2f3e59',
      500: '#4a5c7a',
      400: '#6b7c96',
      300: '#93a1b5',
    },
    clay: {
      700: '#8a4f3d',
      600: '#a25e49',
      500: '#b86f56',
      400: '#d08b6e',
      300: '#e3b09a',
    },
    bronze: {
      700: '#7c5a1e',
      600: '#926a22',
      500: '#aa7b27',
      400: '#c9973e',
      300: '#e0bd77',
    },
    ochre: {
      700: '#a35a08',
      600: '#b7650a',
      500: '#cf7a11',
      400: '#e39a3a',
      300: '#f0c27a',
    },
    ink: {
      900: '#e6e9ef',
      800: '#cdd4df',
      700: '#aeb8c7',
      600: '#8d99ad',
      500: '#6f7d95',
    },
  },

  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      title: ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
      headline: ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
      body: ['1rem', { lineHeight: '1.6rem' }],
      label: ['0.8125rem', { lineHeight: '1.2rem', letterSpacing: '0.02em' }],
    },
  },

  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
  },

  radius: {
    card: '10px',
    surface: '16px',
    control: '12px',
  },

  shadows: {
    soft: '0 8px 24px rgba(12, 14, 20, 0.35)',
    lift: '0 12px 32px rgba(12, 14, 20, 0.45)',
  },
};

export const archiaTheme = {
  colors: {
    // Map to Tailwind color names
    background: designTokens.colors.charcoal[950],
    surface: designTokens.colors.charcoal[900],
    surface2: designTokens.colors.charcoal[850],
    border: designTokens.colors.slate[700],
    muted: designTokens.colors.slate[500],
    accent: designTokens.colors.ochre[500],
    accentHover: designTokens.colors.ochre[400],
    clay: designTokens.colors.clay[500],
    bronze: designTokens.colors.bronze[500],
    ink: designTokens.colors.ink[800],
    inkLight: designTokens.colors.ink[700],
  },
};
