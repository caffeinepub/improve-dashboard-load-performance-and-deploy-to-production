# Specification

## Summary
**Goal:** Speed up Admin/Agent dashboard rendering immediately after Internet Identity login by reducing unnecessary refetching and removing blocking access-control initialization when not needed.

**Planned changes:**
- Update `frontend/src/hooks/useActor.ts` to stop triggering a broad React Query `refetchQueries` on actor creation; instead, only invalidate/refetch a minimal, explicitly-defined set of dependent queries.
- Skip (or make non-blocking) `_initializeAccessControlWithSecret` when `caffeineAdminToken` is missing/empty, and ensure errors in access-control initialization do not block normal dashboard access.
- Ensure the dashboard shell renders promptly after authentication, keeping existing skeleton loading patterns for sections/metrics and minimizing full-screen loading states (while preserving existing profile-setup and `DashboardLoadErrorState` behaviors).

**User-visible outcome:** After logging in, users reach the CRM dashboard quickly and see the dashboard layout immediately, with content loading progressively via skeletons instead of a long blank/loading delay.
