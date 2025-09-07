# Xpress Ops Implicit Design System

The Xpress Ops Implicit Design System is a comprehensive UI framework built for internal admin dashboards. It features a minimal, flat design philosophy with the voice: "Something looks off" by default, escalating to "Critical Alert" for severe states.

## Architecture

```
packages/
├── ui-tokens/           # Design tokens & CSS variables
├── ui/                 # React component library  
├── ui-charts/          # Chart wrapper components
├── eslint-plugin-xp-tokens/  # Token enforcement
└── codemods/xp-ui-migrate/   # Migration tools

apps/
├── storybook/          # Component documentation
└── xpress-ops-xpui/    # New UI implementation
```

## Key Features

### 🎨 **Design Tokens**
- JSON source of truth for all design decisions
- CSS variables for runtime theming
- Light/dark mode support
- Accessibility-compliant color contrasts
- Philippine locale formatting

### 🧩 **Component Library**
- TypeScript-first with strict typing
- Class Variance Authority for consistent styling
- Density controls (compact/comfortable)
- Full accessibility support (WCAG AA)
- Lucide icons (stroke 1.5-2px)

### 📊 **Charts**
- Recharts-based wrappers
- Automatic theme switching
- Philippine locale number formatting
- Reduced motion support
- Responsive design

### 🛡️ **Guard Rails**
- ESLint plugin prevents raw colors/spacing
- Autofix suggestions for token usage
- CI/CD integration ready
- Migration codemods included

## Design Principles

### Implicit Style
- Minimal visual hierarchy
- Flat design language
- Functional over decorative
- Admin-focused usability

### Voice & Messaging
- **Default**: "Something looks off."
- **Critical**: "Critical Alert."
- **CTA**: "Take action"
- Philippines English tone

### Accessibility
- WCAG AA contrast ratios
- Minimum 40px touch targets
- Focus ring indicators
- Screen reader support
- Reduced motion respect

## Quick Start

```bash
# Generate CSS tokens
npm run gen:tokens

# Build component library
npm run build:ui

# Start Storybook
npm run storybook

# Run new UI variant
npm run dev:xpui

# Migration analysis
npm run codemod:xp report "src/**/*.{ts,tsx}"
```

## Integration

### 1. Install Dependencies
```bash
npm install @xpress-ops/ui @xpress-ops/ui-tokens @xpress-ops/ui-charts
```

### 2. Import CSS Variables
```tsx
import '@xpress-ops/ui-tokens/css/xp-tokens.css';
import '@xpress-ops/ui-tokens/css/xp-tokens.dark.css';
```

### 3. Wrap with Theme Provider
```tsx
import { XpThemeProvider } from '@xpress-ops/ui';

export default function App() {
  return (
    <XpThemeProvider defaultTheme="auto">
      <YourApp />
    </XpThemeProvider>
  );
}
```

### 4. Use Components
```tsx
import { Button, Card, Table } from '@xpress-ops/ui';
import { XpLineChart } from '@xpress-ops/ui-charts';

function Dashboard() {
  return (
    <Card>
      <Button variant="primary">Take action</Button>
      <XpLineChart data={data} lines={[{ dataKey: 'value' }]} />
    </Card>
  );
}
```

## Migration Path

1. **Analysis**: Run `npm run codemod:xp report` to identify migration needs
2. **Incremental**: Migrate component by component using transforms
3. **Validation**: Use ESLint plugin to enforce token usage
4. **Testing**: Visual regression testing via Storybook
5. **Rollout**: Feature flag between legacy and new UI

## Governance

### Token Updates
1. Modify `design-tokens.json`
2. Run `npm run gen:tokens`
3. Test in Storybook
4. Version bump and release

### Component Changes
1. Update component in `packages/ui`
2. Add/update Storybook stories
3. Test accessibility
4. Document breaking changes

### Quality Gates
- All colors/spacing must use tokens
- Components require TypeScript
- 100% Storybook coverage
- WCAG AA compliance
- Zero ESLint violations

## Support

- 📚 **Storybook**: Interactive component docs
- 🔧 **Migration Tools**: Automated codemods
- 🛡️ **Linting**: Token enforcement
- 📊 **Analytics**: Usage tracking via tokens
- 🆘 **Help**: Team Slack #design-system