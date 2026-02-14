# Design Rules

Canonical reference for maintaining visual consistency across the YM Serving System.
All new pages and components must follow these rules.

---

## 1. Page Layout

### App Layout (Parent)

The shared layout at `app/(app)/layout.tsx` wraps all authenticated pages:

```tsx
<SidebarProvider>
  <AppSidebar ... />
  <SidebarInset>
    <main className="flex-1 p-4 md:p-6">{children}</main>
  </SidebarInset>
</SidebarProvider>
```

**The `<main>` already applies `p-4 md:p-6`.** Pages must NOT add their own outer padding.

### Standard Page Structure

Every page must use this root wrapper:

```tsx
<div className="flex flex-col gap-6">
  {/* Header */}
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Page Title</h1>
    <p className="mt-1 text-sm text-muted-foreground">
      Short description of the page
    </p>
  </div>

  {/* Content */}
  ...
</div>
```

Rules:
- Root wrapper: `flex flex-col gap-6` (not `space-y-*`)
- No `p-*`, `m-*`, `px-*`, `py-*` on the root wrapper
- `gap-6` between top-level sections

### Auth Layout (Parent)

Auth pages (`login`, `forgot-password`, `verify`, `setup-password`) use a separate centered layout:

```tsx
<div className="flex min-h-svh items-center justify-center px-4 py-12">
  {children}
</div>
```

Auth page root wrapper: `flex flex-col gap-8`

---

## 2. Typography

| Element | Classes | Example |
|---------|---------|---------|
| Page title (h1) | `text-2xl font-bold tracking-tight` | "Services", "Teams" |
| Page subtitle | `mt-1 text-sm text-muted-foreground` | Below page title |
| Card title | `leading-none font-semibold` | Via `<CardTitle>` |
| Section heading | `text-lg font-medium tracking-tight` | Subsections |
| Body text | `text-sm` | Default content |
| Secondary text | `text-sm text-muted-foreground` | Descriptions, helpers |
| Caption/metadata | `text-xs text-muted-foreground` | Timestamps, counts |
| Labels | `text-sm leading-none font-medium` | Form labels |

Font weights: `font-medium` for labels/buttons, `font-semibold` for card titles, `font-bold` for page headings only.

---

## 3. Spacing Scale

### Gap (preferred for flex/grid layouts)

| Token | Value | Use |
|-------|-------|-----|
| `gap-1` | 4px | Compact grouping (icon pairs) |
| `gap-1.5` | 6px | Breadcrumbs, chip groups |
| `gap-2` | 8px | Form fields, icon + text |
| `gap-3` | 12px | Mobile cards, filter bars |
| `gap-4` | 16px | Form sections, card grids |
| `gap-6` | 24px | Page sections, top-level content |

### Padding

| Token | Use |
|-------|-----|
| `p-2` | Compact inner padding |
| `p-4` | Standard card/container padding |
| `p-6` | Large section padding (CardContent) |
| `p-12` | Empty state containers |

### Margin

Avoid margins when possible. Use `gap-*` on parent containers instead.

| Token | Use |
|-------|-----|
| `mt-1` | Subtitle below heading |
| `ml-auto` | Push element to right in flex |

---

## 4. Colors & Theme

### Semantic Colors

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `bg-background` | White | Near-black | Page background |
| `text-foreground` | Near-black | White | Primary text |
| `text-muted-foreground` | Gray | Light gray | Secondary text |
| `bg-muted` | Light gray | Dark gray | Inactive/empty backgrounds |
| `bg-primary` | Blue | Blue | Primary buttons, active states |
| `bg-destructive` | Red | Red | Error/delete actions |
| `text-destructive` | Red | Red | Error messages |

### Status Colors (Custom)

| Token | Use |
|-------|-----|
| `status-confirmed` | Green, confirmed state |
| `status-pending` | Amber, pending state |
| `status-declined` | Red, declined state |

### Dark Mode

- Theme handled via `next-themes` + CSS variables
- Use semantic color tokens (e.g., `text-muted-foreground`), never raw colors
- Theme-aware images: check `resolvedTheme` with `mounted` guard to avoid hydration mismatch

```tsx
const { resolvedTheme } = useTheme();
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const logoSrc = mounted && resolvedTheme === "dark" ? "/white_ym_logo.png" : "/black_ym_logo.jpg";
```

---

## 5. Component Patterns

### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

