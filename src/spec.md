# Specification

## Summary
**Goal:** Ensure the CRM Dashboard reliably loads after a hard refresh for authenticated users, and present a clear recoverable error state when initialization fails.

**Planned changes:**
- Fix the frontend initialization/loading flow so a hard refresh on the app route (`/`) reaches and renders the Dashboard for an already authenticated Internet Identity user.
- Add a non-blocking error state for dashboard/profile initialization failures (e.g., actor init or profile query) that avoids blank/infinite loading and provides a Retry action.
- Rephrase the user-facing error/alert text for dashboard/profile load failures into clear, professional English with an explicit next step (retry).

**User-visible outcome:** After refreshing the CRM app, authenticated users see the Dashboard load normally; if something goes wrong during startup, they see a clear error message with a Retry option instead of a blank screen or endless spinner.
