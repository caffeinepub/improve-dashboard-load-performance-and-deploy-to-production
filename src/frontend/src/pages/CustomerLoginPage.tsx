import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Home, LogIn, UserPlus } from 'lucide-react';
import { useCustomerLogin, useCustomerRegister } from '../hooks/useCustomerAuth';
import type { CustomerProfile } from '../backend';

export default function CustomerLoginPage() {
  const loginMutation = useCustomerLogin();
  const registerMutation = useCustomerRegister();

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ phone?: string }>({});

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerErrors, setRegisterErrors] = useState<{ name?: string; phone?: string; email?: string }>({});

  const validateLoginForm = () => {
    const errors: { phone?: string } = {};

    if (!loginPhone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(loginPhone.trim())) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegisterForm = () => {
    const errors: { name?: string; phone?: string; email?: string } = {};

    if (!registerName.trim()) {
      errors.name = 'Name is required';
    }

    if (!registerPhone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(registerPhone.trim())) {
      errors.phone = 'Phone number must be exactly 10 digits';
    }

    if (registerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.trim())) {
      errors.email = 'Invalid email format';
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    loginMutation.mutate(loginPhone.trim());
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    const profile: CustomerProfile = {
      name: registerName.trim(),
      phoneNumber: registerPhone.trim(),
      email: registerEmail.trim() || undefined,
    };

    registerMutation.mutate(profile);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">VR Homes Infra</CardTitle>
            <CardDescription className="mt-2 text-base">
              Customer Portal - Find Your Dream Property
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-phone">Phone Number *</Label>
                  <Input
                    id="login-phone"
                    placeholder="Enter your 10-digit phone number"
                    value={loginPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setLoginPhone(value);
                      if (loginErrors.phone) setLoginErrors({ ...loginErrors, phone: undefined });
                    }}
                    maxLength={10}
                    className={loginErrors.phone ? 'border-destructive' : ''}
                  />
                  {loginErrors.phone && (
                    <p className="text-sm text-destructive">{loginErrors.phone}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Login
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Name *</Label>
                  <Input
                    id="register-name"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => {
                      setRegisterName(e.target.value);
                      if (registerErrors.name) setRegisterErrors({ ...registerErrors, name: undefined });
                    }}
                    className={registerErrors.name ? 'border-destructive' : ''}
                  />
                  {registerErrors.name && (
                    <p className="text-sm text-destructive">{registerErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-phone">Phone Number *</Label>
                  <Input
                    id="register-phone"
                    placeholder="Enter your 10-digit phone number"
                    value={registerPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setRegisterPhone(value);
                      if (registerErrors.phone) setRegisterErrors({ ...registerErrors, phone: undefined });
                    }}
                    maxLength={10}
                    className={registerErrors.phone ? 'border-destructive' : ''}
                  />
                  {registerErrors.phone && (
                    <p className="text-sm text-destructive">{registerErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">Email (Optional)</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      if (registerErrors.email) setRegisterErrors({ ...registerErrors, email: undefined });
                    }}
                    className={registerErrors.email ? 'border-destructive' : ''}
                  />
                  {registerErrors.email && (
                    <p className="text-sm text-destructive">{registerErrors.email}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-5 w-5" />
                      Register
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium text-foreground">Services Available:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Rental Properties</li>
              <li>• Property Sales</li>
              <li>• Interior Design Services</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
