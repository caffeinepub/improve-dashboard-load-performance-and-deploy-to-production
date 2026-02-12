import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CustomerProfile } from '../backend';
import { toast } from 'sonner';

const CUSTOMER_AUTH_KEY = 'customer_phone';

export function useCustomerAuth() {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedPhone = localStorage.getItem(CUSTOMER_AUTH_KEY);
      setPhoneNumber(storedPhone);
      setError(null);
    } catch (err) {
      console.error('Error loading customer auth:', err);
      setError('Failed to load authentication state');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (phone: string) => {
    try {
      localStorage.setItem(CUSTOMER_AUTH_KEY, phone);
      setPhoneNumber(phone);
      setError(null);
    } catch (err) {
      console.error('Error saving customer auth:', err);
      setError('Failed to save authentication state');
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(CUSTOMER_AUTH_KEY);
      setPhoneNumber(null);
      setError(null);
    } catch (err) {
      console.error('Error clearing customer auth:', err);
      setError('Failed to clear authentication state');
    }
  };

  return {
    phoneNumber,
    isAuthenticated: !!phoneNumber,
    isLoading,
    error,
    login,
    logout,
  };
}

// Hook for customer login
export function useCustomerLogin() {
  const { actor } = useActor();
  const { login } = useCustomerAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      
      // Check if customer profile exists
      const profile = await actor.getCustomerProfileByPhone(phoneNumber);
      
      if (!profile) {
        throw new Error('Phone number not registered. Please register first.');
      }
      
      return profile;
    },
    onSuccess: (profile) => {
      login(profile.phoneNumber);
      queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
      toast.success('Login successful');
    },
    onError: (error: Error) => {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    },
  });
}

// Hook for customer registration
export function useCustomerRegister() {
  const { actor } = useActor();
  const { login } = useCustomerAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: CustomerProfile) => {
      if (!actor) throw new Error('Actor not available');
      
      // Register the customer profile
      const profileId = await actor.registerCustomerProfile(profile);
      
      return { profileId, profile };
    },
    onSuccess: ({ profile }) => {
      login(profile.phoneNumber);
      queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
      toast.success('Registration successful');
    },
    onError: (error: Error) => {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    },
  });
}

// Hook for customer logout
export function useCustomerLogout() {
  const { logout } = useCustomerAuth();
  const queryClient = useQueryClient();

  return () => {
    logout();
    queryClient.clear();
    toast.success('Logged out successfully');
  };
}

// Hook to get customer profile
export function useGetCustomerProfile(phoneNumber: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CustomerProfile | null>({
    queryKey: ['customerProfile', phoneNumber],
    queryFn: async () => {
      if (!actor || !phoneNumber) return null;
      try {
        return await actor.getCustomerProfileByPhone(phoneNumber);
      } catch (error) {
        console.error('Error fetching customer profile:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!phoneNumber,
  });
}
