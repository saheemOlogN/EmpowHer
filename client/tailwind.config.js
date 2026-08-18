export default {
  content: ["./client/index.html", "./client/src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        navy: "var(--color-navy)",
        "navy-soft": "var(--color-navy-soft)",
        canvas: "var(--color-canvas)",
        surface: "var(--color-surface)",
        line: "var(--color-line)",
        coral: "var(--color-coral)",
        sage: "var(--color-sage)",
        amber: "var(--color-amber)",
        muted: "var(--color-muted)",
        border: "var(--color-line)",
        input: "var(--color-line)",
        ring: "var(--color-navy)",
        foreground: "var(--color-ink)",
        "muted-foreground": "var(--color-muted)",
        card: "var(--color-surface)",
        "card-foreground": "var(--color-ink)",
        primary: "var(--color-navy)",
        "primary-foreground": "var(--color-surface)",
        secondary: "var(--color-canvas)",
        "secondary-foreground": "var(--color-ink)",
        accent: "var(--color-sage)",
        "accent-foreground": "var(--color-surface)",
        destructive: "var(--color-coral)",
        "destructive-foreground": "var(--color-surface)"
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      borderRadius: {
        DEFAULT: "8px"
      }
    }
  },
  plugins: []
};
