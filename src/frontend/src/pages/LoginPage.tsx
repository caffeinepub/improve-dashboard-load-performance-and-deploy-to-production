import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, UserCircle } from 'lucide-react';
import type { UserProfile } from '../backend';

export default function LoginPage() {
  const { login, loginStatus, identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  const [showProfileForm, setShowProfileForm] = useState(false);
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('agent');
  const [errors, setErrors] = useState<{ name?: string; contactNumber?: string }>({});

  const isLoggingIn = loginStatus === 'logging-in';
  const isAuthenticated = !!identity;

  // Check if profile setup is needed after authentication
  useEffect(() => {
    if (isAuthenticated && isFetched && userProfile === null) {
      setShowProfileForm(true);
    }
  }, [isAuthenticated, isFetched, userProfile]);

  const validateForm = () => {
    const newErrors: { name?: string; contactNumber?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(contactNumber.trim())) {
      newErrors.contactNumber = 'Contact number must be exactly 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const profile: UserProfile = {
      name: name.trim(),
      contactNumber: contactNumber.trim(),
      role,
    };

    saveProfile.mutate(profile);
  };

  // Show profile setup form if authenticated but no profile
  if (showProfileForm && isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <UserCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
              <CardDescription className="mt-2">
                Please provide your details to continue
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: undefined });
                  }}
                  autoFocus
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  placeholder="Enter 10-digit contact number"
                  value={contactNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setContactNumber(value);
                    if (errors.contactNumber) setErrors({ ...errors, contactNumber: undefined });
                  }}
                  maxLength={10}
                  className={errors.contactNumber ? 'border-destructive' : ''}
                />
                {errors.contactNumber && (
                  <p className="text-sm text-destructive">{errors.contactNumber}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as 'admin' | 'agent')}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={saveProfile.isPending}
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue to Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while checking profile
  if (isAuthenticated && (profileLoading || !isFetched)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login page
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">VR Homes Infra CRM</CardTitle>
            <CardDescription className="mt-2 text-base">
              Manage your customers, leads, and support tickets all in one place
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>
          <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium text-foreground">Features:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Lead & Customer Management</li>
              <li>• In-App Messaging</li>
              <li>• Follow-up Tracking</li>
              <li>• Helpdesk Ticketing System</li>
              <li>• WhatsApp Integration</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
