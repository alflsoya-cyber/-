import { ExpenseCategory, ExpenseItem, FamilyMember, MemberBalance, SettlementTransfer } from '../types/trip';

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  percentUsed: number;
  categoryBreakdown: Record<ExpenseCategory, { amount: number; percentage: number; count: number }>;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  transport: '항공/교통',
  stay: '숙박',
  food: '식비/카페',
  activity: '관광/체험',
  shopping: '쇼핑/기념품',
  emergency: '비상금/의료',
  other: '기타 경비',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  transport: '#0284c7', // Sky
  stay: '#4f46e5', // Indigo
  food: '#ea580c', // Orange
  activity: '#16a34a', // Emerald
  shopping: '#d97706', // Amber
  emergency: '#dc2626', // Red
  other: '#64748b', // Slate
};

export function calculateBudgetSummary(
  totalBudget: number,
  expenses: ExpenseItem[]
): BudgetSummary {
  const safeBudget = Math.max(0, totalBudget);
  const totalSpent = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const remainingBudget = safeBudget - totalSpent;
  const percentUsed = safeBudget > 0 ? Math.min(100, (totalSpent / safeBudget) * 100) : 0;

  const categories: ExpenseCategory[] = [
    'transport',
    'stay',
    'food',
    'activity',
    'shopping',
    'emergency',
    'other',
  ];

  const breakdown = {} as Record<ExpenseCategory, { amount: number; percentage: number; count: number }>;
  categories.forEach((cat) => {
    breakdown[cat] = { amount: 0, percentage: 0, count: 0 };
  });

  expenses.forEach((item) => {
    const cat = item.category || 'other';
    const amt = Number(item.amount) || 0;
    if (breakdown[cat]) {
      breakdown[cat].amount += amt;
      breakdown[cat].count += 1;
    }
  });

  categories.forEach((cat) => {
    breakdown[cat].percentage =
      totalSpent > 0 ? Math.round((breakdown[cat].amount / totalSpent) * 100) : 0;
  });

  return {
    totalBudget: safeBudget,
    totalSpent,
    remainingBudget,
    percentUsed: Number(percentUsed.toFixed(1)),
    categoryBreakdown: breakdown,
  };
}

/**
 * Family settlement calculation:
 * Computes how much each member paid directly vs their assigned share,
 * and generates pairwise transfer recommendations.
 */
export function calculateSettlement(
  members: FamilyMember[],
  expenses: ExpenseItem[]
): {
  balances: MemberBalance[];
  transfers: SettlementTransfer[];
} {
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const paidMap = new Map<string, number>();
  const shareMap = new Map<string, number>();

  members.forEach((m) => {
    paidMap.set(m.id, 0);
    shareMap.set(m.id, 0);
  });

  expenses.forEach((expense) => {
    const amt = Number(expense.amount) || 0;
    if (amt <= 0) return;

    // Add to payer
    const currentPaid = paidMap.get(expense.payerId) || 0;
    paidMap.set(expense.payerId, currentPaid + amt);

    // Split among participants
    const targets =
      expense.splitMemberIds && expense.splitMemberIds.length > 0
        ? expense.splitMemberIds.filter((id) => memberMap.has(id))
        : members.map((m) => m.id);

    const shareCount = targets.length > 0 ? targets.length : 1;
    const splitPerPerson = Math.floor(amt / shareCount);
    const remainder = amt - splitPerPerson * shareCount;

    targets.forEach((targetId, index) => {
      const extra = index === 0 ? remainder : 0;
      const currentShare = shareMap.get(targetId) || 0;
      shareMap.set(targetId, currentShare + splitPerPerson + extra);
    });
  });

  const balances: MemberBalance[] = members.map((member) => {
    const totalPaid = paidMap.get(member.id) || 0;
    const totalShare = shareMap.get(member.id) || 0;
    const netBalance = totalPaid - totalShare;

    return {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      totalPaid,
      totalShare,
      netBalance,
    };
  });

  // Calculate pairwise settlement transfers
  // Positive netBalance = creditor (should receive money)
  // Negative netBalance = debtor (should pay money)
  const creditors: { id: string; name: string; amount: number }[] = [];
  const debtors: { id: string; name: string; amount: number }[] = [];

  balances.forEach((b) => {
    if (b.netBalance > 0) {
      creditors.push({ id: b.memberId, name: b.memberName, amount: b.netBalance });
    } else if (b.netBalance < 0) {
      debtors.push({ id: b.memberId, name: b.memberName, amount: -b.netBalance });
    }
  });

  // Sort descending by amount
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const transferAmount = Math.min(creditor.amount, debtor.amount);
    if (transferAmount > 0) {
      transfers.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: Math.round(transferAmount),
      });

      creditor.amount -= transferAmount;
      debtor.amount -= transferAmount;
    }

    if (creditor.amount <= 1) cIdx++;
    if (debtor.amount <= 1) dIdx++;
  }

  return { balances, transfers };
}
