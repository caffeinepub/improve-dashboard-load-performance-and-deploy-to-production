import { useState, useEffect } from 'react';
import { useIsWhatsAppActive, useUpdateWhatsAppConfig, useIsCallerAdmin, useGetAllCustomers, useGetMessageTemplatesByCategory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, MessageCircle, CheckCircle2, AlertCircle, Lock, Send, Info } from 'lucide-react';
import type { WhatsAppConfig, TemplateCategory } from '../backend';

export default function WhatsAppSection() {
  const { data: isActive, isLoading: activeLoading, refetch: refetchStatus } = useIsWhatsAppActive();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: customers = [], isLoading: customersLoading } = useGetAllCustomers();
  const updateConfig = useUpdateWhatsAppConfig();
  
  const [formData, setFormData] = useState({
    apiKey: '',
    businessNumber: '',
  });

  // Manual message sending state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('general' as TemplateCategory);
  const [messageText, setMessageText] = useState('');
  const { data: templates = [] } = useGetMessageTemplatesByCategory(selectedCategory);

  // Refetch status after successful update
  useEffect(() => {
    if (updateConfig.isSuccess) {
      refetchStatus();
    }
  }, [updateConfig.isSuccess, refetchStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apiKey.trim() || !formData.businessNumber.trim()) return;

    const config: WhatsAppConfig = {
      apiKey: formData.apiKey.trim(),
      businessNumber: formData.businessNumber.trim(),
      isActive: false, // Backend will set this based on validation
    };

    updateConfig.mutate(config, {
      onSuccess: () => {
        setFormData({ apiKey: '', businessNumber: '' });
      },
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id.toString() === templateId);
    if (template) {
      setMessageText(template.content);
    }
  };

  const handleSendOnWhatsApp = () => {
    const customer = customers.find(c => c.id.toString() === selectedCustomerId);
    if (!customer || !customer.phone) {
      return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = customer.phone.replace(/\D/g, '');
    
    // Encode message for URL
    const encodedMessage = encodeURIComponent(messageText);
    
    // Generate wa.me link
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
  };

  if (activeLoading || adminLoading || customersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);
  const canSendManual = selectedCustomerId && messageText.trim() && selectedCustomer?.phone;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">WhatsApp Integration</h2>
        <p className="text-muted-foreground">Configure WhatsApp Business API or send messages manually</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Status
              </CardTitle>
              <CardDescription>Current integration status</CardDescription>
            </div>
            {isActive ? (
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500/20 text-amber-700 dark:text-amber-400">
                <AlertCircle className="mr-1 h-3 w-3" />
                Inactive
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isActive ? (
            <Alert className="border-green-500/20 bg-green-500/5">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-900 dark:text-green-100">✅ WhatsApp Connected</AlertTitle>
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your WhatsApp Business API is configured and ready to send messages. You can now use WhatsApp for customer communication.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-500/20 bg-amber-500/5">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">⚠️ Configuration Required</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                Configure your WhatsApp Business API credentials below to enable automated messaging features. Valid credentials (API key length &gt; 5 and business number length = 10) will automatically activate the integration.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Manual WhatsApp Message Sending */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Manual WhatsApp Message
          </CardTitle>
          <CardDescription>
            Generate a WhatsApp link to send messages manually without using the Business API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-500/20 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">Quick Manual Sending</AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              This feature allows you to quickly send WhatsApp messages without using the official WhatsApp Business API. 
              Simply select a customer, compose or choose a template message, and click "Send on WhatsApp" to open the message in your WhatsApp app.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-select">Select Customer *</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer-select">
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <SelectItem value="none" disabled>No customers available</SelectItem>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id.toString()} value={customer.id.toString()}>
                        {customer.name} {customer.phone ? `(${customer.phone})` : '(No phone)'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedCustomer && !selectedCustomer.phone && (
                <p className="text-xs text-destructive">This customer has no phone number on file</p>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="template-category">Message Template (Optional)</Label>
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => setSelectedCategory(value as TemplateCategory)}
              >
                <SelectTrigger id="template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="followUp">Follow-up</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {templates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="template-select">Choose Template</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Select a template to use" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id.toString()} value={template.id.toString()}>
                        {template.content.substring(0, 50)}...
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message-text">Message *</Label>
              <Textarea
                id="message-text"
                placeholder="Type your message here or select a template above..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {messageText.length} characters
              </p>
            </div>

            <Button
              onClick={handleSendOnWhatsApp}
              disabled={!canSendManual}
              className="w-full"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              Send on WhatsApp
            </Button>

            {selectedCustomerId && !selectedCustomer?.phone && (
              <p className="text-sm text-center text-muted-foreground">
                Please add a phone number to this customer to send WhatsApp messages
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!isAdmin ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Lock className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Admin Access Required</p>
              <p className="text-sm text-muted-foreground">Only administrators can configure WhatsApp Business API</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configure WhatsApp Business API</CardTitle>
            <CardDescription>Enter your WhatsApp Business API credentials to activate the integration</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your WhatsApp Business API key"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Minimum 6 characters required for activation</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessNumber">Business Phone Number *</Label>
                <Input
                  id="businessNumber"
                  placeholder="1234567890"
                  value={formData.businessNumber}
                  onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                  required
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">Exactly 10 digits required (without country code)</p>
              </div>
              <Button
                type="submit"
                disabled={updateConfig.isPending || !formData.apiKey.trim() || !formData.businessNumber.trim()}
                className="w-full"
              >
                {updateConfig.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Configuration'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>About WhatsApp Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The WhatsApp Business API integration allows you to send automated messages to your customers directly through WhatsApp.
          </p>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Features:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Send automated follow-up reminders</li>
              <li>Notify customers about ticket updates</li>
              <li>Use message templates for quick responses</li>
              <li>Track message delivery status</li>
              <li>Manual message sending without API (available now)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Activation Requirements:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>API Key must be at least 6 characters long</li>
              <li>Business Number must be exactly 10 digits</li>
              <li>Integration activates automatically when valid credentials are saved</li>
            </ul>
          </div>
          <p className="text-xs">
            Note: You need a valid WhatsApp Business API account to use automated features. Manual sending works without API credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
