export const designTokens = {
  "$schema": "https://tokens.studio/schemas/1.0.0.json",
  "metadata": {
    "name": "Xpress Ops — Design Tokens",
    "version": "0.1.0",
    "generated": "2025-09-07T15:57:51.462344+08:00",
    "source_of_truth": "json",
    "brand": "Xpress",
    "notes": "Implicit design system tokens for internal admin dashboards. Minimal flat style. Voice: 'Something looks off' by default; escalate to 'Critical Alert' for severe states."
  },
  "modes": [
    "light",
    "dark"
  ],
  "typography": {
    "fontFamily": {
      "base": "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji"
    },
    "fontWeight": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "lineHeight": {
      "tight": 1.2,
      "snug": 1.3,
      "normal": 1.5,
      "relaxed": 1.6
    },
    "size": {
      "h1": "clamp(24px, 2vw, 28px)",
      "h2": "clamp(20px, 1.6vw, 22px)",
      "h3": "18px",
      "body": "14px",
      "bodyLg": "16px",
      "caption": "12px"
    },
    "letterSpacing": {
      "normal": "0",
      "tight": "-0.01em"
    }
  },
  "spacing": {
    "unit": 8,
    "scale": {
      "0": 0,
      "1": 4,
      "2": 8,
      "3": 12,
      "4": 16,
      "5": 20,
      "6": 24,
      "7": 28,
      "8": 32,
      "10": 40,
      "12": 48,
      "16": 64,
      "20": 80
    }
  },
  "radius": {
    "xs": 6,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 20,
    "pill": 999
  },
  "opacity": {
    "disabled": 0.4,
    "muted": 0.64,
    "overlay": 0.6
  },
  "zIndex": {
    "base": 0,
    "sticky": 10,
    "dropdown": 1000,
    "overlay": 1100,
    "modal": 1200,
    "popover": 1300,
    "toast": 1400
  },
  "elevation": {
    "light": {
      "0": "none",
      "1": "0 1px 2px rgba(17, 24, 39, 0.06)",
      "2": "0 2px 8px rgba(17, 24, 39, 0.08)",
      "3": "0 8px 24px rgba(17, 24, 39, 0.12)"
    },
    "dark": {
      "0": "none",
      "1": "0 1px 2px rgba(0,0,0,0.5)",
      "2": "0 2px 8px rgba(0,0,0,0.6)",
      "3": "0 8px 24px rgba(0,0,0,0.7)"
    }
  },
  "motion": {
    "duration": {
      "fast": "150ms",
      "base": "200ms",
      "slow": "250ms"
    },
    "easing": {
      "standard": "cubic-bezier(0.4, 0, 0.2, 1)",
      "decelerate": "cubic-bezier(0, 0, 0.2, 1)",
      "accelerate": "cubic-bezier(0.4, 0, 1, 1)"
    }
  },
  "color": {
    "palette": {
      "blue": {
        "500": "#3B82F6",
        "600": "#2563EB",
        "700": "#1D4ED8"
      },
      "green": {
        "500": "#22C55E",
        "600": "#16A34A",
        "700": "#15803D"
      },
      "red": {
        "500": "#EF4444",
        "600": "#DC2626",
        "700": "#B91C1C"
      },
      "amber": {
        "400": "#FBBF24",
        "500": "#F59E0B",
        "600": "#D97706"
      },
      "yellow": {
        "400": "#FACC15",
        "500": "#EAB308"
      },
      "sky": {
        "500": "#0EA5E9",
        "600": "#0284C7"
      },
      "gray": {
        "50": "#F9FAFB",
        "100": "#F3F4F6",
        "200": "#E5E7EB",
        "300": "#D1D5DB",
        "400": "#9CA3AF",
        "500": "#6B7280",
        "600": "#4B5563",
        "700": "#374151",
        "800": "#1F2937",
        "900": "#111827"
      }
    },
    "semantic": {
      "light": {
        "bg/page": "{color.palette.gray.50}",
        "bg/card": "#FFFFFF",
        "bg/elevated": "#FFFFFF",
        "text/primary": "{color.palette.gray.900}",
        "text/secondary": "{color.palette.gray.600}",
        "text/muted": "{color.palette.gray.500}",
        "border/default": "{color.palette.gray.200}",
        "focus/ring": "{color.palette.blue.500}",
        "link/default": "{color.palette.blue.600}",
        "brand/primary": "{color.palette.blue.600}",
        "status/success": "{color.palette.green.600}",
        "status/warning": "{color.palette.amber.600}",
        "status/info": "{color.palette.sky.600}",
        "status/critical": "{color.palette.red.600}",
        "chip/bg/success": "rgba(34,197,94,0.12)",
        "chip/bg/warning": "rgba(245,158,11,0.12)",
        "chip/bg/info": "rgba(14,165,233,0.12)",
        "chip/bg/critical": "rgba(220,38,38,0.12)",
        "button/primary/bg": "{color.palette.blue.600}",
        "button/primary/text": "#FFFFFF",
        "button/primary/hover": "{color.palette.blue.700}",
        "button/secondary/bg": "#FFFFFF",
        "button/secondary/border": "{color.palette.gray.300}",
        "button/secondary/text": "{color.palette.gray.900}",
        "input/bg": "#FFFFFF",
        "input/border": "{color.palette.gray.300}",
        "input/placeholder": "{color.palette.gray.400}",
        "table/row/hover": "rgba(59,130,246,0.06)",
        "toast/bg": "#111827",
        "toast/text": "#FFFFFF"
      },
      "dark": {
        "bg/page": "{color.palette.gray.900}",
        "bg/card": "{color.palette.gray.800}",
        "bg/elevated": "{color.palette.gray.800}",
        "text/primary": "{color.palette.gray.50}",
        "text/secondary": "{color.palette.gray.300}",
        "text/muted": "{color.palette.gray.400}",
        "border/default": "{color.palette.gray.700}",
        "focus/ring": "{color.palette.blue.500}",
        "link/default": "{color.palette.blue.500}",
        "brand/primary": "{color.palette.blue.500}",
        "status/success": "{color.palette.green.500}",
        "status/warning": "{color.palette.amber.500}",
        "status/info": "{color.palette.sky.500}",
        "status/critical": "{color.palette.red.500}",
        "chip/bg/success": "rgba(34,197,94,0.18)",
        "chip/bg/warning": "rgba(245,158,11,0.18)",
        "chip/bg/info": "rgba(14,165,233,0.18)",
        "chip/bg/critical": "rgba(220,38,38,0.18)",
        "button/primary/bg": "{color.palette.blue.600}",
        "button/primary/text": "#FFFFFF",
        "button/primary/hover": "{color.palette.blue.700}",
        "button/secondary/bg": "{color.palette.gray.800}",
        "button/secondary/border": "{color.palette.gray.700}",
        "button/secondary/text": "{color.palette.gray.50}",
        "input/bg": "{color.palette.gray.800}",
        "input/border": "{color.palette.gray.700}",
        "input/placeholder": "{color.palette.gray.400}",
        "table/row/hover": "rgba(59,130,246,0.12)",
        "toast/bg": "{color.palette.gray.50}",
        "toast/text": "{color.palette.gray.900}"
      }
    }
  },
  "component": {
    "button": {
      "height": 40,
      "radius": "{radius.sm}",
      "paddingX": 16,
      "iconSize": 20
    },
    "input": {
      "height": 40,
      "radius": "{radius.sm}",
      "paddingX": 12
    },
    "chip": {
      "height": 24,
      "radius": "{radius.pill}",
      "paddingX": 10
    },
    "card": {
      "radius": "{radius.md}",
      "padding": "{spacing.scale.5}",
      "shadow": "{elevation.light.1}"
    },
    "table": {
      "rowHeight": 48,
      "headerHeight": 44
    },
    "modal": {
      "radius": "{radius.lg}",
      "maxWidth": {
        "sm": 560,
        "md": 720,
        "lg": 960
      }
    },
    "toast": {
      "radius": "{radius.sm}",
      "durationMs": 3500
    }
  },
  "charts": {
    "palette": [
      "#3B82F6",
      "#22C55E",
      "#F59E0B",
      "#EF4444",
      "#0EA5E9",
      "#A855F7",
      "#14B8A6",
      "#FB7185"
    ],
    "grid": {
      "x": true,
      "y": true,
      "opacity": 0.25
    },
    "axis": {
      "labelSize": 12,
      "tickSize": 11,
      "lineOpacity": 0.3
    },
    "tooltip": {
      "bg": "#111827",
      "text": "#FFFFFF",
      "radius": 8
    },
    "pie": {
      "donut": true,
      "innerRadiusPct": 60,
      "labelType": "outside"
    },
    "line": {
      "strokeWidth": 2.5,
      "smooth": true
    },
    "bar": {
      "radius": 6,
      "gap": 8
    }
  },
  "a11y": {
    "focusRingWidth": 2,
    "focusRingOffset": 2,
    "minTouchTarget": 40,
    "contrast": "WCAG AA",
    "prefersColorScheme": "auto"
  },
  "voice": {
    "default": "Something looks off.",
    "critical": "Critical Alert.",
    "cta": "Take action"
  }
};

export function getTokenValue(path) {
  const pathParts = path.split('.');
  let value = designTokens;
  
  for (const part of pathParts) {
    if (value && value[part] !== undefined) {
      value = value[part];
    } else {
      console.warn(`Token not found: ${path}`);
      return null;
    }
  }
  
  return value;
}

export function getCSSVariable(tokenPath) {
  const cssVar = '--xp-' + tokenPath.replace(/[./]/g, '-');
  return `var(${cssVar})`;
}
