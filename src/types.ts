export type UserRole = 'ADMIN' | 'STAFF' | 'MEMBER' | 'FIELD_COORDINATOR' | 'BOOTH_COORDINATOR' | 'FINANCE_OFFICER';
export type CommitteeLevel = 'central' | 'province' | 'district' | 'municipality' | 'ward' | 'wing';
export type SupporterLevel = 'strong' | 'leaning' | 'neutral' | 'undecided' | 'volunteer' | 'donor';
export type IssueCategory = 'road' | 'water' | 'electricity' | 'agriculture' | 'education' | 'health' | 'youth' | 'women' | 'corruption' | 'other';
export type CampaignPhase = 'planning' | 'active' | 'completed' | 'paused';
export type TransactionType = 'income' | 'expense';
export type TransactionCategory = 'fee' | 'donation' | 'campaign' | 'administrative' | 'other';
export type GrievanceStatus = 'pending' | 'in-review' | 'resolved' | 'closed';
export type GrievancePriority = 'low' | 'medium' | 'high';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  partyRole?: string;
  committeeId?: string;
  orgUnitId?: string;
  orgUnitLevel?: string;
  createdAt?: string;
}

export interface OrganizationUnit {
  id: string;
  name: string;
  level: 'NATIONAL' | 'PROVINCE' | 'DISTRICT' | 'CONSTITUENCY' | 'MUNICIPALITY' | 'WARD' | 'BOOTH';
  code?: string;
  parentId?: string;
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
  status: 'PENDING' | 'COMPLETED' | 'REFUNDED' | 'FAILED';
  paymentMethod: string;
  referenceId: string;
  donationId?: string;
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
  membershipId: string;
  fullName: string;
  email: string;
  phone: string;
  citizenshipNumber: string;
  photoUrl?: string;
  orgUnitId: string;
  committeeId?: string;
  status: 'PENDING' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  verificationStatus: {
    verifiedAt: string;
    verifiedBy: string;
    verificationNotes?: string;
  };
  customAttributes: Record<string, any>;
  auditTrail: AuditLogEntry[];
  createdAt: string;
  updatedAt: string;
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

export interface Candidate {
  id?: string;
  name: string;
  position: string;
  constituency: string;
  electionYear: number;
  manifesto?: string;
  status: 'active' | 'withdrawn' | 'won' | 'lost';
}

export interface PartyDocument {
  id: string;
  title: string;
  description: string | null;
  category: 'POLICY' | 'MANIFESTO' | 'FORMS' | 'REPORTS' | 'OTHER';
  categoryId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  size: number;
  uploadedBy: {
    id: string;
    displayName: string;
  };
  createdAt: string;
  version: number;
  tags: string[];
}

export interface Supporter {
  id?: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  localLevel: string;
  ward: number;
  supportLevel: SupporterLevel;
  issues: IssueCategory[];
  notes?: string;
  assignedTo?: string; // UID of field worker
  lastContactedAt?: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  donationsCount: number;
  startDate: string;
  endDate?: string;
}

export interface FinanceAnalytics {
  totalRaised: number;
  donorCount: number;
  recentDonations: any[];
  campaigns: Campaign[];
}

export interface Booth {
  id?: string;
  name: string;
  pollingCenterId: string;
  ward: number;
  localLevel: string;
  district: string;
  coordinatorId?: string; // UID
  totalVoters?: number;
  estimatedSupporters?: number;
  status: 'ready' | 'needs_attention' | 'critical';
}
