# Specification

## Summary
**Goal:** Improve Dashboard load performance by deferring non-essential data fetching, optimizing Overview data loading, and deploy the improved build to production.

**Planned changes:**
- Update the Dashboard so only the active (Overview) tab fetches data on initial load; defer other tabs’ network calls until their tab is opened.
- Add a dedicated backend query for the Dashboard Overview that returns only aggregated metrics and a small, bounded set of recent items needed by the Overview UI.
- Update the Overview tab to use the new single backend query, show loading skeletons while it loads, and ensure correct metrics for both admin and agent roles.
- Deploy the latest approved build containing these performance improvements to production and verify Dashboard loads successfully after login.

**User-visible outcome:** The Dashboard opens faster, with Overview loading quickly and other tabs loading their data only when selected; the production site is updated and accessible.
