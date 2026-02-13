# Coding Conventions

**Analysis Date:** 2026-02-13

## Naming Patterns

**Files:**
- Components: PascalCase, descriptive names (e.g., `button.tsx`, `alert-dialog.tsx`, `input-group.tsx`)
- Utilities: camelCase (e.g., `utils.ts`)
- Pages/Layouts: lowercase as per Next.js App Router conventions (`page.tsx`, `layout.tsx`, `globals.css`)
- UI components: lowercase with hyphens for multi-word names (e.g., `alert-dialog.tsx`, `button-group.tsx`)

**Functions:**
- Component functions: PascalCase (e.g., `Button`, `Card`, `FormField`, `SelectTrigger`)
- Helper functions: camelCase (e.g., `useFormField`, `useDirection`, `cn`)
- Hook functions: camelCase with `use` prefix (e.g., `useFormContext`, `useFormField`, `useDirection`)

**Variables:**
- Standard variables: camelCase (e.g., `className`, `fieldContext`, `itemContext`, `formState`)
- State variables: camelCase (e.g., `open`, `openProp`, `variant`, `size`)
- Constants: SCREAMING_SNAKE_CASE or PascalCase for component constants (e.g., `FormFieldContext`, `FormItemContext`)

**Types:**
- TypeScript types/interfaces: PascalCase (e.g., `FormFieldContextValue`, `FieldValues`, `FieldPath`, `VariantProps`)
- Generic type parameters: Single uppercase letter or descriptive (e.g., `TFieldValues`, `TName`)

## Code Style

**Formatting:**
- Biome 2.2.0 handles formatting via `biome format --write`
- 2-space indentation (configured in `biome.json`)
- No semicolons in JSX/TSX
- Consistent spacing in import statements

**Linting:**
- Biome linter enabled with `biome check` (not ESLint)
- Recommended rules for React and Next.js domains active
- Custom rule: `noUnknownAtRules` disabled to allow Tailwind CSS `@` directives
- File ignores: `node_modules`, `.next`, `dist`, `build`

**VCS Integration:**
- Git-aware with `.gitignore` support enabled in Biome
- Biome configured to check files via git

## Import Organization

**Order:**
1. React and React DOM imports (e.g., `import * as React from "react"`)
2. Third-party UI library imports (e.g., `from "radix-ui"`, `from "class-variance-authority"`)
3. Icons library (e.g., `from "lucide-react"`)
4. Internal project imports (e.g., `from "@/lib/utils"`, `from "@/components/ui/..."`)
5. Type imports (e.g., `import type { ... }`)

**Path Aliases:**
- `@/*` maps to project root (configured in `tsconfig.json`)
- Used consistently for absolute imports: `@/lib/utils`, `@/components/ui/button`, `@/components/ui/label`
- Prevents relative path depth (no `../../` patterns)

**Import Assist:**
- Biome organizeImports assist action enabled for automatic organization

## Error Handling

**Patterns:**
- Validation errors via form state management (react-hook-form with Zod)
- Form-level error handling through `FormMessage` component showing field-level validation errors
- Example: `FormMessage` checks `error?.message` from form state
- Null checks in rendering: `if (!body) return null` pattern used in conditional rendering
- Context error boundaries: `useFormField()` throws error if used outside context: `throw new Error("useFormField should be used within <FormField>")`

**Error Checking:**
- Conditional rendering with explicit null/undefined checks
- ARIA attributes for invalid state: `aria-invalid={!!error}`
- Visual feedback via CSS classes: `data-error={!!error}` attributes

## Logging

**Framework:** console (no dedicated logging library detected)

**Patterns:**
- No explicit logging found in component code
- Debug info available through data attributes (e.g., `data-slot="button"`, `data-variant="default"`)
- State debugging via form hooks context values
- No error logging infrastructure currently in place

## Comments

**When to Comment:**
- Inline comments used for non-obvious logic (e.g., variant-based styling, state management explanations)
- Examples found in:
  - `components/ui/sidebar.tsx`: "Variants based on alignment", "Focus state", "Error state" (input-group)
  - `components/ui/chart.tsx`: Format mapping explanation, helper function documentation
  - `components/ui/sidebar.tsx`: Multiple state management comments explaining internal behavior

**JSDoc/TSDoc:**
- No formal JSDoc patterns observed in codebase
- Type information sufficient via TypeScript interfaces and type exports
- React component props documented via inline TypeScript types

## Function Design

**Size:**
- Most functions are single-responsibility and concise
- Component wrapper functions typically 10-50 lines (e.g., `Button`, `Input`, `Card`)
- Complex components (form helpers, sidebar) 200+ lines due to state management

**Parameters:**
- Props spread pattern: `{ className, ...props }` for extending HTML element attributes
- Destructuring first, then optional parameters with defaults
- Type unions with `&` for combining HTML props with custom props
- Example: `React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }`

**Return Values:**
- Always return JSX elements for components (never void)
- Utility functions return values directly: `cn()` returns string, hooks return objects/values
- Conditional early returns: `if (!body) return null` pattern for optional rendering

## Module Design

**Exports:**
- Named exports consistently used: `export { Button, buttonVariants }`
- Multiple exports per file when related (e.g., `Card`, `CardHeader`, `CardContent`, `CardFooter`)
- Compound component pattern: parent and child exports together
- Type exports: `export type FormFieldContextValue`

**Barrel Files:**
- Component libraries export all UI components from centralized location
- `components/ui/` directory contains one file per component type
- No barrel re-export index found (each component imports directly)

## TypeScript Configuration

**Strict Mode:** Enabled (strict: true in tsconfig.json)
- Strict null checks enforced
- All implicit any flagged

**React Mode:**
- JSX: "react-jsx" (modern syntax without React import needed)
- React 19 with latest TSX patterns

**Type Safety:**
- React.ComponentProps used extensively for prop typing
- Readonly types for component props: `Readonly<{ children: React.ReactNode }>`
- Generic types for form handling: `FieldValues`, `FieldPath<TFieldValues>`

## Component Patterns

**Data Attributes:**
- `data-slot` attribute on all component root elements for styling and testing
- `data-variant`, `data-size` on components with variants
- `data-state` for state-dependent styling
- `data-orientation` for layout variants
- Example: `<button data-slot="button" data-variant={variant} data-size={size} />`

**CVA (Class Variance Authority):**
- Used for variant-based styling (e.g., button variants with size/style options)
- Variants defined at top of component file
- Default variants specified in CVA config
- Applied via `cn()` utility combining clsx and tailwind-merge

**Compound Components:**
- Multiple sub-components exported together for composition
- Context providers for shared state (e.g., `FormFieldContext`, `FormItemContext`)
- Child components access parent context via hooks

**Server vs Client:**
- `"use client"` directive added selectively for interactive components
- Server components default (App Router convention)
- Client directive used for: forms, dialogs, interactive UI, hooks

---

*Convention analysis: 2026-02-13*
