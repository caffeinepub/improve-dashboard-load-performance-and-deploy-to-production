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

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
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
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
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
      toast.success('Follow-up updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error completing follow-up:', error);
      toast.error(`Failed to update follow-up: ${error.message}`);
    },
  });
}

// Message Template Queries
export function useGetMessageTemplatesByCategory(category: TemplateCategory) {
  const { data: allTemplates = [], isLoading } = useGetAllTemplates();
  
  return {
    data: allTemplates.filter(template => template.category === category),
    isLoading,
  };
}

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
        return [];
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetDefaultFollowUpTemplate() {
  const { data: templates = [] } = useGetAllTemplates();
  
  // Return the first follow-up template as default (simplified implementation)
  return {
    data: templates.find(t => t.category === TemplateCategory.followUp) || null,
    isLoading: false,
  };
}

export function useSetDefaultFollowUpTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: bigint) => {
      // This is a client-side only operation for now
      return templateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Default template set successfully');
    },
  });
}

export function useSaveMessageTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: MessageTemplate) => {
      if (!actor) throw new Error('Actor not available');
      if (template.id === BigInt(0)) {
        return actor.addTemplate(template);
      } else {
        return actor.updateTemplate(template.id, template);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template saved successfully');
    },
    onError: (error: Error) => {
      console.error('Error saving template:', error);
      toast.error(`Failed to save template: ${error.message}`);
    },
  });
}

// WhatsApp Integration Queries
export function useIsWhatsAppActive() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['whatsAppActive'],
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

export function useUpdateWhatsAppConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: WhatsAppConfig) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setWhatsAppConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsAppActive'] });
      toast.success('WhatsApp configuration updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating WhatsApp config:', error);
      toast.error(`Failed to update WhatsApp config: ${error.message}`);
    },
  });
}

// WhatsApp Message Logs
export function useGetAllWhatsAppMessageLogs() {
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
    refetchInterval: 10000,
  });
}

export function useGetAgentWhatsAppMessageLogs() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<WhatsAppMessageLog[]>({
    queryKey: ['agentWhatsappMessageLogs'],
    queryFn: async () => {
      if (!actor || !identity) return [];
      try {
        const allLogs = await actor.getWhatsAppMessageLogs();
        const allLeads = await actor.getAllLeads(null, null);
        const principal = identity.getPrincipal();
        
        const agentLeadIds = new Set(
          allLeads.leads
            .filter(lead => lead.assignedAgent?.toString() === principal.toString())
            .map(lead => lead.id.toString())
        );
        
        return allLogs.filter(log => 
          log.leadId !== undefined && 
          log.leadId !== null && 
          agentLeadIds.has(log.leadId.toString())
        );
      } catch (error) {
        console.error('Error fetching agent WhatsApp message logs:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    refetchInterval: 10000,
  });
}

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
      queryClient.invalidateQueries({ queryKey: ['agentWhatsappMessageLogs'] });
    },
    onError: (error: Error) => {
      console.error('Error logging WhatsApp message:', error);
    },
  });
}

// Messaging Queries
export function useGetUserMessages(userId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', userId?.toString()],
    queryFn: async () => {
      if (!actor || !userId) return [];
      try {
        return await actor.getMessages(userId);
      } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!userId,
  });
}

export function useGetConversationMessages(userId: Principal | null) {
  return useGetUserMessages(userId);
}

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
      toast.success('Message sent successfully');
    },
    onError: (error: Error) => {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

// Attendance Queries with Pagination
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

export function useGetAttendanceRecords() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['attendanceRecords', 'agent'],
    queryFn: async () => {
      if (!actor || !identity) return [];
      try {
        const principal = identity.getPrincipal();
        return await actor.getAttendanceRecords(principal);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        toast.error('Failed to load attendance records');
        return [];
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
  });
}

export function useGetCallerAttendanceRecords() {
  return useGetAttendanceRecords();
}

export function useGetCallerLatestAttendance() {
  const { data: records = [] } = useGetAttendanceRecords();
  
  return {
    data: records.length > 0 ? records[records.length - 1] : null,
    isLoading: false,
  };
}

export function useMarkAttendance() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ faceVerification, location }: { faceVerification: FaceVerificationResult; location: LocationData }) => {
      if (!actor || !identity) throw new Error('Actor not available');
      
      const profile = await actor.getCallerUserProfile();
      if (!profile) throw new Error('User profile not found');
      
      const principal = identity.getPrincipal();
      const record: AttendanceRecord = {
        id: BigInt(0),
        agentId: principal,
        agentName: profile.name,
        agentMobile: profile.contactNumber || '',
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
      toast.success('Check-in recorded successfully');
    },
    onError: (error: Error) => {
      console.error('Error marking attendance:', error);
      toast.error(`Failed to record check-in: ${error.message}`);
    },
  });
}

export function useMarkCheckOut() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor || !identity) throw new Error('Actor not available');
      
      const principal = identity.getPrincipal();
      const records = await actor.getAttendanceRecords(principal);
      
      const latestRecord = records[records.length - 1];
      if (!latestRecord || latestRecord.checkOutTime) {
        throw new Error('No active check-in found');
      }
      
      const updatedRecord: AttendanceRecord = {
        ...latestRecord,
        checkOutTime: BigInt(Date.now() * 1000000),
      };
      
      return actor.recordAttendance(updatedRecord);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
      queryClient.invalidateQueries({ queryKey: ['overviewMetrics'] });
      toast.success('Check-out recorded successfully');
    },
    onError: (error: Error) => {
      console.error('Error marking check-out:', error);
      toast.error(`Failed to record check-out: ${error.message}`);
    },
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

export function useGetAttendanceRecordsCsvReport(agentId: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CsvReport | null>({
    queryKey: ['attendanceCsvReport', agentId?.toString()],
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
    enabled: !!actor && !actorFetching && !!agentId,
  });
}

export function useDownloadAttendanceReport() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (agentId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAttendanceRecordsCsvReport(agentId);
    },
    onError: (error: Error) => {
      console.error('Error downloading attendance report:', error);
      toast.error(`Failed to download report: ${error.message}`);
    },
  });
}
