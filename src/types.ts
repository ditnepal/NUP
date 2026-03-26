export type UserRole = 'ADMIN' | 'STAFF' | 'MEMBER' | 'FIELD_COORDINATOR' | 'BOOTH_COORDINATOR' | 'FINANCE_OFFICER';
export type AppAction = 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'VERIFY' | 'ESCALATE' | 'REJECT' | 'EXPORT' | 'RENEW' | 'TRANSFER' | 'SUSPEND' | 'TERMINATE' | 'GENERATE_CARD';
export type AppModule = 'DASHBOARD' | 'MEMBERSHIP' | 'SUPPORTERS' | 'BOOTHS' | 'FINANCE' | 'FUNDRAISING' | 'ELECTION' | 'PGIS' | 'WAR_ROOM' | 'COMMUNICATION' | 'CMS' | 'HIERARCHY' | 'NOTICE_POPUP' | 'TRAINING' | 'GRIEVANCES' | 'SURVEYS';
export type CommitteeLevel = 'central' | 'province' | 'district' | 'municipality' | 'ward' | 'wing';
export type SupporterLevel = 'strong' | 'leaning' | 'neutral' | 'undecided' | 'volunteer' | 'donor';
export type IssueCategory = 'road' | 'water' | 'electricity' | 'agriculture' | 'education' | 'health' | 'youth' | 'women' | 'corruption' | 'other';
export type CampaignPhase = 'planning' | 'active' | 'completed' | 'paused';
export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'fee' | 'donation' | 'campaign' | 'administrative' | 'other';
export type GrievanceStatus = 'pending' | 'in-review' | 'resolved' | 'closed';
export type GrievancePriority = 'low' | 'medium' | 'high';

export interface ChildUnitSummary {
  id: string;
  name: string;
  level: string;
  members: number;
  supporters: number;
  booths: number;
  openGrievances: number;
}

export interface DashboardSummary {
  scopeName?: string;
  totalMembers?: number;
  totalSupporters?: number;
  totalBooths?: number;
  activeCampaigns?: number;
  openIssues?: number;
  totalIncome?: number;
  totalExpenses?: number;
  netBalance?: number;
  transactionCount?: number;
  strongSupporters?: number;
  readyBooths?: number;
  criticalBooths?: number;
  myIssues?: number;
  upcomingEvents?: number;
  openGrievances?: number;
  activeSurveys?: number;
  totalDonations?: number;
  activeFundCampaigns?: number;
  childUnits?: ChildUnitSummary[];
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  partyRole?: string;
  committeeId?: string;
  orgUnitId?: string;
  orgUnitLevel?: string;
  orgUnitName?: string;
  createdAt?: string;
}

export interface OrganizationUnit {
  id: string;
  name: string;
  level: 'NATIONAL' | 'PROVINCE' | 'DISTRICT' | 'CONSTITUENCY' | 'MUNICIPALITY' | 'WARD' | 'BOOTH';
  code?: string;
  parentId?: string;
  isActive: boolean;
  description?: string;
  sortOrder: number;
  contactEmail?: string;
  contactPhone?: string;
  children?: OrganizationUnit[];
  offices?: Office[];
  users?: UserProfile[];
}

export interface Office {
  id: string;
  name: string;
  type: 'HEADQUARTERS' | 'REGIONAL' | 'CONTACT_POINT';
  orgUnitId: string;
  address: string;
  contactNumber?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  isPublic: boolean;
  description?: string;
  province?: string;
  district?: string;
  locality?: string;
  ward?: number;
  municipality?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Committee {
  id?: string;
  name: string;
  level: CommitteeLevel;
  province?: string;
  district?: string;
  localLevel?: string;
  ward?: number;
  parentId?: string;
}

export interface OrgCommittee {
  id: string;
  name: string;
  type: string;
  description?: string;
  isActive: boolean;
  orgUnitId: string;
  bearers?: OrgOfficeBearer[];
  createdAt: string;
  updatedAt: string;
}

export interface OrgOfficeBearer {
  id: string;
  committeeId: string;
  userId?: string;
  fullName: string;
  position: string;
  termStart: string;
  termEnd?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  user?: UserProfile;
}

export interface PartyMember {
  id?: string;
  fullName: string;
  email?: string;
  phone?: string;
  province: string;
  district: string;
  localLevel?: string;
  committeeLevel: CommitteeLevel;
  ward?: number;
  joiningDate: string;
  status: 'active' | 'inactive' | 'suspended';
  addedBy?: string;
  qrCode?: string;
}

export interface Transaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED' | 'REJECTED';
  paymentMethod: string;
  referenceId: string;
  recordedById?: string;
  recordedBy?: { displayName: string };
  reviewedById?: string;
  reviewedBy?: { displayName: string };
  reviewedAt?: string;
  reconciliationNote?: string;
  donation?: {
    id: string;
    donor: { fullName: string };
    campaign?: { title: string };
  };
  memberId?: string;
  member?: { fullName: string };
  renewalRequestId?: string;
  renewalRequest?: { id: string };
}

