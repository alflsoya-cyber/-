export type MemberRole = 'dad' | 'mom' | 'child' | 'grandparent' | 'other';
export type MemberAgeGroup = 'adult' | 'senior' | 'child' | 'infant';

export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole;
  ageGroup: MemberAgeGroup;
  color: string;
  avatarIcon?: string;
  notes?: string;
}

export type ScheduleCategory = 'spot' | 'meal' | 'stay' | 'transport' | 'activity' | 'rest';

export interface ScheduleItem {
  id: string;
  dayIndex: number; // 1-based (Day 1, Day 2, ...)
  time: string; // HH:mm
  title: string;
  category: ScheduleCategory;
  location: string;
  estimatedCost: number;
  notes?: string;
  familyTips?: string;
  isCompleted: boolean;
  assignedMembers?: string[];
}

export type ExpenseCategory =
  | 'transport'
  | 'stay'
  | 'food'
  | 'activity'
  | 'shopping'
  | 'emergency'
  | 'other';

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  dayIndex: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  payerId: string;
  splitType: 'equal' | 'custom' | 'individual';
  splitMemberIds: string[];
  notes?: string;
}

export type PackingCategory =
  | 'essentials'
  | 'kids'
  | 'seniors'
  | 'clothing'
  | 'electronics'
  | 'medicine';

export interface PackingItem {
  id: string;
  category: PackingCategory;
  name: string;
  isPacked: boolean;
  assigneeId?: string;
}

export interface TripPlan {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  currency: string;
  members: FamilyMember[];
  schedule: ScheduleItem[];
  expenses: ExpenseItem[];
  packingList: PackingItem[];
  coverImageUrl?: string;
  notes?: string;
}

export interface SettlementTransfer {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  role: MemberRole;
  totalPaid: number;
  totalShare: number;
  netBalance: number; // >0: 받환급받을 금액, <0: 보내야 할 금액
}
