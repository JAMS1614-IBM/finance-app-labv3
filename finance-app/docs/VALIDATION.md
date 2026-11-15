# Validation guide

All commands run from `finance-app/`. Requires Node 22+.

## One command

```bash
npm run validate
```

Runs, in order, and stops at the first failure: **lint → typecheck → tests with coverage → production build**.
CI runs the same four steps (`.github/workflows/finance-app-ci.yml`), so a green local run should mean a green PR.

## Individual checks

| Command | What it checks | Success looks like |
|---|---|---|
| `npm run lint` | ESLint over `src/` and `server/` | No output after the script banner, exit 0 |
| `npm run typecheck` | `tsc --noEmit`, strict mode | No output, exit 0 |
| `npm test` | All Vitest suites | `Test Files 10 passed`, `Tests 53 passed`, no failures |
| `npm run test:coverage` | Tests plus coverage floors | Same as above, plus a coverage summary and no `ERROR: Coverage ... does not meet global threshold` |
| `npm run build` | Typecheck and Vite production bundle | `✓ built in …s`, files written to `dist/` |

Coverage floors (in `vite.config.ts`): lines 90%, statements 90%, functions 85%, branches 85%.
Current results are about 99% lines, 93% branches, 91% functions. A drop below a floor fails the run.

Expected noise, not failures:
- Tests print a Recharts warning that the chart container has width 0. jsdom has no layout.
- The build warns that one chunk is over 500 kB (Recharts).

## What the tests cover

| Area | File | Covers |
|---|---|---|
| Data transformation | `src/domain/metrics.test.ts` | Point cleanup and ordering, percent change, rebasing to 100 |
| Data transformation | `src/domain/normalize.test.ts` | Yahoo quote mapping and fallbacks, series cleanup, day-window session trimming |
| Provider contract | `src/services/mockProvider.test.ts`, `yahooProxyProvider.test.ts` | Deterministic mock data, URL building, error messages, proxy-down message |
| Server routes | `server/app.test.ts` | Validation, window-to-interval mapping, 400/404/502 handling, caching, ordering |
| Yahoo adapter | `server/yahooClient.test.ts` | Mocked `yahoo-finance2`: symbol filtering, regular-hours request, "No data" to empty |
| UI components | `src/components/cards/components.test.tsx` | Quote formatting and colour class, chart card loading/error/retry, tabs |
| UI rendering path | `src/pages/DashboardPage.test.tsx` | Five quote cards, window switching, error state when the provider fails |
| App boot | `src/App.test.tsx` | Full render through real providers on mock data |

No test calls Yahoo or the network. Live behaviour is checked manually (below).

## Manual smoke test (live data, not part of CI)

```bash
npm run dev:live      # proxy on :8787 plus the UI
```

Open the URL Vite prints, usually http://localhost:5173. Success looks like:
1. Five quote cards (IBM highlighted) with prices and green/red changes.
2. A chart of five lines indexed to 100.
3. Each tab (Current Day, Last 7 Days, Last Quarter) redraws the chart without a page reload.
4. `curl localhost:8787/api/health` returns `{"ok":true}`.

Failure check: stop the proxy and press Retry. The page should show "Market data proxy is not responding (500). Start it with "npm run proxy"." rather than a blank page.

## When a check fails

- **Lint or typecheck:** fix the reported line; do not disable the rule.
- **Coverage threshold:** add a test for the new code rather than lowering the floor.
- **A UI test fails after a text change:** tests query by role and accessible name, so update the expected label.
