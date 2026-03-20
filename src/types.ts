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
  id?: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  description: string;
  recordedBy: string;
}

export interface Grievance {
  id?: string;
  subject: string;
  description: string;
  submittedBy: string;
  status: GrievanceStatus;
  priority: GrievancePriority;
  date: string;
}

export interface AuditLog {
  id?: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

export interface PartyEvent {
  id?: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  type: 'rally' | 'meeting' | 'fundraiser' | 'press-conference';
  organizer?: string;
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
  id?: string;
  title: string;
  description?: string;
  category: 'policy' | 'legal' | 'manifesto' | 'finance' | 'other';
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
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
  id?: string;
  title: string;
  description: string;
  phase: CampaignPhase;
  targetProvince?: string;
  targetDistrict?: string;
  targetLocalLevel?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  managerId: string; // UID
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
