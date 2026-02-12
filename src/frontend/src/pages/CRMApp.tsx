import { useEffect, useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useLoadTimeout } from '../hooks/useLoadTimeout';
import { Loader2 } from 'lucide-react';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import DashboardLoadErrorState from '../components/DashboardLoadErrorState';
import { useQueryClient } from '@tanstack/react-query';

export default function CRMApp() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { timedOut, startTimer, stopTimer, resetTimer } = useLoadTimeout({ timeoutMs: 15000 });
  const [isRetrying, setIsRetrying] = useState(false);

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    error: profileError,
    refetch: refetchProfile,
  } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;

  // Start timeout timer when we begin loading profile for authenticated users
  useEffect(() => {
    if (isAuthenticated && !isInitializing && (profileLoading || !profileFetched)) {
      startTimer();
    } else {
      stopTimer();
    }
  }, [isAuthenticated, isInitializing, profileLoading, profileFetched, startTimer, stopTimer]);

  // Show loading state while initializing authentication
  if (isInitializing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">
          Initializing secure authentication...
        </p>
      </div>
    );
  }

  // Show error state if profile fetch failed or timed out for authenticated users
  if (isAuthenticated && (profileError || timedOut) && (profileFetched || timedOut)) {
    const handleRetry = async () => {
      setIsRetrying(true);
      resetTimer();
      // Clear all cached queries to ensure fresh data
      queryClient.clear();
      try {
        // Retry the profile fetch
        await refetchProfile();
      } finally {
        setIsRetrying(false);
      }
    };

    const errorMessage = timedOut
      ? 'The dashboard is taking longer than expected to load. This could be due to a slow network connection or temporary service issue.'
      : 'We encountered an issue while loading your profile and dashboard data. This may be a temporary connection problem.';

    const technicalDetails = profileError
      ? `Error: ${profileError instanceof Error ? profileError.message : 'Unknown error'}`
      : timedOut
        ? 'Load timeout exceeded (15 seconds)'
        : undefined;

    return (
      <DashboardLoadErrorState
        title="Unable to Load Dashboard"
        message={errorMessage}
        technicalDetails={technicalDetails}
        onRetry={handleRetry}
        isRetrying={isRetrying}
      />
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show profile setup if authenticated but no profile exists
  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;
  if (showProfileSetup) {
    return <LoginPage />;
  }

  // Show dashboard shell immediately after authentication completes
  // The profile check above ensures we only reach here if profile exists or is still loading
  // Dashboard components will handle their own loading states
  if (isAuthenticated && (userProfile || profileLoading)) {
    return <Dashboard />;
  }

  // Fallback loading state (should rarely be reached)
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">
        Loading your dashboard...
      </p>
    </div>
  );
}
