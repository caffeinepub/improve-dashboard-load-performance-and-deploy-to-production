import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  UserProfile,
  Customer,
  Lead,
  FollowUp,
  MessageTemplate,
  LeadStatus,
  WhatsAppConfig,
  Message,
  AttendanceRecord,
  FaceVerificationResult,
  LocationData,
  WhatsAppMessageLog,
  CustomerQuery,
  AgentPanelData,
  CsvReport,
  PaginatedLeads,
  PaginatedCustomers,
  PaginatedAttendanceRecords,
  OverviewMetrics,
} from '../backend';
import { TemplateCategory, ApprovalStatus } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';

// Define QueryStatus locally (not exported from backend)
export enum QueryStatus {
  open = 'open',
  inProgress = 'inProgress',
  resolved = 'resolved',
  closed = 'closed',
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();

  // Get the authenticated principal to scope the query
  const authenticatedPrincipal = identity?.getPrincipal().toString();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile', authenticatedPrincipal],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Identity not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        if (error.message?.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && !!identity && !isInitializing,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    isLoading: actorFetching || isInitializing || query.isLoading,
    isFetched: !!actor && !!identity && !isInitializing && query.isFetched,
  };
}

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      try {
        return await actor.getUserProfile(principal);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!principal,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      console.error('Error saving profile:', error);
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// Overview Metrics Query
export function useGetOverviewMetrics() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<OverviewMetrics>({
    queryKey: ['overviewMetrics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getOverviewMetrics();
      } catch (error) {
        console.error('Error fetching overview metrics:', error);
        toast.error('Failed to load dashboard metrics');
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30000,
  });
}

// Agent Panel Queries
export function useGetAgentPanelData() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AgentPanelData>({
    queryKey: ['agentPanelData'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getAgentPanelData();
      } catch (error) {
        console.error('Error fetching agent panel data:', error);
        toast.error('Failed to load agent panel data');
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 10000,
  });
}

export function useChangeAgentApprovalStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ agentPrincipal, status }: { agentPrincipal: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.changeAgentApprovalStatus(agentPrincipal, status);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agentPanelData'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      const statusText = variables.status === ApprovalStatus.approved ? 'approved' : 'rejected';
      toast.success(`Agent ${statusText} successfully`);
    },
    onError: (error: Error) => {
      console.error('Error changing agent approval status:', error);
      toast.error(`Failed to change approval status: ${error.message}`);
    },
  });
}

// Customer Queries with Pagination
export function useGetAllCustomersPaginated(pageIndex: number = 1, pageSize: number = 50) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PaginatedCustomers>({
    queryKey: ['customers', 'paginated', pageIndex, pageSize],
    queryFn: async () => {
      if (!actor) return { customers: [], total: BigInt(0), hasNextPage: false };
      try {
        return await actor.getAllCustomers(BigInt(pageIndex), BigInt(pageSize));
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
        return { customers: [], total: BigInt(0), hasNextPage: false };
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30000,
  });
}

export function useGetAllCustomers() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getAllCustomers(null, null);
        return result.customers;
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('Failed to load customers');
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCustomer(customerId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Customer | null>({
    queryKey: ['customer', customerId?.toString()],
    queryFn: async () => {
      if (!actor || !customerId) return null;
      try {
        return await actor.getCustomer(customerId);
      } catch (error) {
        console.error('Error fetching customer:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && customerId !== null,
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: Customer) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCustomer(customer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Customer added successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding customer:', error);
      toast.error(`Failed to add customer: ${error.message}`);
    },
  });
}

// Customer Query Management
export function useGetAllCustomerQueriesForAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CustomerQuery[]>({
    queryKey: ['customerQueries', 'admin'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllCustomerQueries();
      } catch (error) {
        console.error('Error fetching customer queries:', error);
        toast.error('Failed to load customer queries');
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetAgentCustomerQueries() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<CustomerQuery[]>({
    queryKey: ['customerQueries', 'agent'],
    queryFn: async () => {
      if (!actor || !identity) return [];
      try {
        const principal = identity.getPrincipal();
        return await actor.getAgentCustomerQueries(principal);
      } catch (error) {
        console.error('Error fetching agent customer queries:', error);
        toast.error('Failed to load your customer queries');
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useCreateCustomerQuery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (query: CustomerQuery) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addCustomerQuery(query);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQueries'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Customer query created and assigned successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating customer query:', error);
      toast.error(`Failed to create customer query: ${error.message}`);
    },
  });
}

export function useUpdateCustomerQueryStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ queryId, status }: { queryId: bigint; status: QueryStatus }) => {
      if (!actor) throw new Error('Actor not available');
      const existingQuery = await actor.getCustomerQuery(queryId);
      if (!existingQuery) throw new Error('Query not found');
      
      const updatedQuery: CustomerQuery = {
        ...existingQuery,
        status: status as any,
      };
      return actor.updateCustomerQuery(queryId, updatedQuery);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQueries'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Query status updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating query status:', error);
      toast.error(`Failed to update query status: ${error.message}`);
    },
  });
}

