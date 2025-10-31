# EvidenceSeek Design System

## Brand Identity

**EvidenceSeek** - AI-powered microbiology analysis platform with pharmaceutical-grade precision.

### Core Values
- **Scientific Precision**: Accurate, reliable, evidence-based
- **Medical Trust**: Professional, clinical, authoritative
- **Innovation**: Modern AI, cutting-edge technology
- **Clarity**: Clean, readable, accessible

## Color Palette

### Primary Colors

#### Deep Teal (Primary)
- **Hex**: `#006B7D` (Medical Blue-Green)
- **Usage**: Primary actions, links, brand identity
- **Meaning**: Trust, medical professionalism, scientific precision

#### Vibrant Cyan (Accent)
- **Hex**: `#00BCD4` (Biotechnology Blue)
- **Usage**: Highlights, active states, notifications
- **Meaning**: Innovation, technology, clarity

#### Deep Navy (Secondary)
- **Hex**: `#1A237E` (Pharmaceutical Navy)
- **Usage**: Headers, important text, shadows
- **Meaning**: Authority, depth, sophistication

### Supporting Colors

#### Lab White
- **Light**: `#FAFAFA` (Clean Lab Environment)
- **Pure**: `#FFFFFF`
- **Usage**: Backgrounds, cards, surfaces

#### Clinical Gray
- **Hex**: `#455A64` (Medical Equipment Gray)
- **Usage**: Body text, secondary information
- **Light Gray**: `#ECEFF1` (Borders, dividers)

#### Success Green
- **Hex**: `#4CAF50` (Positive Result)
- **Usage**: Success states, completed jobs, positive indicators

#### Warning Amber
- **Hex**: `#FF9800` (Attention Required)
- **Usage**: Warnings, pending states, caution

#### Error Red
- **Hex**: `#F44336` (Critical Alert)
- **Usage**: Errors, failed jobs, critical issues

#### Analysis Purple
- **Hex**: `#7B1FA2` (Research Purple)
- **Usage**: Microbiology mode, special features, AI highlights

### Gradient Schemes

#### Primary Gradient
```css
background: linear-gradient(135deg, #006B7D 0%, #00BCD4 100%);
```

#### Dark Gradient
```css
background: linear-gradient(135deg, #1A237E 0%, #006B7D 100%);
```

#### Surface Gradient
```css
background: linear-gradient(180deg, #FAFAFA 0%, #ECEFF1 100%);
```

## Typography

### Font Families

#### Primary Font Stack
```css
font-family: 'Inter', 'SF Pro Display', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
```

#### Monospace (Code/Data)
```css
font-family: 'JetBrains Mono', 'Consolas', 'Monaco', monospace;
```

### Type Scale

```scss
--font-xs: 0.75rem;   // 12px - Small labels
--font-sm: 0.875rem;  // 14px - Body small
--font-base: 1rem;    // 16px - Body text
--font-lg: 1.125rem;  // 18px - Subheadings
--font-xl: 1.25rem;   // 20px - Headings
--font-2xl: 1.5rem;   // 24px - Section titles
--font-3xl: 2rem;     // 32px - Page titles
--font-4xl: 2.5rem;   // 40px - Hero text
```

### Font Weights
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Spacing System

### Scale (based on 4px grid)
```scss
--space-1: 0.25rem;  // 4px
--space-2: 0.5rem;   // 8px
--space-3: 0.75rem;  // 12px
--space-4: 1rem;     // 16px
--space-5: 1.25rem;  // 20px
--space-6: 1.5rem;   // 24px
--space-8: 2rem;     // 32px
--space-10: 2.5rem;  // 40px
--space-12: 3rem;    // 48px
--space-16: 4rem;    // 64px
```

## Shadows

### Elevation Levels

#### Level 1 - Subtle
```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
```

#### Level 2 - Card
```css
box-shadow: 0 4px 6px rgba(0, 107, 125, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
```

#### Level 3 - Elevated
```css
box-shadow: 0 10px 20px rgba(0, 107, 125, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1);
```

#### Level 4 - Modal
```css
box-shadow: 0 20px 40px rgba(0, 107, 125, 0.2), 0 5px 10px rgba(0, 0, 0, 0.15);
```

## Border Radius

```scss
--radius-sm: 4px;   // Buttons, inputs
--radius-md: 8px;   // Cards, panels
--radius-lg: 12px;  // Modals, overlays
--radius-xl: 16px;  // Hero sections
--radius-full: 9999px; // Pills, avatars
```

## Components

### Buttons

