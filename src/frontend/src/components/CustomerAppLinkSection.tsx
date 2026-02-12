import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomerAppLinkSection() {
  const [copied, setCopied] = useState(false);
  
  // Generate the customer app link dynamically based on current domain
  const customerAppLink = `${window.location.origin}/customer`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(customerAppLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenLink = () => {
    window.open(customerAppLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Customer App Link</h2>
        <p className="text-muted-foreground">Share this link with customers to access the Customer Portal</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Customer Portal Access
          </CardTitle>
          <CardDescription>
            Direct link to the Customer App where customers can submit property inquiries and track their queries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={customerAppLink}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleOpenLink}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Customer Portal
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-semibold text-sm">How to use:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Copy the link and share it with customers via email, WhatsApp, or other channels</li>
              <li>Customers can register and submit property inquiries (Rent, Sales, Interior)</li>
              <li>All customer queries will appear in the "Queries" section of this CRM dashboard</li>
              <li>Queries are automatically assigned to agents for follow-up</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
