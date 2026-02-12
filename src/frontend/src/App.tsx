import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from './components/ErrorBoundary';
import CRMApp from './pages/CRMApp';
import CustomerPortal from './pages/CustomerPortal';

// Root route with Outlet for child routes
const rootRoute = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div id="app-root" className="min-h-screen">
          <Outlet />
        </div>
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  ),
});

// CRM route (agent/admin)
const crmRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: CRMApp,
});

// Customer portal route
const customerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/customer',
  component: CustomerPortal,
});

// Create router
const routeTree = rootRoute.addChildren([crmRoute, customerRoute]);
const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
});

// Type declaration for router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