export interface PaymentIntegration {
  id: string;
  provider: string;
  displayName: string;
  region: 'NEPAL' | 'INDIA' | 'INTERNATIONAL';
  enabled: boolean;
  mode: 'TEST' | 'LIVE';
  sortOrder: number;
  supportedModules: string[];
  instructions?: string;
  publicKey?: string;
  secretRef?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GrievanceCategory {
  id: string;
  name: string;
}

export interface Grievance {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: GrievanceCategory;
  reporter: {
    id: string;
    displayName: string;
  };
  createdAt: string;
  assignments: any[];
  responses?: {
    id: string;
    content: string;
    isInternal: boolean;
    createdAt: string;
    user: {
      displayName: string;
    };
  }[];
}

export interface AuditLog {
  id?: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details: string;
}

export interface Member {
  id: string;
  membershipId?: string;
  trackingCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  citizenshipNumber?: string;
  photoUrl?: string;
  profilePhotoUrl?: string;
  identityDocumentUrl?: string;
  videoUrl?: string;
  orgUnitId?: string;
  orgUnit?: OrganizationUnit;
  committeeId?: string;
  status: 'PENDING' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'REJECTED';
  joinedDate?: string;
  expiryDate?: string;
  applicationMode: 'FORM' | 'VIDEO' | 'ASSISTED';
  province?: string;
  district?: string;
  localLevel?: string;
  ward?: number;
  fatherName?: string;
  motherName?: string;
  occupation?: string;
  paymentMethod?: string;
  qrCodeData?: string;
  verifiedById?: string;
  verifiedAt?: string;
  verifiedBy?: { displayName: string };
  approvedById?: string;
  approvedAt?: string;
  approvedBy?: { displayName: string };
  reviewNote?: string;
  isEscalated?: boolean;
  escalatedAt?: string;
  escalatedToUnitId?: string;
  escalationNote?: string;
  createdAt: string;
  updatedAt: string;
  verificationStatus?: {
    verifiedAt: string;
    verifiedBy: string;
    verificationNotes?: string;
  };
  cardStatus?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  issueDate?: string;
  qrCodeUrl?: string;
  customAttributes?: Record<string, any>;
  auditTrail?: AuditLogEntry[];
  skills?: string[];
  availability?: string[];
  assignedTasks?: any[];
  submittedReports?: any[];
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  photoUrl?: string;
}

export interface AgendaItem {
  id: string;
  startTime: string;
  title: string;
  description: string;
}

export interface Organizer {
  name: string;
  email: string;
  phone: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'REGISTERED' | 'ATTENDED' | 'NO_SHOW';
  user?: {
    id: string;
    name: string;
  };
}

export interface AppEvent {
  id: string;
  title: string;
  summary?: string | null;
  description: string;
  audience: 'PUBLIC' | 'MEMBERS' | 'STAFF';
  status: 'DRAFT' | 'PUBLISHED';
  isPinned: boolean;
  eventDate: Date;
  startAt: string;
  endAt?: string | null;
  location: string;
  coverImageUrl?: string | null;
  attachmentUrl?: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  location: string;
  type: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  registrations: Registration[];
  speakers: Speaker[];
  agenda: AgendaItem[];
  organizer: Organizer;
  _count: {
    registrations: number;
  };
}

export interface ElectionCycle {
  id: string;
  name: string;
  year: number;
  type: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Constituency {
  id: string;
  name: string;
  code?: string;
  province: string;
  district: string;
  localLevel?: string;
  ward?: number;
  type: string;
  totalVoters?: number;
  parentConstituencyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  electionCycleId?: string;
  constituencyId?: string;
  electionType?: string;
  electionYear?: number;
  province?: string;
  district?: string;
  localLevel?: string;
  ward?: number;
  manifesto?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  constituency?: Constituency;
  electionCycle?: ElectionCycle;
  documents?: any[];
}

export interface PartyDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  supporterId: string;
  type: string;
  date: string;
  notes?: string;
  handledBy: string;
  createdAt: string;
}

export interface Supporter {
  id?: string;
  fullName: string;
  phoneNumber: string;
  province: string;
  district: string;
  localLevel: string;
  ward: number;
  supportLevel: SupporterLevel;
  issues: string; // Backend expects string
  notes?: string;
  assignedTo?: string; // UID of field worker
  lastContactedAt?: string;
  createdAt: string;
  interactions?: Interaction[];
}

export interface FundraisingCampaign {
  id: string;
  title: string;
  description: string;
  fundraiserType: 'PARTY_FUND' | 'CANDIDATE_FUND' | 'CAUSE_FUND' | 'RELIEF_FUND' | 'PUBLIC_SUPPORT_FUND';
  beneficiaryType: 'PARTY' | 'CANDIDATE' | 'PUBLIC' | 'COMMUNITY';
  candidateId?: string;
  candidateSnapshot?: any;
  goalAmount: number;
  currentAmount: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  donationsCount: number;
  _count?: {
    donations: number;
  };
  startDate: string;
  endDate?: string;
}

export type Fundraiser = FundraisingCampaign;

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type?: string;
  phase?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface FinanceAnalytics {
  totalRaised: number;
  donorCount: number;
  recentDonations: any[];
  campaigns: FundraisingCampaign[];
  membershipCollections: number;
  renewalCollections: number;
  fundraiserCollections: number;
  totalCollections: number;
  refundTotal: number;
  refundCount: number;
  recentTransactionCount: number;
  totalTransactionCount?: number;
  rejectedTransactionCount?: number;
  pendingDonationsCount?: number;
  pendingDonationsAmount?: number;
  pendingTransactionCount?: number;
  pendingTransactionAmount?: number;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  audience: 'PUBLIC' | 'MEMBERS' | 'STAFF';
  status: 'DRAFT' | 'PUBLISHED';
  isPinned: boolean;
  isPopup: boolean;
  displayType: 'BANNER' | 'MODAL' | 'TOAST';
  targetPath?: string;
  publishAt?: string;
  expireAt?: string;
  attachmentUrl?: string;
  externalUrl?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  programId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
}

export interface TrainingProgram {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED';
  audience: 'PUBLIC' | 'MEMBERS' | 'STAFF';
  isPinned: boolean;
  externalUrl?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  courses?: Course[];
}

export interface Volunteer {
  id: string;
  memberId?: string;
  userId?: string;
  fullName: string;
  email?: string;
  phone?: string;
  skills: string;
  availability?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  member?: Member;
  assignments?: any[];
}

export interface VolunteerApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  skills: string;
  availability: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface PollingStation {
  id: string;
  name: string;
  code?: string;
  location: string;
  constituencyId: string;
  ward: number;
  localLevel: string;
  district: string;
  province: string;
  createdAt?: string;
  updatedAt?: string;
  constituency?: Constituency;
  _count?: {
    booths: number;
  };
}

export interface Booth {
  id: string;
  name: string;
  code?: string;
  pollingStationId?: string;
  ward: number;
  localLevel: string;
  district: string;
  province?: string;
  totalVoters: number;
  voterCount?: number;
  targetVotes: number;
  status: 'READY' | 'NEEDS_ATTENTION' | 'CRITICAL';
  readinessNote?: string;
  coordinatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ElectionIncident {
  id: string;
  cycleId: string;
  pollingStationId?: string;
  boothId?: string;
  reporterId: string;
  type: 'VIOLENCE' | 'FRAUD' | 'TECHNICAL' | 'LOGISTICAL' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  updatedAt: string;
  booth?: Booth;
  pollingStation?: PollingStation;
}

export interface CmsSection {
  id: string;
  title: string;
  type: 'HERO' | 'HIGHLIGHT' | 'CTA' | 'CONTENT_BLOCK' | 'NOTICE_BANNER';
  order: number;
  isEnabled: boolean;
  content: string; // JSON string
  authorId: string;
  createdAt: string;
  updatedAt: string;
  items?: CmsSectionContent[];
  author?: {
    displayName: string;
  };
}

export interface CmsSectionContent {
  id: string;
  sectionId: string;
  contentId: string;
  contentType: 'POST' | 'NOTICE' | 'EVENT';
  order: number;
  createdAt: string;
  updatedAt: string;
  // Included content details
  content?: any; 
}

export interface GroundIntelligenceReport {
  id: string;
  reporterId: string;
  type: 'SENTIMENT' | 'PUBLIC_ISSUE' | 'BOOTH_READINESS' | 'INCIDENT' | 'COMPETITOR_ACTIVITY';
  content: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  orgUnitId?: string;
  sentimentScore?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  reporter?: { displayName: string; email: string };
  orgUnit?: OrganizationUnit;
}

export interface CommunityPriority {
  id: string;
  orgUnitId: string;
  issue: string;
  description?: string;
  rank: number;
  createdAt: string;
  updatedAt: string;
  orgUnit?: OrganizationUnit;
}

export interface IntelligenceAlert {
  id: string;
  title: string;
  content: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  orgUnitId?: string;
  userId?: string;
  isRead: boolean;
  createdAt: string;
  orgUnit?: OrganizationUnit;
}

export interface AreaStrengthScore {
  id: string;
  orgUnitId: string;
  partyStrength: number;
  oppositionStrength: number;
  swingVoters: number;
  lastUpdated: string;
  orgUnit?: OrganizationUnit;
}

export interface GroundSignal {
  id: string;
  source: 'REPORT' | 'GRIEVANCE' | 'INCIDENT' | 'SURVEY' | 'BOOTH';
  type: string;
  content: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: string;
  location?: string;
  createdAt: string;
  metadata?: any;
}
