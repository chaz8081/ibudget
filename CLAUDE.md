# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Issue Tracking

This project uses **bd (beads)** for all issue tracking. See [AGENTS.md](AGENTS.md) for the full workflow. Do NOT use markdown TODOs, TaskCreate, or other tracking methods.

## Commands

```bash
# Development
npm run start                          # Start Metro bundler
npm run web                            # Expo web dev server (localhost:8081)
npm run ios                            # Build & run on iOS simulator
npm run android                        # Build & run on Android

# Quality
npm run lint                           # TypeScript type checking (tsc --noEmit)
npm run test                           # Jest tests

# Local-only dev (no Supabase needed)
EXPO_PUBLIC_AUTH_PROVIDER=local npm run web

# Task runner (requires Docker for Supabase tasks)
task dev:ios                           # Auto-starts simulator + Supabase
task dev:android                       # Auto-starts emulator + Supabase
task dev:web                           # Auto-starts Supabase
task db:reset                          # Drop all data, re-run migrations + seed
task typecheck                         # Same as npm run lint
```

No Expo Go — this project requires dev builds (PowerSync native modules).

## Development

Primary languages: TypeScript, Go, Markdown. When editing TypeScript files, always run type checks (`npx tsc --noEmit`) before considering work complete.

## Architecture

**Offline-first family budgeting app** using envelope/zero-based methodology. React Native + Expo SDK 55, targeting iOS, Android, and Web from a single codebase.

### Routing

Expo Router v4 file-based routing. All routes live under `src/app/`:

- `src/app/_layout.tsx` — Root layout: auth gate, theme provider, database provider
- `src/app/(tabs)/` — Tab navigator (dashboard, envelopes, transactions, household, settings)
- `src/app/sign-in.tsx`, `sign-up.tsx`, `forgot-password.tsx` — Auth screens

### Feature Modules (`src/features/`)

Each feature has `hooks/`, `schemas/` (Zod), `utils/`, and optionally `providers/`:

- `auth/` — Dual auth providers (LocalAuthProvider for offline dev, Supabase for production). Both implement `AuthContext` interface in `AuthContext.ts`. Switched via `EXPO_PUBLIC_AUTH_PROVIDER` env var in `_layout.tsx`.
- `budget/` — useBudget, useEnvelopes, useCategories, useAssignIncome. Budget calculations in `utils/budget-calculations.ts`.
- `transactions/` — useTransactions, useRecurringTransactions, useProcessRecurring. Recurrence logic in `utils/recurrence-rule.ts` (iCalendar-like: frequency, by_day_of_week, by_month_day, end_type).
- `household/` — useHousehold, household creation/joining/member management.

### Database Layer

PowerSync as local reactive SQLite. No state management library — `useQuery()` from `@powersync/react` provides reactive queries.

- `src/db/schema.ts` — PowerSync schema (TableV2 definitions)
- `src/db/tables.ts` — Table name constants
- `src/db/provider.tsx` — Native database singleton (OPSqliteOpenFactory)
- `src/db/provider.web.tsx` — Web database singleton (wa-sqlite WASM)
- `src/db/web-polyfills.ts` — WASM loader shims for Metro web
- `src/db/connector.ts` — Supabase sync connector stub

Query pattern:
```typescript
const { data } = useQuery<RowType>("SELECT * FROM table WHERE col = ?", [val]);
const db = usePowerSync();
await db.execute("INSERT INTO ...", [params]);
await db.writeTransaction(async (tx) => { ... });
```

Tables: profiles, households, household_members, household_invites, categories, budgets, envelope_allocations, accounts, transactions, recurring_transactions.

### Key Conventions

- **Money as cents**: All monetary values stored as integers (cents). Use `formatCents()` to display, `parseCurrencyInput()` to parse. Max: $9,999,999,999.99.
- **Categories are per-household** (shared); **allocations are per-user** (individual budgets).
- **Forms**: react-hook-form + Zod schemas. `FormField` wrapper for consistent styling. `CurrencyInput` for money fields.
- **Styling**: NativeWind v4 (Tailwind classes). Colors defined in `tailwind.config.js` and `src/constants/colors.ts`. Dark mode via `useColorScheme()`.
- **Theme handling**: Root layout uses React Native `Appearance` API for navigation theme (not NativeWind directly). On web, uses `document.documentElement.style.colorScheme` instead of `Appearance.setColorScheme()`.
- **Storage**: `src/utils/storage.ts` abstracts SecureStore (native) vs localStorage (web).
- **UUIDs**: `src/utils/uuid.ts` using expo-crypto.
- **Path alias**: `@/*` maps to `./src/*` (tsconfig paths).

### Platform-Specific Files

Use `.web.tsx` suffix for web-specific implementations (e.g., `provider.web.tsx`). Metro resolves these automatically.

## Git Workflow

When working with git worktrees, always verify the current worktree path before reading or writing files. Use `git worktree list` to confirm paths.

Do not add Co-authored-by or co-author attribution lines to git commits.

## Code Editing Guidelines

When using `replace_all` or bulk edits, be careful not to replace function definitions along with call sites. Review the scope of replacements before applying.
