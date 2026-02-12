import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function CRMApp() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
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

  // Show error state if profile fetch failed
  if (isAuthenticated && profileError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription className="mt-2">
            Failed to load your profile. Please try again.
          </AlertDescription>
          <Button 
            onClick={() => refetchProfile()} 
            variant="outline" 
            size="sm"
            className="mt-4"
          >
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  // Show login page if not authenticated OR if profile setup is needed
  if (!isAuthenticated || (isAuthenticated && profileFetched && userProfile === null)) {
    return <LoginPage />;
  }

  // Show loading state while fetching user profile
  if (profileLoading || !profileFetched) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  // Show dashboard if authenticated and profile exists
  return <Dashboard />;
}