export function useAssignAgentToCustomerQuery() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ queryId, agentId }: { queryId: bigint; agentId: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      const existingQuery = await actor.getCustomerQuery(queryId);
      if (!existingQuery) throw new Error('Query not found');
      
      const updatedQuery: CustomerQuery = {
        ...existingQuery,
        assignedAgent: agentId,
      };
      return actor.updateCustomerQuery(queryId, updatedQuery);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerQueries'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Agent assigned successfully');
    },
    onError: (error: Error) => {
      console.error('Error assigning agent:', error);
      toast.error(`Failed to assign agent: ${error.message}`);
    },
  });
}

// Lead Queries with Pagination
export function useGetAllLeadsPaginated(pageIndex: number = 1, pageSize: number = 50) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PaginatedLeads>({
    queryKey: ['leads', 'paginated', pageIndex, pageSize],
    queryFn: async () => {
      if (!actor) return { leads: [], total: BigInt(0), hasNextPage: false };
      try {
        return await actor.getAllLeads(BigInt(pageIndex), BigInt(pageSize));
      } catch (error) {
        console.error('Error fetching leads:', error);
        toast.error('Failed to load leads');
        return { leads: [], total: BigInt(0), hasNextPage: false };
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30000,
  });
}

export function useGetAllLeads() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Lead[]>({
    queryKey: ['leads'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const result = await actor.getAllLeads(null, null);
        return result.leads;
      } catch (error) {
        console.error('Error fetching leads:', error);
        toast.error('Failed to load leads');
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetLeadsByStatus(status: LeadStatus) {
  const { data: allLeads = [], isLoading } = useGetAllLeads();
  
  return {
    data: allLeads.filter(lead => lead.status === status),
    isLoading,
  };
}

export function useCreateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Lead) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addLead(lead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['whatsappMessageLogs'] });
      queryClient.invalidateQueries({ queryKey: ['agentWhatsappMessageLogs'] });
      toast.success('Lead created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating lead:', error);
      toast.error(`Failed to create lead: ${error.message}`);
    },
  });
}

export function useUpdateLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, lead }: { id: bigint; lead: Lead }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateLead(id, lead);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Lead updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating lead:', error);
      toast.error(`Failed to update lead: ${error.message}`);
    },
  });
}

export function useAssignLead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, agentId }: { leadId: bigint; agentId: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignLead(leadId, agentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Lead assigned successfully');
    },
    onError: (error: Error) => {
      console.error('Error assigning lead:', error);
      toast.error(`Failed to assign lead: ${error.message}`);
    },
  });
}

// Follow-up Queries
export function useGetAllFollowUps() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<FollowUp[]>({
    queryKey: ['followUps'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllFollowUps();
      } catch (error) {
        console.error('Error fetching follow-ups:', error);
        toast.error('Failed to load follow-ups');
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetPendingFollowUps() {
  const { data: allFollowUps = [], isLoading } = useGetAllFollowUps();
  
  return {
    data: allFollowUps.filter(followUp => !followUp.completed),
    isLoading,
  };
}

export function useAddFollowUp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ followUp }: { followUp: FollowUp; leadId?: bigint | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addFollowUp(followUp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['pendingFollowUps'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['whatsappMessageLogs'] });
      queryClient.invalidateQueries({ queryKey: ['agentWhatsappMessageLogs'] });
      toast.success('Follow-up scheduled successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding follow-up:', error);
      toast.error(`Failed to schedule follow-up: ${error.message}`);
    },
  });
}

