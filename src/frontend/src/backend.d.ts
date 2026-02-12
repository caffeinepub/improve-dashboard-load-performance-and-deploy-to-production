import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AttendanceAgentRecord {
    agentName: string;
    checkInTime: Time;
    checkOutTime?: Time;
    agentMobile: string;
}
export type Time = bigint;
export interface OverviewMetrics {
    recentCustomers: Array<Customer>;
    customerQueryStats: {
        openQueries: bigint;
        totalQueries: bigint;
        inProgressQueries: bigint;
        closedQueries: bigint;
        resolvedQueries: bigint;
    };
    rentQueries: {
        resolved: bigint;
        closed: bigint;
        total: bigint;
        open: bigint;
        inProgress: bigint;
    };
    validCheckIns: bigint;
    totalLeads: bigint;
    todayCheckIns: bigint;
    conversionRate: number;
    recentLeads: Array<Lead>;
    salesQueries: {
        resolved: bigint;
        closed: bigint;
        total: bigint;
        open: bigint;
        inProgress: bigint;
    };
    totalCustomers: bigint;
    interiorQueries: {
        resolved: bigint;
        closed: bigint;
        total: bigint;
        open: bigint;
        inProgress: bigint;
    };
    currentDayCheckIns: bigint;
    agentApprovalMetrics: {
        agentCountPerStatus: {
            pending: bigint;
            approved: bigint;
            rejected: bigint;
        };
        totalAgents: bigint;
        pendingAgents: bigint;
        approvedAgents: bigint;
        rejectedAgents: bigint;
        recentAgentApprovals: Array<AgentInfo>;
    };
    pendingFollowUps: bigint;
    recentFollowUps: Array<FollowUp>;
}
export interface ServiceRecord {
    cost?: bigint;
    date: Time;
    description: string;
}
export interface CsvAttendanceRecord {
    faceVerification: string;
    agentName: string;
    checkInTime: bigint;
    attendanceDate: bigint;
    checkOutTime: bigint;
    agentMobile: string;
    location: string;
}
export interface Lead {
    id: bigint;
    status: LeadStatus;
    assignedAgent?: Principal;
    name: string;
    createdAt: Time;
    email?: string;
    phone?: string;
}
export interface MessageTemplate {
    id: bigint;
    content: string;
    createdAt: Time;
    category: TemplateCategory;
}
export interface PaginatedAttendanceRecords {
    total: bigint;
    records: Array<AttendanceRecord>;
    hasNextPage: boolean;
}
export interface CsvReport {
    agentName: string;
    attendanceRecords: Array<CsvAttendanceRecord>;
    agentMobile: string;
}
export interface AttendanceRecord {
    id: bigint;
    faceVerification: FaceVerificationResult;
    agentName: string;
    agentId: Principal;
    checkInTime: Time;
    checkOutTime?: Time;
    agentMobile: string;
    isValid: boolean;
    location: LocationData;
}
export interface FaceVerificationResult {
    confidenceScore: bigint;
    message: string;
    isSuccess: boolean;
    faceDataHash: string;
}
export interface WhatsAppMessageLog {
    id: bigint;
    messageContent: string;
    sentStatus: boolean;
    leadId?: bigint;
    timestamp: Time;
}
export interface CustomerProfile {
    name: string;
    email?: string;
    phoneNumber: string;
}
export interface CustomerQueryResponse {
    id: bigint;
    queryType: string;
    name: string;
    submittedAt: Time;
    email?: string;
    message: string;
    phoneNumber: string;
}
export interface LocationData {
    latitude: number;
    locationTimestamp: bigint;
    longitude: number;
    accuracy?: number;
}
export interface Customer {
    id: bigint;
    name: string;
    createdAt: Time;
    email?: string;
    address?: string;
    notes?: string;
    phone?: string;
    serviceHistory: Array<ServiceRecord>;
}
export interface PaginatedCustomers {
    total: bigint;
    hasNextPage: boolean;
    customers: Array<Customer>;
}
export interface AgentInfo {
    principal: Principal;
    name: string;
    approvalStatus: string;
    contactNumber: string;
}
export interface WhatsAppConfig {
    isActive: boolean;
    apiKey: string;
    businessNumber: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface CustomerQuery {
    id: bigint;
    customerName: string;
    status: QueryStatus;
    flatType: string;
    rentRange: bigint;
    assignedAgent?: Principal;
    createdAt: Time;
    contactPhone: string;
}
export interface PaginatedLeads {
    total: bigint;
    leads: Array<Lead>;
    hasNextPage: boolean;
}
export interface Message {
    id: bigint;
    content: string;
    recipient: Principal;
    sender: Principal;
    timestamp: Time;
}
export interface FollowUp {
    id: bigint;
    completed: boolean;
    dueDate: Time;
    notes?: string;
    customerId: bigint;
}
export interface AgentPanelData {
    agents: Array<AgentInfo>;
    agentStats: {
        totalAgents: bigint;
        pendingAgents: bigint;
        approvedAgents: bigint;
        approvalRate: number;
        rejectedAgents: bigint;
        rejectionRate: number;
    };
    recentChanges: Array<AgentInfo>;
}
export interface UserProfile {
    name: string;
    role: string;
    email?: string;
    contactNumber?: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum LeadStatus {
    new_ = "new",
    lost = "lost",
    contacted = "contacted",
    converted = "converted",
    qualified = "qualified"
}
export enum QueryStatus {
    resolved = "resolved",
    closed = "closed",
    open = "open",
    inProgress = "inProgress"
}
export enum TemplateCategory {
    support = "support",
    sales = "sales",
    followUp = "followUp",
    general = "general"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCustomer(customer: Customer): Promise<bigint>;
    addCustomerQuery(customerQuery: CustomerQuery): Promise<bigint>;
    addFollowUp(followUp: FollowUp): Promise<bigint>;
    addLead(lead: Lead): Promise<bigint>;
    addTemplate(template: MessageTemplate): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignLead(leadId: bigint, agentId: Principal): Promise<void>;
    changeAgentApprovalStatus(agentPrincipal: Principal, status: ApprovalStatus): Promise<void>;
    deleteLead(id: bigint): Promise<void>;
    deleteTemplate(id: bigint): Promise<void>;
    getAgentCustomerQueries(agentId: Principal): Promise<Array<CustomerQuery>>;
    getAgentPanelData(): Promise<AgentPanelData>;
    getAllAttendanceAgentRecords(): Promise<Array<AttendanceAgentRecord>>;
    getAllAttendanceRecords(pageIndex: bigint | null, pageSize: bigint | null): Promise<PaginatedAttendanceRecords>;
    getAllCustomerQueries(): Promise<Array<CustomerQuery>>;
    getAllCustomers(pageIndex: bigint | null, pageSize: bigint | null): Promise<PaginatedCustomers>;
    getAllFollowUps(): Promise<Array<FollowUp>>;
    getAllLeads(pageIndex: bigint | null, pageSize: bigint | null): Promise<PaginatedLeads>;
    getAllTemplates(): Promise<Array<MessageTemplate>>;
    getAttendanceAgentRecords(agentId: Principal): Promise<Array<AttendanceAgentRecord>>;
    getAttendanceRecords(agentId: Principal): Promise<Array<AttendanceRecord>>;
    getAttendanceRecordsCsvReport(agentId: Principal): Promise<CsvReport>;
    getCRMDashboardData(): Promise<{
        templates: Array<MessageTemplate>;
        customerProfiles: Array<CustomerProfile>;
        messages: Array<Message>;
        leads: Array<Lead>;
        customerQueryResponses: Array<CustomerQueryResponse>;
        customerQueries: Array<CustomerQuery>;
        followUps: Array<FollowUp>;
        customers: Array<Customer>;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomer(id: bigint): Promise<Customer | null>;
    getCustomerDashboardData(phoneNumber: string): Promise<{
        queries: Array<CustomerQueryResponse>;
        confirmationMessage: string;
        profiles: Array<CustomerProfile>;
    }>;
    getCustomerPanels(): Promise<{
        rentPanel: Array<CustomerQuery>;
        salesPanel: Array<CustomerQuery>;
        interiorPanel: Array<CustomerQuery>;
    }>;
    getCustomerProfile(profileId: bigint): Promise<CustomerProfile | null>;
    getCustomerProfileByPhone(phoneNumber: string): Promise<CustomerProfile | null>;
    getCustomerQueriesByPhoneNumber(phoneNumber: string): Promise<Array<CustomerQueryResponse>>;
    getCustomerQuery(id: bigint): Promise<CustomerQuery | null>;
    getFollowUp(id: bigint): Promise<FollowUp | null>;
    getLead(id: bigint): Promise<Lead | null>;
    getMessages(user: Principal): Promise<Array<Message>>;
    getOverviewMetrics(): Promise<OverviewMetrics>;
    getQueryConfirmationMessage(): Promise<string>;
    getTemplate(id: bigint): Promise<MessageTemplate | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWhatsAppConfig(): Promise<WhatsAppConfig | null>;
    getWhatsAppMessageLogs(): Promise<Array<WhatsAppMessageLog>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    logWhatsAppMessage(log: WhatsAppMessageLog): Promise<bigint>;
    recordAttendance(record: AttendanceRecord): Promise<bigint>;
    registerCustomerProfile(profile: CustomerProfile): Promise<bigint>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(recipient: Principal, content: string): Promise<bigint>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setWhatsAppConfig(config: WhatsAppConfig): Promise<void>;
    submitCustomerQueryResponse(response: CustomerQueryResponse): Promise<bigint>;
    updateCustomer(id: bigint, customer: Customer): Promise<void>;
    updateCustomerQuery(id: bigint, customerQuery: CustomerQuery): Promise<void>;
    updateFollowUp(id: bigint, followUp: FollowUp): Promise<void>;
    updateLead(id: bigint, lead: Lead): Promise<void>;
    updateTemplate(id: bigint, template: MessageTemplate): Promise<void>;
}
