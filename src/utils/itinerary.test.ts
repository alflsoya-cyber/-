import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTripDays,
  formatKRW,
  sortScheduleByTime,
  encodeTripToHash,
  decodeTripFromHash,
} from './itinerary';
import { ScheduleItem, TripPlan } from '../types/trip';

test('formatKRW formats standard Korean won with separator', () => {
  assert.equal(formatKRW(1500000), '1,500,000원');
  assert.equal(formatKRW(0), '0원');
});

test('calculateTripDays calculates correct duration', () => {
  assert.equal(calculateTripDays('2026-11-05', '2026-11-08'), 4);
  assert.equal(calculateTripDays('2026-11-05', '2026-11-05'), 1);
});

test('sortScheduleByTime orders schedule items by day then time', () => {
  const items: ScheduleItem[] = [
    {
      id: '1',
      dayIndex: 2,
      time: '14:00',
      title: '감귤 체험',
      category: 'activity',
      location: '서귀포',
      estimatedCost: 30000,
      isCompleted: false,
    },
    {
      id: '2',
      dayIndex: 1,
      time: '18:00',
      title: '저녁 식사',
      category: 'meal',
      location: '제주시',
      estimatedCost: 60000,
      isCompleted: false,
    },
    {
      id: '3',
      dayIndex: 1,
      time: '10:00',
      title: '공항 도착 및 렌터카 인수',
      category: 'transport',
      location: '제주공항',
      estimatedCost: 0,
      isCompleted: false,
    },
  ];

  const sorted = sortScheduleByTime(items);
  assert.equal(sorted[0].id, '3'); // Day 1, 10:00
  assert.equal(sorted[1].id, '2'); // Day 1, 18:00
  assert.equal(sorted[2].id, '1'); // Day 2, 14:00
});

test('encodeTripToHash and decodeTripFromHash round-trip preserves trip data', () => {
  const mockTrip: TripPlan = {
    id: 'test-trip-1',
    title: '테스트 가족여행',
    destination: '부산',
    startDate: '2026-12-24',
    endDate: '2026-12-26',
    totalBudget: 1000000,
    currency: 'KRW',
    members: [{ id: 'm1', name: '아빠', role: 'dad', ageGroup: 'adult', color: '#3b82f6' }],
    schedule: [
      {
        id: 's1',
        dayIndex: 1,
        time: '12:00',
        title: '해운대 도착',
        category: 'spot',
        location: '해운대',
        estimatedCost: 0,
        isCompleted: false,
      },
    ],
    expenses: [],
    packingList: [],
  };

  const hash = encodeTripToHash(mockTrip);
  assert.ok(hash.length > 10);
  const decoded = decodeTripFromHash(hash);
  assert.equal(decoded?.title, '테스트 가족여행');
  assert.equal(decoded?.destination, '부산');
  assert.equal(decoded?.schedule.length, 1);
});