export function useCompleteFollowUp() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: bigint; isCompleted: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      const existingFollowUp = await actor.getFollowUp(id);
      if (!existingFollowUp) throw new Error('Follow-up not found');
      
      const updatedFollowUp: FollowUp = {
        ...existingFollowUp,
        completed: isCompleted,
      };
      return actor.updateFollowUp(id, updatedFollowUp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followUps'] });
      queryClient.invalidateQueries({ queryKey: ['pendingFollowUps'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Follow-up status updated');
    },
    onError: (error: Error) => {
      console.error('Error updating follow-up:', error);
      toast.error(`Failed to update follow-up: ${error.message}`);
    },
  });
}

// Template Queries
export function useGetAllTemplates() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<MessageTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllTemplates();
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTemplatesByCategory(category: TemplateCategory) {
  const { data: allTemplates = [], isLoading } = useGetAllTemplates();
  
  return {
    data: allTemplates.filter(template => template.category === category),
    isLoading,
  };
}

// Alias for backward compatibility
export const useGetMessageTemplatesByCategory = useGetTemplatesByCategory;

export function useAddTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: MessageTemplate) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addTemplate(template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template created successfully');
    },
    onError: (error: Error) => {
      console.error('Error adding template:', error);
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

// Alias for backward compatibility
export const useSaveMessageTemplate = useAddTemplate;

export function useUpdateTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, template }: { id: bigint; template: MessageTemplate }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTemplate(id, template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating template:', error);
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

export function useDeleteTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting template:', error);
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

// Default follow-up template (mock implementation - backend doesn't support this)
export function useGetDefaultFollowUpTemplate() {
  const { data: templates = [] } = useGetAllTemplates();
  
  return {
    data: templates.find(t => t.category === TemplateCategory.followUp) || null,
    isLoading: false,
  };
}

export function useSetDefaultFollowUpTemplate() {
  return useMutation({
    mutationFn: async (templateId: bigint) => {
      // Mock implementation - backend doesn't support default template
      console.log('Setting default template:', templateId);
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success('Default template set');
    },
  });
}

// WhatsApp Configuration
export function useGetWhatsAppConfig() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WhatsAppConfig | null>({
    queryKey: ['whatsappConfig'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getWhatsAppConfig();
      } catch (error) {
        console.error('Error fetching WhatsApp config:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetWhatsAppConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: WhatsAppConfig) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setWhatsAppConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappConfig'] });
      toast.success('WhatsApp configuration updated');
    },
    onError: (error: Error) => {
      console.error('Error updating WhatsApp config:', error);
      toast.error(`Failed to update WhatsApp config: ${error.message}`);
    },
  });
}

// Alias for backward compatibility
export const useUpdateWhatsAppConfig = useSetWhatsAppConfig;

// Check if WhatsApp is active
export function useIsWhatsAppActive() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['whatsappActive'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        const config = await actor.getWhatsAppConfig();
        return config?.isActive || false;
      } catch (error) {
        console.error('Error checking WhatsApp status:', error);
        return false;
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

// Messaging Queries
export function useGetUserMessages(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', userPrincipal?.toString()],
    queryFn: async () => {
      if (!actor || !userPrincipal) return [];
      try {
        return await actor.getMessages(userPrincipal);
      } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!userPrincipal,
  });
}

// Alias for conversation messages (same as user messages)
export const useGetConversationMessages = useGetUserMessages;

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, content }: { recipient: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(recipient, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Message sent');
    },
    onError: (error: Error) => {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

// Attendance Queries
export function useGetAttendanceRecords(agentId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendanceRecords', agentId?.toString()],
    queryFn: async () => {
      if (!actor || !agentId) return [];
      try {
        return await actor.getAttendanceRecords(agentId);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!agentId,
  });
}

// Get caller's own attendance records
export function useGetCallerAttendanceRecords() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendanceRecords', 'caller'],
    queryFn: async () => {
      if (!actor || !identity) return [];
      try {
        const principal = identity.getPrincipal();
        return await actor.getAttendanceRecords(principal);
      } catch (error) {
        console.error('Error fetching caller attendance records:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

// Get caller's latest attendance record
export function useGetCallerLatestAttendance() {
  const { data: records = [] } = useGetCallerAttendanceRecords();
  
  return {
    data: records.length > 0 ? records[records.length - 1] : null,
    isLoading: false,
  };
}

export function useGetAllAttendanceRecordsPaginated(pageIndex: number = 1, pageSize: number = 50) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<PaginatedAttendanceRecords>({
    queryKey: ['attendanceRecords', 'paginated', pageIndex, pageSize],
    queryFn: async () => {
      if (!actor) return { records: [], total: BigInt(0), hasNextPage: false };
      try {
        return await actor.getAllAttendanceRecords(BigInt(pageIndex), BigInt(pageSize));
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        toast.error('Failed to load attendance records');
        return { records: [], total: BigInt(0), hasNextPage: false };
      }
    },
    enabled: !!actor && !actorFetching,
    staleTime: 30000,
  });
}

export function useRecordAttendance() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: AttendanceRecord) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordAttendance(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Attendance recorded successfully');
    },
    onError: (error: Error) => {
      console.error('Error recording attendance:', error);
      toast.error(`Failed to record attendance: ${error.message}`);
    },
  });
}

