import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface DashboardLoadErrorStateProps {
  title?: string;
  message?: string;
  technicalDetails?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function DashboardLoadErrorState({
  title = 'Unable to Load Dashboard',
  message = 'We encountered an issue while loading your profile and dashboard data. This may be a temporary connection problem.',
  technicalDetails,
  onRetry,
  isRetrying = false,
}: DashboardLoadErrorStateProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="max-w-md shadow-xl">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-lg font-semibold">{title}</AlertTitle>
            <AlertDescription className="mt-3 space-y-3">
              <p className="text-sm">{message}</p>
              <p className="text-sm">
                Click the button below to try loading again. If the problem persists, please try
                refreshing your browser or contact support.
              </p>
              {technicalDetails && (
                <div className="mt-3 rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-foreground">Technical Details:</p>
                  <p className="mt-1 text-xs text-muted-foreground font-mono break-all">
                    {technicalDetails}
                  </p>
                </div>
              )}
            </AlertDescription>
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry Now'}
            </Button>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
