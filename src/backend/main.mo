import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import UserApproval "user-approval/approval";

actor {
  include MixinStorage();

  public type TemplateCategory = {
    #followUp;
    #support;
    #sales;
    #general;
  };

  public type Lead = {
    id : Nat;
    name : Text;
    email : ?Text;
    phone : ?Text;
    status : LeadStatus;
    assignedAgent : ?Principal;
    createdAt : Time.Time;
  };

  public type LeadStatus = {
    #new;
    #contacted;
    #qualified;
    #converted;
    #lost;
  };

  public type PaginatedLeads = {
    leads : [Lead];
    total : Nat;
    hasNextPage : Bool;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    email : ?Text;
    phone : ?Text;
    address : ?Text;
    notes : ?Text;
    serviceHistory : [ServiceRecord];
    createdAt : Time.Time;
  };

  public type ServiceRecord = {
    date : Time.Time;
    description : Text;
    cost : ?Nat;
  };

  public type PaginatedCustomers = {
    customers : [Customer];
    total : Nat;
    hasNextPage : Bool;
  };

  public type FollowUp = {
    id : Nat;
    customerId : Nat;
    dueDate : Time.Time;
    completed : Bool;
    notes : ?Text;
  };

  public type MessageTemplate = {
    id : Nat;
    category : TemplateCategory;
    content : Text;
    createdAt : Time.Time;
  };

  public type WhatsAppConfig = {
    apiKey : Text;
    businessNumber : Text;
    isActive : Bool;
  };

  public type UserProfile = {
    name : Text;
    email : ?Text;
    contactNumber : ?Text;
    role : Text;
  };

  public type Message = {
    id : Nat;
    sender : Principal;
    recipient : Principal;
    timestamp : Time.Time;
    content : Text;
  };

  public type FaceVerificationResult = {
    isSuccess : Bool;
    confidenceScore : Nat;
    message : Text;
    faceDataHash : Text;
  };

  public type LocationData = {
    latitude : Float;
    longitude : Float;
    accuracy : ?Float;
    locationTimestamp : Nat;
  };

  public type AttendanceRecord = {
    id : Nat;
    agentId : Principal;
    agentName : Text;
    agentMobile : Text;
    checkInTime : Time.Time;
    checkOutTime : ?Time.Time;
    faceVerification : FaceVerificationResult;
    location : LocationData;
    isValid : Bool;
  };

  public type AttendanceAgentRecord = {
    agentName : Text;
    agentMobile : Text;
    checkInTime : Time.Time;
    checkOutTime : ?Time.Time;
  };

  public type WeeklyAttendanceSummary = {
    weekStartDate : Time.Time;
    weekEndDate : Time.Time;
    totalCheckIns : Nat;
    validCheckIns : Nat;
    invalidCheckIns : Nat;
    totalHours : Nat;
    faceVerificationSuccessRate : Float;
    locationAccuracyRate : Float;
  };

  public type WhatsAppMessageLog = {
    id : Nat;
    leadId : ?Nat;
    messageContent : Text;
    timestamp : Time.Time;
    sentStatus : Bool;
  };

  public type CustomerQuery = {
    id : Nat;
    customerName : Text;
    flatType : Text;
    rentRange : Nat;
    contactPhone : Text;
    assignedAgent : ?Principal;
    status : QueryStatus;
    createdAt : Time.Time;
  };

  public type QueryStatus = {
    #open;
    #inProgress;
    #resolved;
    #closed;
  };

  public type PaginatedAttendanceRecords = {
    records : [AttendanceRecord];
    total : Nat;
    hasNextPage : Bool;
  };

  public type CustomerProfile = {
    name : Text;
    phoneNumber : Text;
    email : ?Text;
  };

  public type CustomerQueryResponse = {
    id : Nat;
    name : Text;
    phoneNumber : Text;
    email : ?Text;
    queryType : Text;
    message : Text;
    submittedAt : Time.Time;
  };

  public type AgentInfo = {
    principal : Principal;
    name : Text;
    contactNumber : Text;
    approvalStatus : Text;
  };

  public type OverviewMetrics = {
    totalLeads : Nat;
    totalCustomers : Nat;
    pendingFollowUps : Nat;
    conversionRate : Float;
    validCheckIns : Nat;
    todayCheckIns : Nat;
    currentDayCheckIns : Nat;
    customerQueryStats : {
      totalQueries : Nat;
      openQueries : Nat;
      resolvedQueries : Nat;
      inProgressQueries : Nat;
      closedQueries : Nat;
    };
    agentApprovalMetrics : {
      totalAgents : Nat;
      approvedAgents : Nat;
      pendingAgents : Nat;
      rejectedAgents : Nat;
      agentCountPerStatus : {
        approved : Nat;
        pending : Nat;
        rejected : Nat;
      };
      recentAgentApprovals : [AgentInfo];
    };
    rentQueries : {
      total : Nat;
      open : Nat;
      inProgress : Nat;
      resolved : Nat;
      closed : Nat;
    };
    salesQueries : {
      total : Nat;
      open : Nat;
      inProgress : Nat;
      resolved : Nat;
      closed : Nat;
    };
    interiorQueries : {
      total : Nat;
      open : Nat;
      inProgress : Nat;
      resolved : Nat;
      closed : Nat;
    };
    recentLeads : [Lead];
    recentCustomers : [Customer];
    recentFollowUps : [FollowUp];
  };

  public type AgentPanelData = {
    agents : [AgentInfo];
    agentStats : {
      totalAgents : Nat;
      approvedAgents : Nat;
      pendingAgents : Nat;
      rejectedAgents : Nat;
      approvalRate : Float;
      rejectionRate : Float;
    };
    recentChanges : [AgentInfo];
  };

  public type CsvAttendanceRecord = {
    agentName : Text;
    agentMobile : Text;
    checkInTime : Int;
    checkOutTime : Int;
    attendanceDate : Int;
    location : Text;
    faceVerification : Text;
  };

  public type CsvReport = {
    agentName : Text;
    agentMobile : Text;
    attendanceRecords : [CsvAttendanceRecord];
  };

  var attendanceIdCounter = 0;
  let attendanceRecords = Map.empty<Nat, AttendanceRecord>();

  var leadIdCounter = 0;
  var customerIdCounter = 0;
  var followUpIdCounter = 0;
  var templateIdCounter = 0;
  var messageIdCounter = 0;
  var whatsappMessageLogCounter = 0;
  var customerQueryIdCounter = 0;
  var customerProfileIdCounter = 0;
  var customerQueryResponseIdCounter = 0;

  let leads = Map.empty<Nat, Lead>();
  let customers = Map.empty<Nat, Customer>();
  let followUps = Map.empty<Nat, FollowUp>();
  let templates = Map.empty<Nat, MessageTemplate>();
  let messages = Map.empty<Nat, Message>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let whatsappMessageLogs = Map.empty<Nat, WhatsAppMessageLog>();
  let customerQueries = Map.empty<Nat, CustomerQuery>();
  let customerProfiles = Map.empty<Nat, CustomerProfile>();
  let customerQueryResponses = Map.empty<Nat, CustomerQueryResponse>();
  let customerPhoneRegistry = Map.empty<Text, Nat>();
  let customerPrincipalToPhone = Map.empty<Principal, Text>();

  var whatsAppConfig : ?WhatsAppConfig = null;
  var defaultFollowUpTemplate : ?MessageTemplate = null;
  var currentAgentIndex = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  let approvalState = UserApproval.initState(accessControlState);

  let DESIGNATED_ADMIN_NAME = "Vipin Maurya";
  let DESIGNATED_ADMIN_CONTACT = "7217637770";
  let defaultPageSize = 100;

  func isDesignatedAdmin(profile : UserProfile) : Bool {
    profile.name == DESIGNATED_ADMIN_NAME and
    (switch (profile.contactNumber) {
      case (?contact) { contact == DESIGNATED_ADMIN_CONTACT };
      case (null) { false };
    })
  };

  func isApprovedAgent(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        profile.role == "agent" and UserApproval.isApproved(approvalState, caller)
      };
      case (null) { false };
    };
  };

  func isCustomerAuthenticated(caller : Principal, phoneNumber : Text) : Bool {
    switch (customerPrincipalToPhone.get(caller)) {
      case (?registeredPhone) { registeredPhone == phoneNumber };
      case (null) { false };
    };
  };

  func requireApprovedAgentOrAdmin(caller : Principal) {
    if (not (AccessControl.isAdmin(accessControlState, caller) or isApprovedAgent(caller))) {
      Runtime.trap("Unauthorized: Only approved agents and admins can perform this action");
    };
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set approval status");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list approvals");
    };
    UserApproval.listApprovals(approvalState);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or admin access required");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };

    if (isDesignatedAdmin(profile)) {
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
    };

    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func registerCustomerProfile(profile : CustomerProfile) : async Nat {
    switch (customerPhoneRegistry.get(profile.phoneNumber)) {
      case (?existingId) {
        Runtime.trap("Phone number already registered");
      };
      case (null) {
        let newId = customerProfileIdCounter;
        customerProfiles.add(newId, profile);
        customerPhoneRegistry.add(profile.phoneNumber, newId);
        customerPrincipalToPhone.add(caller, profile.phoneNumber);
        customerProfileIdCounter += 1;
        newId;
      };
    };
  };

  public query ({ caller }) func getCustomerProfile(profileId : Nat) : async ?CustomerProfile {
    switch (customerProfiles.get(profileId)) {
      case (?profile) {
        // Admin or approved agent can view any profile
        if (AccessControl.isAdmin(accessControlState, caller) or isApprovedAgent(caller)) {
          return ?profile;
        };
        // Customer can only view their own profile
        if (not isCustomerAuthenticated(caller, profile.phoneNumber)) {
          Runtime.trap("Unauthorized: Can only view your own profile");
        };
        ?profile;
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getCustomerProfileByPhone(phoneNumber : Text) : async ?CustomerProfile {
    // Admin or approved agent can view any profile
    if (not (AccessControl.isAdmin(accessControlState, caller) or isApprovedAgent(caller))) {
      // Customer can only view their own profile
      if (not isCustomerAuthenticated(caller, phoneNumber)) {
        Runtime.trap("Unauthorized: Can only view your own profile");
      };
    };

    switch (customerPhoneRegistry.get(phoneNumber)) {
      case (?profileId) { customerProfiles.get(profileId) };
      case (null) { null };
    };
  };

  public shared ({ caller }) func submitCustomerQueryResponse(response : CustomerQueryResponse) : async Nat {
    if (not isCustomerAuthenticated(caller, response.phoneNumber)) {
      Runtime.trap("Unauthorized: Can only submit queries for your own phone number");
    };

    let newId = customerQueryResponseIdCounter;
    customerQueryResponses.add(newId, response);
    customerQueryResponseIdCounter += 1;
    newId;
  };

  public query ({ caller }) func getCustomerQueriesByPhoneNumber(phoneNumber : Text) : async [CustomerQueryResponse] {
    // Admin or approved agent can view any queries
    if (not (AccessControl.isAdmin(accessControlState, caller) or isApprovedAgent(caller))) {
      // Customer can only view their own queries
      if (not isCustomerAuthenticated(caller, phoneNumber)) {
        Runtime.trap("Unauthorized: Can only view your own queries");
      };
    };

    customerQueryResponses.values().toArray().filter(
      func(r) { r.phoneNumber == phoneNumber }
    );
  };

  public query func getQueryConfirmationMessage() : async Text {
    "Your Query has been submitted, Team will contact you shortly.";
  };

  public query ({ caller }) func getCustomerDashboardData(phoneNumber : Text) : async {
    profiles : [CustomerProfile];
    queries : [CustomerQueryResponse];
    confirmationMessage : Text;
  } {
    if (not isCustomerAuthenticated(caller, phoneNumber)) {
      Runtime.trap("Unauthorized: Can only view your own dashboard");
    };

    let profiles = customerProfiles.values().toArray().filter(
      func(p) { p.phoneNumber == phoneNumber }
    );

    let queries = customerQueryResponses.values().toArray().filter(
      func(q) { q.phoneNumber == phoneNumber }
    );

    {
      profiles;
      queries;
      confirmationMessage = "Your Query has been submitted, Team will contact you shortly.";
    };
  };

  public query ({ caller }) func getCRMDashboardData() : async {
    leads : [Lead];
    customers : [Customer];
    followUps : [FollowUp];
    templates : [MessageTemplate];
    messages : [Message];
    customerQueries : [CustomerQuery];
    customerProfiles : [CustomerProfile];
    customerQueryResponses : [CustomerQueryResponse];
  } {
    requireApprovedAgentOrAdmin(caller);

    {
      leads = leads.values().toArray();
      customers = customers.values().toArray();
      followUps = followUps.values().toArray();
      templates = templates.values().toArray();
      messages = messages.values().toArray();
      customerQueries = customerQueries.values().toArray();
      customerProfiles = customerProfiles.values().toArray();
      customerQueryResponses = customerQueryResponses.values().toArray();
    };
  };

  public query ({ caller }) func getCustomerPanels() : async {
    rentPanel : [CustomerQuery];
    salesPanel : [CustomerQuery];
    interiorPanel : [CustomerQuery];
  } {
    requireApprovedAgentOrAdmin(caller);

    let rentPanel = customerQueries.values().toArray().filter(
      func(q) { q.flatType == "Rent" }
    );

    let salesPanel = customerQueries.values().toArray().filter(
      func(q) { q.flatType == "Sales" }
    );

    let interiorPanel = customerQueries.values().toArray().filter(
      func(q) { q.flatType == "Interior" }
    );

    {
      rentPanel;
      salesPanel;
      interiorPanel;
    };
  };

  public shared ({ caller }) func addLead(lead : Lead) : async Nat {
    requireApprovedAgentOrAdmin(caller);

    let newId = leadIdCounter;
    leads.add(newId, lead);
    leadIdCounter += 1;
    newId;
  };

  public shared ({ caller }) func updateLead(id : Nat, lead : Lead) : async () {
    requireApprovedAgentOrAdmin(caller);

    leads.add(id, lead);
  };

  public shared ({ caller }) func assignLead(leadId : Nat, agentId : Principal) : async () {
    // Only admins and approved agents can assign leads
    requireApprovedAgentOrAdmin(caller);

    switch (leads.get(leadId)) {
      case (?existingLead) {
        // Verify the target agent is approved
        if (not isApprovedAgent(agentId)) {
          Runtime.trap("Unauthorized: Can only assign leads to approved agents");
        };

        // Admins can assign to any approved agent
        if (AccessControl.isAdmin(accessControlState, caller)) {
          let updatedLead = {
            existingLead with
            assignedAgent = ?agentId;
          };
          leads.add(leadId, updatedLead);
        } else {
          // Approved agents can only assign leads to themselves
          if (caller != agentId) {
            Runtime.trap("Unauthorized: Agents can only assign leads to themselves");
          };
          let updatedLead = {
            existingLead with
            assignedAgent = ?agentId;
          };
          leads.add(leadId, updatedLead);
        };
      };
      case (null) {
        Runtime.trap("Lead not found");
      };
    };
  };

  public query ({ caller }) func getLead(id : Nat) : async ?Lead {
    requireApprovedAgentOrAdmin(caller);

    leads.get(id);
  };

  func computePageIndices(totalItems : Nat, pageIndex : ?Nat, pageSize : ?Nat) : (Nat, Nat) {
    let pageIndexValue = switch (pageIndex) {
      case (?i) { if (i > 0) { i } else { 1 } };
      case (null) { 1 };
    };

    let pageSizeValue = switch (pageSize) {
      case (?s) { if (s > 0) { s } else { defaultPageSize } };
      case (null) { defaultPageSize };
    };

    let safeSubtract = func(a : Nat, b : Nat) : Nat {
      if (b > a) { return 0 };
      a - b;
    };

    let startIndex = safeSubtract((pageIndexValue * pageSizeValue), pageSizeValue);

    let endIndex = if ((startIndex + pageSizeValue) > totalItems) {
      totalItems;
    } else { startIndex + pageSizeValue };

    (startIndex, endIndex);
  };

  public query ({ caller }) func getAllLeads(pageIndex : ?Nat, pageSize : ?Nat) : async PaginatedLeads {
    requireApprovedAgentOrAdmin(caller);

    let allLeads = leads.values().toArray();
    let (startIndex, endIndex) = computePageIndices(allLeads.size(), pageIndex, pageSize);

    {
      leads = if (startIndex < allLeads.size()) {
        allLeads.sliceToArray(startIndex, endIndex);
      } else { [] };
      total = allLeads.size();
      hasNextPage = endIndex < allLeads.size();
    };
  };

  public shared ({ caller }) func deleteLead(id : Nat) : async () {
    requireApprovedAgentOrAdmin(caller);

    leads.remove(id);
  };

  public shared ({ caller }) func addCustomer(customer : Customer) : async Nat {
    requireApprovedAgentOrAdmin(caller);

    let newId = customerIdCounter;
    customers.add(newId, customer);
    customerIdCounter += 1;
    newId;
  };

  public shared ({ caller }) func updateCustomer(id : Nat, customer : Customer) : async () {
    requireApprovedAgentOrAdmin(caller);

    customers.add(id, customer);
  };

  public query ({ caller }) func getCustomer(id : Nat) : async ?Customer {
    requireApprovedAgentOrAdmin(caller);

    customers.get(id);
  };

  public query ({ caller }) func getAllCustomers(pageIndex : ?Nat, pageSize : ?Nat) : async PaginatedCustomers {
    requireApprovedAgentOrAdmin(caller);

    let allCustomers = customers.values().toArray();
    let (startIndex, endIndex) = computePageIndices(allCustomers.size(), pageIndex, pageSize);

    {
      customers = if (startIndex < allCustomers.size()) {
        allCustomers.sliceToArray(startIndex, endIndex);
      } else { [] };
      total = allCustomers.size();
      hasNextPage = endIndex < allCustomers.size();
    };
  };

  public shared ({ caller }) func addFollowUp(followUp : FollowUp) : async Nat {
    requireApprovedAgentOrAdmin(caller);

    let newId = followUpIdCounter;
    followUps.add(newId, followUp);
    followUpIdCounter += 1;
    newId;
  };

  public shared ({ caller }) func updateFollowUp(id : Nat, followUp : FollowUp) : async () {
    requireApprovedAgentOrAdmin(caller);

    followUps.add(id, followUp);
  };

  public query ({ caller }) func getFollowUp(id : Nat) : async ?FollowUp {
    requireApprovedAgentOrAdmin(caller);

    followUps.get(id);
  };

  public query ({ caller }) func getAllFollowUps() : async [FollowUp] {
    requireApprovedAgentOrAdmin(caller);

    followUps.values().toArray();
  };

  public shared ({ caller }) func addTemplate(template : MessageTemplate) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add templates");
    };

    let newId = templateIdCounter;
    templates.add(newId, template);
    templateIdCounter += 1;
    newId;
  };

  public shared ({ caller }) func updateTemplate(id : Nat, template : MessageTemplate) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update templates");
    };

    templates.add(id, template);
  };

  public query ({ caller }) func getTemplate(id : Nat) : async ?MessageTemplate {
    requireApprovedAgentOrAdmin(caller);

    templates.get(id);
  };

  public query ({ caller }) func getAllTemplates() : async [MessageTemplate] {
    requireApprovedAgentOrAdmin(caller);

    templates.values().toArray();
  };

  public shared ({ caller }) func deleteTemplate(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete templates");
    };

    templates.remove(id);
  };

  public shared ({ caller }) func setWhatsAppConfig(config : WhatsAppConfig) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can configure WhatsApp");
    };

    whatsAppConfig := ?config;
  };

  public query ({ caller }) func getWhatsAppConfig() : async ?WhatsAppConfig {
    // Read access to WhatsApp status for all authenticated users (admin, approved agents)
    requireApprovedAgentOrAdmin(caller);
    whatsAppConfig;
  };

  public shared ({ caller }) func sendMessage(recipient : Principal, content : Text) : async Nat {
    requireApprovedAgentOrAdmin(caller);

    let newId = messageIdCounter;
    let message : Message = {
      id = newId;
      sender = caller;
      recipient = recipient;
      timestamp = Time.now();
      content = content;
    };
    messages.add(newId, message);
    messageIdCounter += 1;
    newId;
  };

  public query ({ caller }) func getMessages(user : Principal) : async [Message] {
    requireApprovedAgentOrAdmin(caller);

    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own messages or admin access required");
    };

    messages.values().toArray().filter(
      func(m) { m.sender == user or m.recipient == user }
    );
  };

  public shared ({ caller }) func recordAttendance(record : AttendanceRecord) : async Nat {
    requireApprovedAgentOrAdmin(caller);

    if (record.agentId != caller) {
      Runtime.trap("Unauthorized: Can only record your own attendance");
    };

    switch (userProfiles.get(caller)) {
      case (?profile) {
        let expectedMobile = switch (profile.contactNumber) {
          case (?number) { number };
          case (null) { "" };
        };

        if (record.agentName != profile.name or record.agentMobile != expectedMobile) {
          Runtime.trap("Unauthorized: Agent information does not match your profile");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: User profile not found");
      };
    };

    let newId = attendanceIdCounter;
    attendanceRecords.add(newId, record);
    attendanceIdCounter += 1;
    newId;
  };

  public query ({ caller }) func getAttendanceRecords(agentId : Principal) : async [AttendanceRecord] {
    requireApprovedAgentOrAdmin(caller);

    if (caller != agentId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own attendance or admin access required");
    };

    attendanceRecords.values().toArray().filter(
      func(r) { r.agentId == agentId }
    );
  };

  public query ({ caller }) func getAttendanceAgentRecords(agentId : Principal) : async [AttendanceAgentRecord] {
    requireApprovedAgentOrAdmin(caller);

    if (caller != agentId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own attendance or admin access required");
    };

    attendanceRecords.values().toArray().filter(
      func(r) { r.agentId == agentId }
    ).map(
      func(r) { { agentName = r.agentName; agentMobile = r.agentMobile; checkInTime = r.checkInTime; checkOutTime = r.checkOutTime } }
    );
  };

  public query ({ caller }) func getAllAttendanceRecords(pageIndex : ?Nat, pageSize : ?Nat) : async PaginatedAttendanceRecords {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all attendance records");
    };

    let allRecords = attendanceRecords.values().toArray();
    let (startIndex, endIndex) = computePageIndices(allRecords.size(), pageIndex, pageSize);

    {
      records = if (startIndex < allRecords.size()) {
        allRecords.sliceToArray(startIndex, endIndex);
      } else { [] };
      total = allRecords.size();
      hasNextPage = endIndex < allRecords.size();
    };
  };

  public query ({ caller }) func getAllAttendanceAgentRecords() : async [AttendanceAgentRecord] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all attendance records");
    };
    attendanceRecords.values().toArray().map(
      func(r) { { agentName = r.agentName; agentMobile = r.agentMobile; checkInTime = r.checkInTime; checkOutTime = r.checkOutTime } }
    );
  };

  public query ({ caller }) func getAttendanceRecordsCsvReport(agentId : Principal) : async CsvReport {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can download attendance report");
    };

    let filteredRecords = attendanceRecords.values().toArray().filter(
      func(record) { record.agentId == agentId }
    );

    if (filteredRecords.size() == 0) {
      Runtime.trap("No attendance records found for specified agent");
    };

    let lastIndex = filteredRecords.size();
    let lastRecord = filteredRecords[lastIndex - 1];
    let agentName = lastRecord.agentName;
    let agentMobile = lastRecord.agentMobile;

    let csvRecords = filteredRecords.map(
      func(record) {
        {
          agentName = record.agentName;
          agentMobile = record.agentMobile;
          checkInTime = record.checkInTime;
          checkOutTime = switch (record.checkOutTime) {
            case (?time) { time };
            case (null) { 0 };
          };
          attendanceDate = record.checkInTime;
          location = "{ \"latitude\": " # record.location.latitude.toText() # ", \"longitude\": " # record.location.longitude.toText() # "}";
          faceVerification = "{ \"isSuccess\": " # record.faceVerification.isSuccess.toText() # ", \"confidenceScore\": " # record.faceVerification.confidenceScore.toText() # ", \"message\": \"" # record.faceVerification.message # "\" }";
        };
      }
    );
    {
      agentName;
      agentMobile;
      attendanceRecords = csvRecords;
    };
  };

  public shared ({ caller }) func logWhatsAppMessage(log : WhatsAppMessageLog) : async Nat {
    requireApprovedAgentOrAdmin(caller);

    let newId = whatsappMessageLogCounter;
    whatsappMessageLogs.add(newId, log);
    whatsappMessageLogCounter += 1;
    newId;
  };

  public query ({ caller }) func getWhatsAppMessageLogs() : async [WhatsAppMessageLog] {
    requireApprovedAgentOrAdmin(caller);

    whatsappMessageLogs.values().toArray();
  };

  public shared ({ caller }) func addCustomerQuery(customerQuery : CustomerQuery) : async Nat {
    requireApprovedAgentOrAdmin(caller);

    let newId = customerQueryIdCounter;
    customerQueries.add(newId, customerQuery);
    customerQueryIdCounter += 1;
    newId;
  };

  public shared ({ caller }) func updateCustomerQuery(id : Nat, customerQuery : CustomerQuery) : async () {
    requireApprovedAgentOrAdmin(caller);

    switch (customerQueries.get(id)) {
      case (?existingQuery) {
        // Non-admin agents can only update their own assigned queries
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          switch (existingQuery.assignedAgent) {
            case (?agentId) {
              if (agentId != caller) {
                Runtime.trap("Unauthorized: Can only update your own assigned queries");
              };
            };
            case (null) {
              Runtime.trap("Unauthorized: Query not assigned to you");
            };
          };

          // Verify the updated query maintains the same assignment
          switch (customerQuery.assignedAgent) {
            case (?newAgentId) {
              if (newAgentId != caller) {
                Runtime.trap("Unauthorized: Cannot reassign query to another agent");
              };
            };
            case (null) {
              Runtime.trap("Unauthorized: Cannot unassign query");
            };
          };
        };

        customerQueries.add(id, customerQuery);
      };
      case (null) {
        Runtime.trap("Query not found");
      };
    };
  };

  public query ({ caller }) func getCustomerQuery(id : Nat) : async ?CustomerQuery {
    requireApprovedAgentOrAdmin(caller);

    switch (customerQueries.get(id)) {
      case (?customerQuery) {
        if (AccessControl.isAdmin(accessControlState, caller)) {
          return ?customerQuery;
        };

        switch (customerQuery.assignedAgent) {
          case (?agentId) {
            if (agentId == caller) {
              ?customerQuery;
            } else {
              null;
            };
          };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getAllCustomerQueries() : async [CustomerQuery] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all customer queries");
    };

    customerQueries.values().toArray();
  };

  public query ({ caller }) func getAgentCustomerQueries(agentId : Principal) : async [CustomerQuery] {
    requireApprovedAgentOrAdmin(caller);

    if (caller != agentId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own queries or admin access required");
    };

    customerQueries.values().toArray().filter(
      func(q) {
        switch (q.assignedAgent) {
          case (?agent) { agent == agentId };
          case (null) { false };
        };
      }
    );
  };

  func getAgentInfoFromUserProfile(principal : Principal, profile : UserProfile, approvalStatus : Text) : AgentInfo {
    let contactNumber = switch (profile.contactNumber) {
      case (null) { "" };
      case (?number) { number };
    };

    {
      principal;
      name = profile.name;
      contactNumber;
      approvalStatus;
    };
  };

  func getAgentApprovalStatus(principal : Principal) : Text {
    if (switch (userProfiles.get(principal)) {
      case (?profile) { profile.role == "agent" };
      case (null) { false };
    }) {
      switch (UserApproval.isApproved(approvalState, principal)) {
        case (true) { "approved" };
        case (false) { "pending" };
      };
    } else {
      "not_agent";
    };
  };

  public query ({ caller }) func getAgentPanelData() : async AgentPanelData {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view agent panel data");
    };

    let agents = userProfiles.entries().toArray().filter(
      func((principal, profile)) {
        profile.role == "agent";
      }
    ).map(
      func((principal, profile)) {
        getAgentInfoFromUserProfile(principal, profile, getAgentApprovalStatus(principal));
      }
    );

    let agentStats = {
      totalAgents = agents.size();
      approvedAgents = agents.filter(
        func(agent) {
          agent.approvalStatus == "approved" or agent.approvalStatus == "APPROVED";
        }
      ).size();
      pendingAgents = agents.filter(
        func(agent) { agent.approvalStatus == "pending" }
      ).size();
      rejectedAgents = agents.filter(
        func(agent) { agent.approvalStatus == "rejected" }
      ).size();
      approvalRate = if (agents.size() > 0) {
        agents.filter(
          func(agent) { agent.approvalStatus == "approved" }
        ).size().toFloat() / agents.size().toFloat() * 100.0;
      } else { 0.0 };
      rejectionRate = if (agents.size() > 0) {
        agents.filter(
          func(agent) { agent.approvalStatus == "rejected" }
        ).size().toFloat() / agents.size().toFloat() * 100.0;
      } else { 0.0 };
    };

    let recentChanges = agents;

    {
      agents;
      agentStats;
      recentChanges;
    };
  };

  public shared ({ caller }) func changeAgentApprovalStatus(agentPrincipal : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can change agent approval status");
    };

    UserApproval.setApproval(approvalState, agentPrincipal, status);
  };

  public query ({ caller }) func getOverviewMetrics() : async OverviewMetrics {
    requireApprovedAgentOrAdmin(caller);

    // Metrics calculation
    let totalLeads = leads.size();
    let totalCustomers = customers.size();
    let pendingFollowUps = followUps.values().toArray().filter(
      func(f) { not f.completed }
    ).size();

    let convertedLeads = leads.values().toArray().filter(
      func(l) { switch (l.status) { case (#converted) { true }; case (_) { false }; } }
    ).size();
    let conversionRate = if (totalLeads > 0) {
      convertedLeads.toFloat() / totalLeads.toFloat() * 100.0;
    } else { 0.0 };

    let validCheckIns = attendanceRecords.values().toArray().filter(
      func(r) { r.isValid }
    ).size();

    let todayCheckIns = attendanceRecords.values().toArray().filter(
      func(r) {
        let dayInNanos = 86400000000000;
        let now = Time.now();
        r.checkInTime > (now - dayInNanos);
      }
    ).size();

    // Customer Query Stats
    let allQueries = customerQueries.values().toArray();
    let openQueries = allQueries.filter(
      func(q) { switch (q.status) { case (#open) { true }; case (_) { false }; } }
    ).size();
    let inProgressQueries = allQueries.filter(
      func(q) { switch (q.status) { case (#inProgress) { true }; case (_) { false }; } }
    ).size();
    let resolvedQueries = allQueries.filter(
      func(q) { switch (q.status) { case (#resolved) { true }; case (_) { false }; } }
    ).size();
    let closedQueries = allQueries.filter(
      func(q) { switch (q.status) { case (#closed) { true }; case (_) { false }; } }
    ).size();

    // Agent Approval Metrics
    let agents = userProfiles.entries().toArray().filter(
      func((p, profile)) { profile.role == "agent" }
    );
    let approvedAgents = agents.filter(
      func((p, _)) { UserApproval.isApproved(approvalState, p) }
    ).size();
    let pendingAgents = agents.filter(
      func((p, _)) { not UserApproval.isApproved(approvalState, p) }
    ).size();
    let recentAgentApprovals = agents.map(
      func((p, profile)) {
        getAgentInfoFromUserProfile(p, profile, getAgentApprovalStatus(p));
      }
    );

    // Query Type Stats
    let rentQueries = allQueries.filter(func(q) { q.flatType == "Rent" });
    let salesQueries = allQueries.filter(func(q) { q.flatType == "Sales" });
    let interiorQueries = allQueries.filter(func(q) { q.flatType == "Interior" });

    // Get Recent Items Helper ---------------------------------
    func getRecentItemsByTime<T>(items : [T], getTime : T -> Time.Time, count : Nat) : [T] {
      let sorted = items.sort(
        func(a, b) {
          let timeA = getTime(a);
          let timeB = getTime(b);
          if (timeA > timeB) {
            #less;
          } else if (timeA < timeB) {
            #greater;
          } else { #equal };
        }
      );
      if (sorted.size() > count) {
        sorted.sliceToArray(0, count);
      } else { sorted };
    };

    // Convert Map to Array Helper ---------------------------
    func takeRecent<T>(map : Map.Map<Nat, T>, getTime : T -> Time.Time, count : Nat) : [T] {
      getRecentItemsByTime(map.values().toArray(), getTime, count);
    };

    {
      totalLeads;
      totalCustomers;
      pendingFollowUps;
      conversionRate;
      validCheckIns;
      todayCheckIns;
      currentDayCheckIns = todayCheckIns;
      customerQueryStats = {
        totalQueries = allQueries.size();
        openQueries;
        resolvedQueries;
        inProgressQueries;
        closedQueries;
      };
      agentApprovalMetrics = {
        totalAgents = agents.size();
        approvedAgents;
        pendingAgents;
        rejectedAgents = 0;
        agentCountPerStatus = {
          approved = approvedAgents;
          pending = pendingAgents;
          rejected = 0;
        };
        recentAgentApprovals;
      };
      rentQueries = {
        total = rentQueries.size();
        open = rentQueries.filter(func(q) { switch (q.status) { case (#open) { true }; case (_) { false }; } }).size();
        inProgress = rentQueries.filter(func(q) { switch (q.status) { case (#inProgress) { true }; case (_) { false }; } }).size();
        resolved = rentQueries.filter(func(q) { switch (q.status) { case (#resolved) { true }; case (_) { false }; } }).size();
        closed = rentQueries.filter(func(q) { switch (q.status) { case (#closed) { true }; case (_) { false }; } }).size();
      };
      salesQueries = {
        total = salesQueries.size();
        open = salesQueries.filter(func(q) { switch (q.status) { case (#open) { true }; case (_) { false }; } }).size();
        inProgress = salesQueries.filter(func(q) { switch (q.status) { case (#inProgress) { true }; case (_) { false }; } }).size();
        resolved = salesQueries.filter(func(q) { switch (q.status) { case (#resolved) { true }; case (_) { false }; } }).size();
        closed = salesQueries.filter(func(q) { switch (q.status) { case (#closed) { true }; case (_) { false }; } }).size();
      };
      interiorQueries = {
        total = interiorQueries.size();
        open = interiorQueries.filter(func(q) { switch (q.status) { case (#open) { true }; case (_) { false }; } }).size();
        inProgress = interiorQueries.filter(func(q) { switch (q.status) { case (#inProgress) { true }; case (_) { false }; } }).size();
        resolved = interiorQueries.filter(func(q) { switch (q.status) { case (#resolved) { true }; case (_) { false }; } }).size();
        closed = interiorQueries.filter(func(q) { switch (q.status) { case (#closed) { true }; case (_) { false }; } }).size();
      };
      recentLeads = takeRecent(leads, func(l) { l.createdAt }, 20);
      recentCustomers = takeRecent(customers, func(c) { c.createdAt }, 20);
      recentFollowUps = takeRecent(followUps, func(f) { f.dueDate }, 20);
    };
  };
};
