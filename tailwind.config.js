/** @type {import('tailwindcss').Config} */
    module.exports = {
      darkMode: ['class'],
      content: [
        './pages/**/*.{js,jsx}',
        './components/**/*.{js,jsx}',
        './app/**/*.{js,jsx}',
        './src/**/*.{js,jsx}',
      ],
      theme: {
        container: {
          center: true,
          padding: '2rem',
          screens: {
            '2xl': '1400px',
          },
        },
        extend: {
          colors: {
            border: 'hsl(var(--border))',
            input: 'hsl(var(--input))',
            ring: 'hsl(var(--ring))',
            background: 'hsl(var(--background))',
            foreground: 'hsl(var(--foreground))',
            primary: {
              DEFAULT: 'hsl(var(--primary))',
              foreground: 'hsl(var(--primary-foreground))',
            },
            secondary: {
              DEFAULT: 'hsl(var(--secondary))',
              foreground: 'hsl(var(--secondary-foreground))',
            },
            destructive: {
              DEFAULT: 'hsl(var(--destructive))',
              foreground: 'hsl(var(--destructive-foreground))',
            },
            muted: {
              DEFAULT: 'hsl(var(--muted))',
              foreground: 'hsl(var(--muted-foreground))',
            },
            accent: {
              DEFAULT: 'hsl(var(--accent))',
              foreground: 'hsl(var(--accent-foreground))',
            },
            popover: {
              DEFAULT: 'hsl(var(--popover))',
              foreground: 'hsl(var(--popover-foreground))',
            },
            card: {
              DEFAULT: 'hsl(var(--card))',
              foreground: 'hsl(var(--card-foreground))',
            },
            glowfy: {
              background: 'hsl(var(--glowfy-background))',
              foreground: 'hsl(var(--glowfy-foreground))',
              primary: 'hsl(var(--glowfy-primary))',
              'primary-foreground': 'hsl(var(--glowfy-primary-foreground))',
              secondary: 'hsl(var(--glowfy-secondary))',
              'secondary-foreground': 'hsl(var(--glowfy-secondary-foreground))',
              accent: 'hsl(var(--glowfy-accent))',
              'accent-foreground': 'hsl(var(--glowfy-accent-foreground))',
              card: 'hsl(var(--glowfy-card))',
              'card-foreground': 'hsl(var(--glowfy-card-foreground))',
              muted: 'hsl(var(--glowfy-muted))',
              'muted-foreground': 'hsl(var(--glowfy-muted-foreground))',
              border: 'hsl(var(--glowfy-border))',
              input: 'hsl(var(--glowfy-input))',
              ring: 'hsl(var(--glowfy-ring))',
            }
          },
          borderRadius: {
            lg: 'var(--radius)',
            md: 'calc(var(--radius) - 2px)',
            sm: 'calc(var(--radius) - 4px)',
          },
          keyframes: {
            'accordion-down': {
              from: { height: '0' },
              to: { height: 'var(--radix-accordion-content-height)' },
            },
            'accordion-up': {
              from: { height: 'var(--radix-accordion-content-height)' },
              to: { height: '0' },
            },
          },
          animation: {
            'accordion-down': 'accordion-down 0.2s ease-out',
            'accordion-up': 'accordion-up 0.2s ease-out',
          },
        },
      },
      plugins: [require('tailwindcss-animate')],
    };