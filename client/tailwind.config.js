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
        muted: "var(--color-muted)"
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
