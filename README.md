# Ground Motion Monitoring Service

A customer-facing web platform for delivering ground-motion monitoring and
analysis results. Customers sign in to a secure portal to view the projects
and results associated with their account.

This repository contains the initial application foundation: public homepage,
authentication, a basic customer portal, and the underlying database schema.

## Technology stack

React 18, TypeScript (strict), Vite, React Router v6, Supabase (Postgres +
Authentication), and plain CSS Modules with global design tokens. The path
alias `@` resolves to `src/`.

## Local installation

1. Install Node.js 18 or later.
2. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

## Supabase project setup

1. Create a project at [supabase.com](https://supabase.com).
2. Apply the migrations in `supabase/migrations/` in order:
   - `001_initial_schema.sql` — tables, enums, and triggers
   - `002_row_level_security.sql` — RLS policies
   - `003_profile_trigger.sql` — automatic profile creation on sign-up

   Either paste each file into the Supabase SQL Editor, or use the Supabase
   CLI:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

3. (Optional, development only) Sign up a test user through the app, then run
   `supabase/seed.sql` after replacing the placeholder UUID with that user's
   auth ID. The application does not depend on seed data.

By default Supabase requires email confirmation for new sign-ups. You can
disable this for local development under Authentication → Providers → Email.

## Environment variables

Copy `.env.example` to `.env` and fill in the values from your Supabase
project (Settings → API):

```text
VITE_SUPABASE_URL=      # Project URL
VITE_SUPABASE_ANON_KEY= # Public anon key
```

Only the public anon key is used in the browser. Never put the service-role
key in this file or anywhere in the frontend. The app fails fast with a clear
error if these variables are missing.

## Development commands

```bash
npm run dev        # Start the dev server
npm run build      # Type-check and build for production
npm run preview    # Preview the production build
npm run typecheck  # Type-check without emitting
```

## Current scope

- Public homepage
- Email/password sign-up, sign-in, sign-out, and password-reset request
- Protected customer portal: dashboard, projects list, project detail with
  result metadata, account page
- Admin route placeholder (accessible only to users with the `admin` role)
- Postgres schema for profiles, projects, results, and service orders
- Row-level security so customers can only read their own records

Roles: new users default to `customer`. To make a user an administrator, set
their role manually in the database (users cannot change their own role).

## Not yet implemented

InSAR processing, satellite-data retrieval, interactive maps, time-series
charts, file uploads, report/PDF generation, payments or Stripe integration,
subscription billing, email notifications, team/organization management,
administrator tools, search, and production deployment infrastructure.