- Root: `rounded-xl border py-6 shadow-sm`
- Sections: `px-6` horizontal padding
- Internal gap: `gap-6` between header/content/footer
- Content spacing: `space-y-4` for stacked elements inside

### Tables

```tsx
<Card className="border-0 shadow-sm">
  <CardContent className="p-0">
    <Table>...</Table>
  </CardContent>
</Card>
```

- Wrap tables in a Card with `p-0` on CardContent
- Desktop: `<Table>` with `hidden md:block`
- Mobile: Card list with `md:hidden`
- Row hover: `hover:bg-muted/50 transition-colors`

### Empty States

```tsx
<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-12">
  <p className="text-center text-sm text-muted-foreground">
    Empty message here
  </p>
</div>
```

### Badges

| Variant | Use |
|---------|-----|
| `default` | Primary emphasis (active state) |
| `secondary` | Neutral labels, counts, roles |
| `destructive` | Errors, critical status |
| `outline` | Subtle categorization |

---

## 6. Forms

### Structure

```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

- Form container: `space-y-4`
- Form item: `grid gap-2`
- Input height: `h-9` (default)
- Submit button: at bottom, `disabled={isPending}` while submitting

---

## 7. Icons

| Size | Class | Use |
|------|-------|-----|
| Tiny | `size-3` or `size-3.5` | Inside badges, inline indicators |
| Default | `size-4` | Buttons, nav items, table actions |
| Medium | `size-5` | Section headers, page title icons |
| Large | `size-10` | Empty state illustrations |

- Source: `lucide-react`
- Color: inherits from parent (`text-current`) or `text-muted-foreground`

---

## 8. Responsive Design

### Breakpoints

| Breakpoint | Width | Use |
|------------|-------|-----|
| `sm:` | 640px | Rarely used |
| `md:` | 768px | Primary breakpoint (table/card swap, layout shift) |
| `lg:` | 1024px | Wide layouts (grid columns) |

### Common Patterns

**Table/Card swap:**
```tsx
<div className="hidden md:block"><Table>...</Table></div>
<div className="grid grid-cols-1 gap-4 md:hidden">Cards...</div>
```

**Layout shift:**
```tsx
<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
```

**Grid responsive:**
```tsx
<div className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
```

---

## 9. Sidebar

- Component: `components/app-sidebar.tsx`
- Width: `16rem` expanded, `3rem` collapsed (icon rail)
- Collapse mode: `collapsible="icon"` on `<Sidebar>`
- Toggle: inside sidebar header via `useSidebar().toggleSidebar`
- Keyboard shortcut: `Cmd+B` (built-in)
- Expanded elements: use `group-data-[collapsible=icon]:hidden`
- Collapsed elements: use `hidden group-data-[collapsible=icon]:flex`

---

## 10. Interactions

### Focus

All interactive elements: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`

### Hover

- Buttons: variant-specific (`hover:bg-primary/90`, `hover:bg-accent`, etc.)
- Table rows: `hover:bg-muted/50 transition-colors`
- Links/text: `hover:text-foreground` or `hover:underline`

### Disabled

`disabled:pointer-events-none disabled:opacity-50`

### Loading

- Buttons: `disabled={isPending}` + spinner icon
- Spinner: `<Spinner />` component with `animate-spin`

---

## 11. Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `rounded-sm` | 6px | Small elements |
| `rounded-md` | 8px | Inputs, buttons |
| `rounded-lg` | 10px | Containers |
| `rounded-xl` | 14px | Cards |
| `rounded-full` | 9999px | Badges, avatars, pills |

---

## 12. Shadows

| Token | Use |
|-------|-----|
| `shadow-xs` | Inputs, buttons (subtle) |
| `shadow-sm` | Cards (default) |
| `shadow-md` | Dropdowns, modals, hover elevation |

---

## Quick Checklist for New Pages

- [ ] Root wrapper is `<div className="flex flex-col gap-6">`
- [ ] No padding on root wrapper (layout provides `p-4 md:p-6`)
- [ ] Page title uses `text-2xl font-bold tracking-tight`
- [ ] Subtitle uses `mt-1 text-sm text-muted-foreground`
- [ ] Tables wrapped in Card with `p-0`, with mobile card alternative
- [ ] Empty states use dashed border pattern
- [ ] Icons are `size-4` (default) from `lucide-react`
- [ ] Uses semantic color tokens, no raw color values
- [ ] Responsive: mobile-first, `md:` breakpoint for desktop
