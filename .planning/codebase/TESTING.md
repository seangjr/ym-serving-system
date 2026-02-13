# Testing Patterns

**Analysis Date:** 2026-02-13

## Test Framework

**Runner:**
- Not configured (no jest.config.ts, vitest.config.ts, or similar found)
- Biome provides linting but no test runner integration

**Assertion Library:**
- Not detected

**Run Commands:**
```bash
pnpm lint              # Biome linting (catches code issues, not functional tests)
pnpm format            # Biome formatting check
```

## Test File Organization

**Status:**
- No test files detected in source directories
- Single test file found: `.claude/get-shit-done/bin/gsd-tools.test.js` (framework-related, not application tests)
- Application has zero test coverage

**Location Pattern (Recommended):**
- Co-located approach recommended: `[component].test.tsx` alongside `[component].tsx`
- Example: `components/ui/button.test.tsx` next to `components/ui/button.tsx`

**Naming Convention (Recommended):**
- Files: `*.test.tsx` or `*.spec.tsx`
- Test suites: describe blocks matching component name

## Test Structure (Current Examples from Framework)

**Framework Test Example:**
```javascript
// .claude/get-shit-done/bin/gsd-tools.test.js uses Node.js testing patterns
// Appears to test CLI tools rather than application code
```

**Recommended Structure for This Project:**
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })
})
```

## Mocking

**Current Status:**
- No mocking framework configured
- No mock fixtures or test utilities found

**Recommended Approach:**
- vitest for unit/component testing (preferred for Next.js + React 19)
- Mock Radix UI primitives if testing composition
- Mock form context for form components

**Example (Recommended):**
```typescript
import { vi } from 'vitest'
import { FormProvider, useFormContext } from 'react-hook-form'

// Mock form context for testing FormField
const mockFormContext = {
  getFieldState: vi.fn(),
  watch: vi.fn(),
}

vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form')
  return {
    ...actual,
    useFormContext: () => mockFormContext,
  }
})
```

## Fixtures and Factories

**Current Status:**
- No test fixtures or factories found

**Recommended Location:**
- `__tests__/fixtures/` for mock data
- `__tests__/factories/` for test data builders

**Example (Recommended):**
```typescript
// __tests__/fixtures/form-data.ts
export const validFormData = {
  name: 'John Doe',
  email: 'john@example.com',
}

export const invalidFormData = {
  name: '',
  email: 'invalid-email',
}
```

## Coverage

**Requirements:** None enforced

**Current Status:**
- No coverage measurement configured
- No coverage reports generated

**Recommended Setup:**
```bash
vitest --coverage      # Generate coverage report
```

**Target (Recommended):**
- Minimum 80% line coverage for components
- 100% for utilities and helpers
- Core business logic: 90%+

## Test Types

**Unit Tests:**
- **Scope:** Individual components in isolation
- **Approach:** Test component props, rendering, and user interactions
- **Example:** Button variant application, input value handling

**Component Tests:**
- **Scope:** Components with dependencies (form components, context consumers)
- **Approach:** Test integration with context providers, form state
- **Example:** FormField with controller, CardHeader with slots

**Integration Tests:**
- **Scope:** Multi-component workflows (forms, dialogs)
- **Approach:** Test component composition and data flow
- **Example:** Form with validation, alert dialog with confirm action

**E2E Tests:**
- **Current:** Not used
- **Recommendation:** Use Playwright for critical user flows

## Common Patterns (Recommended)

**Async Testing:**
```typescript
import { render, screen, waitFor } from '@testing-library/react'

it('handles async updates', async () => {
  render(<Component />)
  const button = screen.getByRole('button')

  button.click()

  await waitFor(() => {
    expect(screen.getByText('Updated')).toBeInTheDocument()
  })
})
```

**Error Testing:**
```typescript
it('throws error when hook used outside context', () => {
  // Example from codebase: useFormField throws if no FormFieldContext
  expect(() => {
    render(<ComponentThatUsesFormField />)
  }).toThrow('useFormField should be used within <FormField>')
})
```

**Form Testing (Example):**
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm, FormProvider } from 'react-hook-form'

function TestForm() {
  const form = useForm()
  return (
    <FormProvider {...form}>
      <Input {...form.register('email')} />
    </FormProvider>
  )
}

it('updates form value on input', async () => {
  const user = userEvent.setup()
  render(<TestForm />)

  const input = screen.getByRole('textbox')
  await user.type(input, 'test@example.com')

  expect(input).toHaveValue('test@example.com')
})
```

## Missing Test Infrastructure

**Critical Gaps:**
- No test runner configured (Jest or Vitest)
- No testing library (React Testing Library or similar)
- No assertions library (Vitest, Jest assertions)
- No test utilities or helpers
- No mock data or fixtures

**Required for Testing:**
```json
{
  "devDependencies": {
    "vitest": "^latest",
    "@testing-library/react": "^latest",
    "@testing-library/dom": "^latest",
    "@testing-library/user-event": "^latest",
    "@vitest/coverage-v8": "^latest"
  }
}
```

**Configuration Needed:**
- `vitest.config.ts` - Test runner configuration
- `vitest.setup.ts` - Global test setup
- `.testing-library.config.ts` - Testing library defaults (if needed)

## Component-Specific Testing Considerations

**Button Component (`components/ui/button.tsx`):**
- Test all variants (default, destructive, outline, secondary, ghost, link)
- Test all sizes (default, xs, sm, lg, icon variants)
- Test disabled state
- Test asChild prop with Slot.Root
- Test icon rendering with SVG

**Form Components (`components/ui/form.tsx`):**
- Test FormField with Controller
- Test FormMessage error display
- Test FormControl aria attributes
- Test context error handling
- Test field state integration with react-hook-form

**Select Component (`components/ui/select.tsx`):**
- Test open/close states
- Test item selection
- Test keyboard navigation
- Test scroll buttons
- Test custom size variant

---

*Testing analysis: 2026-02-13*
