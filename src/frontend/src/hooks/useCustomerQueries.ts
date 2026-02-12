import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { CustomerQueryResponse } from '../backend';
import { toast } from 'sonner';

export function useSubmitCustomerQuery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (query: CustomerQueryResponse) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitCustomerQueryResponse(query);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQueries'] });
      toast.success('Query submitted successfully');
    },
    onError: (error: Error) => {
      console.error('Error submitting query:', error);
      toast.error(`Failed to submit query: ${error.message}`);
    },
  });
}

export function useGetCustomerQueries(phoneNumber: string | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CustomerQueryResponse[]>({
    queryKey: ['customerQueries', phoneNumber],
    queryFn: async () => {
      if (!actor || !phoneNumber) return [];
      try {
        return await actor.getCustomerQueriesByPhoneNumber(phoneNumber);
      } catch (error) {
        console.error('Error fetching customer queries:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!phoneNumber,
  });
}

export function useGetConfirmationMessage() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string>({
    queryKey: ['confirmationMessage'],
    queryFn: async () => {
      if (!actor) return '';
      try {
        return await actor.getQueryConfirmationMessage();
      } catch (error) {
        console.error('Error fetching confirmation message:', error);
        return 'Your Query has been submitted, Team will contact you shortly.';
      }
    },
    enabled: !!actor && !actorFetching,
  });
}
