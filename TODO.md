# TODO - Fix Compile Errors & Run Smoothly

## Current Errors:
1. **i18next 'keyFromSelector' not exported**: react-i18next version mismatch.
2. **react-select type error** in GlobalSearchFilter.tsx:264 (grouped options wrong type).
3. **Iterator errors** (Array.keys(), Set) - tsconfig target fixed to es2020, but fork-ts-checker bug with casing.

## Steps:
- [ ] Fix i18next: `npm i i18next@22.5.1 react-i18next@13.5.2` (compatible versions).
- [ ] Fix GlobalSearchFilter.tsx: Make options flat array `{label, value}[]`.
- [ ] Restart `npm start`.
- [ ] Fix hydration #418/#423 in BacklogSprint.tsx (move localStorage).
- [ ] Test BacklogSprint page.

Updated tsconfig.json (target es2020, strict true).
