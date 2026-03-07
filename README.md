# iBudget

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?logo=react&logoColor=white)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![License](https://img.shields.io/badge/License-Apache%202.0-orange)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android%20%7C%20Web-lightgrey)]()

An offline-first family budgeting app using the **envelope (zero-based) method**. Built with React Native and Expo for iOS, Android, and Web.

## Features

- **Envelope Budgeting** — Allocate every dollar of income to purpose-driven categories
- **Offline-First** — Works without internet using PowerSync as a local reactive SQLite database
- **Multi-Platform** — Runs on iOS, Android, and Web from a single codebase
- **Household Sharing** — Create a household and share budgets with family members
- **Recurring Transactions** — Set up weekly, biweekly, monthly, or yearly recurring transactions that auto-generate
- **Dark Mode** — System-aware theme with manual light/dark/system toggle
- **Demo Data** — One-tap seed data to explore the app with realistic sample budgets

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React Native](https://reactnative.dev/) + [Expo SDK 55](https://expo.dev/) |
| Navigation | [Expo Router v4](https://docs.expo.dev/router/introduction/) (file-based) |
| Database | [PowerSync](https://www.powersync.com/) (local reactive SQLite) |
| Backend | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Edge Functions) |
| Styling | [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS for RN) |
| Forms | [react-hook-form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| Dates | [date-fns](https://date-fns.org/) |

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm**
- **Xcode** (iOS) or **Android Studio** (Android)
- **Watchman** (recommended): `brew install watchman`

See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed platform-specific setup instructions.

### Quick Start

```bash
# Clone and install
git clone https://github.com/chaz8081/ibudget.git
cd ibudget
npm install

# iOS
npx expo prebuild --platform ios
npx expo run:ios

# Android
npx expo prebuild --platform android
npx expo run:android

# Web (development server)
npm run web
```

> **Note:** This project uses PowerSync's native SQLite driver and requires dev builds — Expo Go is not supported.

### Demo Data

After launching, go to **Settings > Load Demo Data** to populate the app with a sample household, budget, categories, and transactions.

## Project Structure

```
src/
  app/                    # Expo Router file-based routes
    (tabs)/               # Tab navigator
      dashboard/          # Budget overview & income assignment
      envelopes/          # Category management & allocation
      transactions/       # Transaction list & entry
      household/          # Household management
      settings/           # Profile, theme, demo data
  components/             # Shared UI components
  features/               # Feature modules (auth, budget, household, transactions)
  db/                     # Database provider & schema
  contexts/               # React contexts (toast notifications)
  constants/              # Colors, shared constants
  utils/                  # Utilities (currency, dates, errors, UUID)
```

## Architecture

- All monetary values stored as **integers (cents)** — formatted at the UI layer
- Categories are **per-household** (shared); allocations are **per-user**
- Local-first with optional Supabase sync — swap one import to enable cloud sync
- Auth interface abstraction allows switching between local and Supabase auth

See [GETTING_STARTED.md](GETTING_STARTED.md) for development workflow details.

## Scripts

```bash
npm run start          # Start Metro bundler
npm run android        # Build & run on Android
npm run ios            # Build & run on iOS
npm run web            # Start web dev server
npm run lint           # TypeScript type checking
npm run test           # Run Jest tests
```

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](LICENSE) file for details.