#### Primary Button
- Background: `--primary` (#006B7D)
- Color: White
- Hover: Darken 10%
- Active: Scale 0.98

#### Secondary Button
- Background: Transparent
- Border: 1px solid `--primary`
- Color: `--primary`
- Hover: Light background (#006B7D10)

#### Success Button
- Background: `--success` (#4CAF50)
- Color: White

### Cards

#### Standard Card
- Background: White
- Border: 1px solid `--border-color` (#ECEFF1)
- Border Radius: `--radius-md`
- Shadow: Level 1
- Padding: `--space-6`

#### Elevated Card (Reports)
- Background: White
- Shadow: Level 2
- Border Radius: `--radius-lg`
- Padding: `--space-8`

### Sidebar

#### Layout
- Width: 280px
- Background: `#FAFAFA` (Light) / `#1E1E1E` (Dark)
- Border: 1px solid `--border-color`

#### Active Item
- Background: Linear gradient with primary color
- Left border: 3px solid `--primary`
- Color: `--primary`

### Header

- Height: 60px
- Background: White with subtle shadow
- Border bottom: 1px solid `--border-color`
- Logo: 40px height

### Status Indicators

#### Pending
- Color: `#FF9800` (Amber)
- Icon: ⏳

#### Running
- Color: `#00BCD4` (Cyan)
- Icon: 🔄 (animated)

#### Completed
- Color: `#4CAF50` (Green)
- Icon: ✅

#### Failed
- Color: `#F44336` (Red)
- Icon: ❌

#### Microbiology Mode
- Color: `#7B1FA2` (Purple)
- Icon: 🧬

## Logo Design

### EvidenceSeek Logo Concept

```
┌──────────────────────────────────────┐
│  🧬  EvidenceSeek                    │
│  ═══════════════                     │
│  AI-Powered Microbiology Analysis    │
└──────────────────────────────────────┘
```

#### Logo Elements
1. **DNA Helix Icon**: Stylized double helix in teal/cyan gradient
2. **Wordmark**: "EvidenceSeek" in modern sans-serif
3. **Tagline**: "AI-Powered Microbiology Analysis"
4. **Color**: Primary teal with cyan accent

#### Logo Variations
- **Full**: Icon + Wordmark + Tagline
- **Horizontal**: Icon + Wordmark
- **Icon Only**: DNA helix icon
- **Wordmark Only**: Typography treatment

### Icon Design
- Modern, geometric DNA helix
- 2-3 color gradient (teal to cyan)
- Clean lines, professional
- Works at small sizes (16px+)

## Animation

### Transitions
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

### Loading States
- Pulse animation for pending jobs
- Spinner for active processing
- Smooth fade transitions

## Accessibility

### Contrast Ratios
- Body text: Minimum 4.5:1
- Large text: Minimum 3:1
- UI components: Minimum 3:1

### Focus States
- Visible focus ring: 2px solid `--primary`
- Offset: 2px
- Border radius: Match element

## Dark Mode

### Dark Mode Colors

#### Backgrounds
- Primary: `#121212` (Dark Surface)
- Secondary: `#1E1E1E` (Elevated Surface)
- Tertiary: `#2D2D2D` (Card Surface)

#### Text
- Primary: `#FFFFFF` (High emphasis)
- Secondary: `#B0B0B0` (Medium emphasis)
- Tertiary: `#808080` (Low emphasis)

#### Accent Colors
- Primary: `#00BCD4` (Brighter in dark)
- Secondary: `#006B7D` (Adjusted for contrast)

## Usage Guidelines

### Do's ✅
- Use primary teal for main actions and brand elements
- Maintain consistent spacing (4px grid)
- Use appropriate elevation for hierarchy
- Keep text readable with sufficient contrast
- Use status colors consistently

### Don'ts ❌
- Don't use bright colors for large areas
- Don't mix inconsistent border radius
- Don't use low contrast text
- Don't overcomplicate with too many colors
- Don't ignore dark mode variants

## Implementation Priority

1. **Phase 1**: Update color variables and primary theme
2. **Phase 2**: Create and implement logo/branding
3. **Phase 3**: Redesign key components (sidebar, header, cards)
4. **Phase 4**: Refine animations and micro-interactions
5. **Phase 5**: Polish dark mode and accessibility

## References

Inspired by:
- **Moderna**: Clean, modern pharmaceutical design
- **Pfizer**: Professional medical interface
- **BioNTech**: Scientific precision and clarity
- **Benchling**: Biotech software UI patterns
- **GINKGO Bioworks**: Innovation-focused design
