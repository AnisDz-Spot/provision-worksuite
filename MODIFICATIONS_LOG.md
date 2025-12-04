# Workspace Modifications Log

This file tracks all code and config changes made by GitHub Copilot for easy review and revert in case of major errors.

## 2025-12-04

- Added `expenses` and `invoices` tables to `lib/db/schema.sql`.
- Added modal forms and floating buttons for adding expenses and invoices in `/finance/expenses` and `/finance/invoices` pages.
- Implemented backend API endpoints for expenses and invoices with fallback to mock data if DB is not configured.
- Created `prisma/schema.prisma` with models for User, Project, Expense, and Invoice.
- Attempted Prisma migration (failed due to missing DB config).
- Removed deprecated `url` property from `datasource` block in `prisma/schema.prisma` for Prisma 7+ compatibility.
- Set placeholder PostgreSQL connection string in `prisma.config.ts` for dev mode.
- Created mock data files: `data/expenses.json`, `data/invoices.json`, and `data/timelogs.json` for finance feature validation and fallback.
- Fixed invalid React hook call in `/finance/invoices/page.tsx` by moving all hook calls inside the `InvoicesPage` function component.

---

Add further changes below as they are made.
