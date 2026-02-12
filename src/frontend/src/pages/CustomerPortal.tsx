import { useCustomerAuth } from '../hooks/useCustomerAuth';
import CustomerLoginPage from './CustomerLoginPage';
import CustomerDashboard from './CustomerDashboard';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function CustomerPortal() {
  const { isAuthenticated, isLoading, phoneNumber, error } = useCustomerAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading customer portal...</p>
      </div>
    );
  }

  // Show error state if authentication check failed
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated || !phoneNumber) {
    return <CustomerLoginPage />;
  }

  // Show customer dashboard
  return <CustomerDashboard phoneNumber={phoneNumber} />;
}