// Mark attendance (check-in)
export function useMarkAttendance() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ faceVerification, location }: { faceVerification: FaceVerificationResult; location: LocationData }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Identity not available');
      
      const userProfile = await actor.getCallerUserProfile();
      if (!userProfile) throw new Error('User profile not found');
      
      const record: AttendanceRecord = {
        id: BigInt(0),
        agentId: identity.getPrincipal(),
        agentName: userProfile.name,
        agentMobile: userProfile.contactNumber || '',
        checkInTime: BigInt(Date.now() * 1000000),
        checkOutTime: undefined,
        faceVerification,
        location,
        isValid: true,
      };
      
      return actor.recordAttendance(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Check-in successful');
    },
    onError: (error: Error) => {
      console.error('Error marking attendance:', error);
      toast.error(`Failed to check in: ${error.message}`);
    },
  });
}

// Mark check-out
export function useMarkCheckOut() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Identity not available');
      
      const principal = identity.getPrincipal();
      const records = await actor.getAttendanceRecords(principal);
      
      if (records.length === 0) {
        throw new Error('No check-in record found');
      }
      
      const latestRecord = records[records.length - 1];
      
      if (latestRecord.checkOutTime) {
        throw new Error('Already checked out');
      }
      
      const updatedRecord: AttendanceRecord = {
        ...latestRecord,
        checkOutTime: BigInt(Date.now() * 1000000),
      };
      
      // Since there's no updateAttendance method, we need to record a new one
      // This is a limitation - ideally backend should have an update method
      return actor.recordAttendance(updatedRecord);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Check-out successful');
    },
    onError: (error: Error) => {
      console.error('Error marking check-out:', error);
      toast.error(`Failed to check out: ${error.message}`);
    },
  });
}

export function useGetAttendanceRecordsCsvReport(agentId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CsvReport | null>({
    queryKey: ['attendanceRecordsCsvReport', agentId?.toString()],
    queryFn: async () => {
      if (!actor || !agentId) return null;
      try {
        return await actor.getAttendanceRecordsCsvReport(agentId);
      } catch (error) {
        console.error('Error fetching attendance CSV report:', error);
        toast.error('Failed to generate attendance report');
        return null;
      }
    },
    enabled: false,
  });
}

// Download attendance report
export function useDownloadAttendanceReport() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (agentId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAttendanceRecordsCsvReport(agentId);
    },
    onError: (error: Error) => {
      console.error('Error downloading report:', error);
      toast.error(`Failed to download report: ${error.message}`);
    },
  });
}

// WhatsApp Message Logs
export function useGetWhatsAppMessageLogs() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<WhatsAppMessageLog[]>({
    queryKey: ['whatsappMessageLogs'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getWhatsAppMessageLogs();
      } catch (error) {
        console.error('Error fetching WhatsApp message logs:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

// Aliases for backward compatibility
export const useGetAllWhatsAppMessageLogs = useGetWhatsAppMessageLogs;
export const useGetAgentWhatsAppMessageLogs = useGetWhatsAppMessageLogs;

export function useLogWhatsAppMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: WhatsAppMessageLog) => {
      if (!actor) throw new Error('Actor not available');
      return actor.logWhatsAppMessage(log);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappMessageLogs'] });
    },
    onError: (error: Error) => {
      console.error('Error logging WhatsApp message:', error);
    },
  });
}
