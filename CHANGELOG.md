## 2026-07-26 - Add `formatCurrency` utility

**Goal:** Add a pure utility `formatCurrency` to format numbers and numeric strings into localized USD currency strings with sensible fallbacks.
**Branch:** `agent/add-currency-util`
**Iterations Used:** 1 / 15

### PIV Cycle Summary

**1. Plan (P)**
*   **Approach:** Implement a small TypeScript utility `formatCurrency(value)` accepting numbers and numeric strings; use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` for formatting; return `$0.00` for invalid inputs.
*   **Scope:** Files to create: `src/utils/formatCurrency.ts`, `src/__tests__/formatCurrency.test.ts`.

**2. Implement (I)**
*   **Files Modified/Created:** 
    *   `src/utils/formatCurrency.ts` - New utility implementation
    *   `src/__tests__/formatCurrency.test.ts` - Unit tests covering numbers, numeric strings, negatives, null/undefined, NaN, non-numeric strings
*   **Migrations Generated:** None
*   **Commits:** `agent(add-currency-util): add formatCurrency util and tests`

**3. Validate (V)**
*   **Test Results:** Pass - `npx vitest --run` shows 5 tests passed
*   **Build Status:** Pass - `npm run build` completed successfully; bundle-size warning unchanged
*   **Lint/Type Checks:** N/A - `tsc` already passes in main

### Outcome & Reviewer Notes
**Status:** Success
**Notes:** Utility returns `$0.00` for invalid inputs and formats negatives with a leading minus per `Intl.NumberFormat`. Tests cover expected edge cases.
