import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBudgetSummary, calculateSettlement } from './budget';
import { ExpenseItem, FamilyMember } from '../types/trip';

test('calculateBudgetSummary computes totals, remaining and percentages correctly', () => {
  const expenses: ExpenseItem[] = [
    {
      id: 'e1',
      date: '2026-11-05',
      dayIndex: 1,
      title: '렌터카',
      category: 'transport',
      amount: 150000,
      payerId: 'm1',
      splitType: 'equal',
      splitMemberIds: ['m1', 'm2'],
    },
    {
      id: 'e2',
      date: '2026-11-05',
      dayIndex: 1,
      title: '흑돼지 식사',
      category: 'food',
      amount: 90000,
      payerId: 'm2',
      splitType: 'equal',
      splitMemberIds: ['m1', 'm2'],
    },
  ];

  const summary = calculateBudgetSummary(500000, expenses);
  assert.equal(summary.totalBudget, 500000);
  assert.equal(summary.totalSpent, 240000);
  assert.equal(summary.remainingBudget, 260000);
  assert.equal(summary.percentUsed, 48.0);
  assert.equal(summary.categoryBreakdown.transport.amount, 150000);
  assert.equal(summary.categoryBreakdown.food.amount, 90000);
});

test('calculateSettlement balances equal split correctly between two members', () => {
  const members: FamilyMember[] = [
    { id: 'm1', name: '아빠', role: 'dad', ageGroup: 'adult', color: '#3b82f6' },
    { id: 'm2', name: '엄마', role: 'mom', ageGroup: 'adult', color: '#ec4899' },
  ];

  // Dad paid 200,000 for both. Mom paid 0.
  // Each share is 100,000.
  // Dad net balance = +100,000. Mom net balance = -100,000.
  // Transfer: Mom -> Dad: 100,000.
  const expenses: ExpenseItem[] = [
    {
      id: 'e1',
      date: '2026-11-05',
      dayIndex: 1,
      title: '숙소 예약',
      category: 'stay',
      amount: 200000,
      payerId: 'm1',
      splitType: 'equal',
      splitMemberIds: ['m1', 'm2'],
    },
  ];

  const result = calculateSettlement(members, expenses);
  const dadBal = result.balances.find((b) => b.memberId === 'm1');
  const momBal = result.balances.find((b) => b.memberId === 'm2');

  assert.equal(dadBal?.netBalance, 100000);
  assert.equal(momBal?.netBalance, -100000);
  assert.equal(result.transfers.length, 1);
  assert.equal(result.transfers[0].fromName, '엄마');
  assert.equal(result.transfers[0].toName, '아빠');
  assert.equal(result.transfers[0].amount, 100000);
});
