import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Home, Building2, Palette, LogOut, Moon, Sun, Loader2, CheckCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useCustomerLogout, useGetCustomerProfile } from '../hooks/useCustomerAuth';
import { useSubmitCustomerQuery, useGetCustomerQueries } from '../hooks/useCustomerQueries';
import type { CustomerQueryResponse } from '../backend';
import { toast } from 'sonner';

interface CustomerDashboardProps {
  phoneNumber: string;
}

export default function CustomerDashboard({ phoneNumber }: CustomerDashboardProps) {
  const { theme, setTheme } = useTheme();
  const logout = useCustomerLogout();
  const { data: profile } = useGetCustomerProfile(phoneNumber);
  const { data: queries = [] } = useGetCustomerQueries(phoneNumber);
  const submitQuery = useSubmitCustomerQuery();

  const [activeTab, setActiveTab] = useState('rent');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Rent form state
  const [rentName, setRentName] = useState(profile?.name || '');
  const [rentPhone, setRentPhone] = useState(phoneNumber);
  const [rentEmail, setRentEmail] = useState(profile?.email || '');
  const [rentMessage, setRentMessage] = useState('');

  // Sales form state
  const [salesName, setSalesName] = useState(profile?.name || '');
  const [salesPhone, setSalesPhone] = useState(phoneNumber);
  const [salesEmail, setSalesEmail] = useState(profile?.email || '');
  const [salesMessage, setSalesMessage] = useState('');

  // Interior form state
  const [interiorName, setInteriorName] = useState(profile?.name || '');
  const [interiorPhone, setInteriorPhone] = useState(phoneNumber);
  const [interiorEmail, setInteriorEmail] = useState(profile?.email || '');
  const [interiorMessage, setInteriorMessage] = useState('');

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmitQuery = (queryType: string, name: string, phone: string, email: string, message: string) => {
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const query: CustomerQueryResponse = {
      id: BigInt(0),
      name: name.trim(),
      phoneNumber: phone.trim(),
      email: email.trim() || undefined,
      queryType,
      message: message.trim(),
      submittedAt: BigInt(Date.now() * 1000000),
    };

    submitQuery.mutate(query, {
      onSuccess: () => {
        setShowConfirmation(true);
        // Reset form
        if (queryType === 'Rent') {
          setRentMessage('');
        } else if (queryType === 'Sales') {
          setSalesMessage('');
        } else if (queryType === 'Interior') {
          setInteriorMessage('');
        }
        setTimeout(() => setShowConfirmation(false), 5000);
      },
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">VR Homes Infra</h1>
              <p className="text-xs text-muted-foreground">Customer Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {profile ? getInitials(profile.name) : 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex md:flex-col md:items-start md:text-left">
                    <span className="text-sm font-medium">{profile?.name || 'Customer'}</span>
                    <span className="text-xs text-muted-foreground">{phoneNumber}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.name}</p>
                    <p className="text-xs text-muted-foreground">{phoneNumber}</p>
                    {profile?.email && (
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {showConfirmation && (
            <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
              <CardContent className="flex items-center gap-3 py-4">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Your Query has been submitted, Team will contact you shortly.
                </p>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rent" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Rent
              </TabsTrigger>
              <TabsTrigger value="sales" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Sales
              </TabsTrigger>
              <TabsTrigger value="interior" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Interior
              </TabsTrigger>
            </TabsList>

            {/* Rent Panel */}
            <TabsContent value="rent" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rental Property Inquiry</CardTitle>
                  <CardDescription>
                    Looking for a rental property? Submit your requirements and our team will get back to you.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitQuery('Rent', rentName, rentPhone, rentEmail, rentMessage);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rent-name">Name *</Label>
                        <Input
                          id="rent-name"
                          value={rentName}
                          onChange={(e) => setRentName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rent-phone">Phone Number *</Label>
                        <Input
                          id="rent-phone"
                          value={rentPhone}
                          onChange={(e) => setRentPhone(e.target.value)}
                          required
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rent-email">Email (Optional)</Label>
                      <Input
                        id="rent-email"
                        type="email"
                        value={rentEmail}
                        onChange={(e) => setRentEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rent-message">Your Requirements *</Label>
                      <Textarea
                        id="rent-message"
                        placeholder="Please describe your rental property requirements (location, budget, bedrooms, etc.)"
                        value={rentMessage}
                        onChange={(e) => setRentMessage(e.target.value)}
                        rows={5}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitQuery.isPending}>
                      {submitQuery.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Inquiry'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Query History */}
              {queries.filter((q) => q.queryType === 'Rent').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Rental Inquiries</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {queries
                      .filter((q) => q.queryType === 'Rent')
                      .map((query) => (
                        <div key={query.id.toString()} className="border rounded-lg p-4 space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {new Date(Number(query.submittedAt) / 1000000).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{query.message}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Sales Panel */}
            <TabsContent value="sales" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Purchase Inquiry</CardTitle>
                  <CardDescription>
                    Interested in buying a property? Share your requirements and we'll help you find the perfect match.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitQuery('Sales', salesName, salesPhone, salesEmail, salesMessage);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sales-name">Name *</Label>
                        <Input
                          id="sales-name"
                          value={salesName}
                          onChange={(e) => setSalesName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sales-phone">Phone Number *</Label>
                        <Input
                          id="sales-phone"
                          value={salesPhone}
                          onChange={(e) => setSalesPhone(e.target.value)}
                          required
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sales-email">Email (Optional)</Label>
                      <Input
                        id="sales-email"
                        type="email"
                        value={salesEmail}
                        onChange={(e) => setSalesEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sales-message">Your Requirements *</Label>
                      <Textarea
                        id="sales-message"
                        placeholder="Please describe your property purchase requirements (location, budget, property type, etc.)"
                        value={salesMessage}
                        onChange={(e) => setSalesMessage(e.target.value)}
                        rows={5}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitQuery.isPending}>
                      {submitQuery.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Inquiry'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Query History */}
              {queries.filter((q) => q.queryType === 'Sales').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Purchase Inquiries</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {queries
                      .filter((q) => q.queryType === 'Sales')
                      .map((query) => (
                        <div key={query.id.toString()} className="border rounded-lg p-4 space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {new Date(Number(query.submittedAt) / 1000000).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{query.message}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Interior Panel */}
            <TabsContent value="interior" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interior Design Inquiry</CardTitle>
                  <CardDescription>
                    Need interior design services? Tell us about your project and our designers will reach out to you.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitQuery('Interior', interiorName, interiorPhone, interiorEmail, interiorMessage);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="interior-name">Name *</Label>
                        <Input
                          id="interior-name"
                          value={interiorName}
                          onChange={(e) => setInteriorName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interior-phone">Phone Number *</Label>
                        <Input
                          id="interior-phone"
                          value={interiorPhone}
                          onChange={(e) => setInteriorPhone(e.target.value)}
                          required
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interior-email">Email (Optional)</Label>
                      <Input
                        id="interior-email"
                        type="email"
                        value={interiorEmail}
                        onChange={(e) => setInteriorEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="interior-message">Your Requirements *</Label>
                      <Textarea
                        id="interior-message"
                        placeholder="Please describe your interior design requirements (space type, style preferences, budget, etc.)"
                        value={interiorMessage}
                        onChange={(e) => setInteriorMessage(e.target.value)}
                        rows={5}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitQuery.isPending}>
                      {submitQuery.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Inquiry'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Query History */}
              {queries.filter((q) => q.queryType === 'Interior').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Interior Design Inquiries</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {queries
                      .filter((q) => q.queryType === 'Interior')
                      .map((query) => (
                        <div key={query.id.toString()} className="border rounded-lg p-4 space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {new Date(Number(query.submittedAt) / 1000000).toLocaleDateString()}
                          </p>
                          <p className="text-sm">{query.message}</p>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2025. Built with love using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
