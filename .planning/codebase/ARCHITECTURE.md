# Architecture

**Analysis Date:** 2026-02-13

## Pattern Overview

**Overall:** Next.js App Router with component-driven UI layer

**Key Characteristics:**
- Next.js 16 with React 19 server components as default
- Presentational UI component library (shadcn/ui) with 56+ pre-built components
- Tailwind CSS v4 styling with CSS variables for theming
- Client component isolation: UI interactions marked with `"use client"` directive
- No API routes, middleware, or backend logic currently configured
- Form handling via React Hook Form with Zod validation

## Layers

**Presentation Layer:**
- Purpose: Reusable UI components and page layouts
- Location: `components/ui/`, `app/`
- Contains: Stateless and stateful UI components, page templates, layouts
- Depends on: Radix UI primitives, Tailwind CSS, class-variance-authority (CVA) for variants
- Used by: Pages and other components for rendering UI

**Styling Layer:**
- Purpose: Design tokens, theme configuration, global styles
- Location: `app/globals.css`
- Contains: Tailwind v4 imports, CSS variables for light/dark themes, color/typography configuration
- Depends on: Tailwind CSS, `tw-animate-css`, `shadcn/tailwind.css`
- Used by: All components via Tailwind class names and CSS variable references

**Utilities & Hooks:**
- Purpose: Helper functions and React hooks for common logic
- Location: `lib/utils.ts`, `hooks/use-mobile.ts`
- Contains: `cn()` utility for merging Tailwind classes, `useIsMobile()` hook for responsive logic
- Depends on: `clsx`, `tailwind-merge`, React
- Used by: Components across the application

**App Entry Point:**
- Purpose: Root layout with font configuration and metadata
- Location: `app/layout.tsx`
- Contains: Root HTML setup, Geist font loading, global metadata
- Depends on: Next.js font utilities, `app/globals.css`
- Used by: All pages via layout composition

## Data Flow

**Page Rendering:**

1. User requests URL
2. Next.js App Router matches to page.tsx or nested route
3. Root layout applies Geist fonts and global styles
4. Page/component tree renders with server components by default
5. Client components (marked `"use client"`) hydrate for interactivity
6. Tailwind classes and CSS variables apply styling

**Component Composition:**

1. Radix UI primitives provide unstyled, accessible foundations
2. shadcn/ui components wrap primitives with Tailwind styles and variants
3. Components export multiple sub-components (e.g., Card, CardHeader, CardContent)
4. Parent component applies `data-slot` attributes for CSS targeting and semantic structure

**Styling Resolution:**

1. `cn()` utility merges Tailwind classes (via `clsx`) and resolves conflicts (via `tailwind-merge`)
2. CSS variables from `globals.css` provide theme tokens (colors, radius, fonts)
3. Dark mode toggle switches `:root` variables via `.dark` class
4. Responsive classes use Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px, etc.)

**State Management:**

- Page-level state: None configured yet
- Component-level state: React.useState() via hooks
- Form state: React Hook Form manages form inputs and validation via Zod schemas
- No global state management (Redux, Zustand, etc.) currently in use

## Key Abstractions

**UI Component Pattern:**

- Purpose: Reusable, composable UI building blocks with consistent styling and behavior
- Examples: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/combobox.tsx`
- Pattern: Compound components with namespaced exports (Card, CardHeader, CardContent, etc.)
- Implementation:
  - Accept React component props via spread (`...props`)
  - Use `cn()` to merge Tailwind classes and allow className overrides
  - Export component variants via CVA for standardized variants (e.g., button sizes and colors)
  - Mark interactive components with `"use client"` when they use Radix UI event handlers or hooks

**Variant System (CVA):**

- Purpose: Type-safe component style variants without prop drilling
- Examples: Button sizes (default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg), button variants (default, destructive, outline, secondary, ghost, link)
- Pattern: `cva()` defines variant configuration, `VariantProps<typeof variants>` provides TypeScript types
- Usage: Components spread variant props to apply conditional classes based on size/variant selection

**Slot Pattern:**

- Purpose: Semantic naming and CSS targeting for nested component structures
- Pattern: Components use `data-slot="component-name"` attributes (e.g., `data-slot="card"`, `data-slot="card-header"`)
- Example: Card component has `data-slot="card"`, CardHeader has `data-slot="card-header"`, etc.
- Benefit: Allows parent components to style children without breaking encapsulation

**Client Component Boundary:**

- Purpose: Isolate components requiring browser APIs or hooks to client-side rendering
- Pattern: Add `"use client"` at the top of files using `useEffect()`, `useState()`, event handlers, or Radix UI interactive primitives
- Examples: `components/ui/accordion.tsx`, `components/ui/combobox.tsx`, `components/ui/alert-dialog.tsx`, `hooks/use-mobile.ts`
- Server components remain the default for better performance and security

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Configure fonts (Geist sans/mono), apply root styling, set metadata, render children

**Home Page:**
- Location: `app/page.tsx`
- Triggers: GET /
- Responsibilities: Render welcome page with hero section and CTAs

**CSS Globals:**
- Location: `app/globals.css`
- Triggers: Imported in layout.tsx
- Responsibilities: Load Tailwind CSS, define CSS variables for theming, set root color scheme

## Error Handling

**Strategy:** Not yet configured

**Current State:**
- No error.tsx boundary defined
- No loading.tsx skeleton defined
- No custom error handling middleware

**Future Patterns (Ready for Implementation):**
- Add `app/error.tsx` for error boundary and fallback UI
- Add `app/loading.tsx` for skeleton/fallback during page loads
- Add `app/not-found.tsx` for 404 handling
- Use React error boundary wrapper in error.tsx for layout-level errors

## Cross-Cutting Concerns

**Theming:**
- Approach: CSS variables in `:root` and `.dark` class for light/dark mode
- Implementation: `app/globals.css` defines color palettes (oklch color space), radius, fonts
- Usage: Components reference variables via Tailwind classes (`bg-primary`, `text-foreground`, `rounded-lg`)
- Dark mode: Applied via CSS media query `prefers-color-scheme` or explicit `.dark` class toggle (next-themes capable)

**Styling:**
- Framework: Tailwind CSS v4 with utility-first approach
- Class Merging: `cn()` utility prevents conflicting classes
- Responsive: Mobile-first approach with breakpoints (sm, md, lg, xl, 2xl)
- Dark Mode: CSS variable overrides in `.dark` class scope

**Validation:**
- Framework: React Hook Form + Zod
- Pattern: Define Zod schemas, pass to `useForm()`, validate on input change or form submit
- Example: Used in form components like `components/ui/field.tsx` for integrated field handling

**Component Composition:**
- Pattern: Compound components with controlled and uncontrolled modes
- Example: Radix UI primitives expose both controlled props (value, onChange) and uncontrolled behavior
- Benefit: Flexibility for both simple and complex use cases

**Accessibility:**
- Foundation: Radix UI handles ARIA attributes, keyboard navigation, semantic HTML
- Implementation: Components inherit a11y features from primitives
- Responsibility: Component consumers use semantic elements and test keyboard interactions

---

*Architecture analysis: 2026-02-13*
