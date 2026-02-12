import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function CRMApp() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isFetched: profileFetched,
    error: profileError,
    refetch: refetchProfile
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  // Show loading state while initializing authentication
  if (isInitializing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Initializing authentication...</p>
      </div>
    );
  }

  // Show error state if profile fetch failed for authenticated users
  if (isAuthenticated && profileError && profileFetched) {
    const handleRetry = async () => {
      // Clear all cached queries to ensure fresh data
      queryClient.clear();
      // Retry the profile fetch
      await refetchProfile();
    };

    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unable to Load Dashboard</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              We encountered an issue while loading your profile and dashboard data. 
              This may be a temporary connection problem.
            </p>
            <p className="text-sm">
              Click the button below to try again. If the problem persists, please contact support.
            </p>
          </AlertDescription>
          <Button 
            onClick={handleRetry} 
            variant="outline" 
            size="sm"
            className="mt-4"
          >
            Retry Now
          </Button>
        </Alert>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show loading state while fetching user profile (only after authentication is confirmed)
  if (profileLoading || !profileFetched) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  // Show login page for profile setup if authenticated but no profile exists
  if (userProfile === null) {
    return <LoginPage />;
  }

  // Show dashboard if authenticated and profile exists
  return <Dashboard />;
}
