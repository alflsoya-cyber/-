import { ScheduleItem, TripPlan } from '../types/trip';

export function formatKRW(amount: number): string {
  if (isNaN(amount)) return '0원';
  return `${amount.toLocaleString('ko-KR')}원`;
}

export function sortScheduleByTime(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => {
    // Compare dayIndex first
    if (a.dayIndex !== b.dayIndex) {
      return a.dayIndex - b.dayIndex;
    }
    // Then compare HH:mm time
    const timeA = a.time || '00:00';
    const timeB = b.time || '00:00';
    return timeA.localeCompare(timeB);
  });
}

export function calculateTripDays(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 3;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 3;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.min(30, diffDays));
}

export function getDayDateString(startDateStr: string, dayIndex: number): string {
  if (!startDateStr) return `Day ${dayIndex}`;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return `Day ${dayIndex}`;
  const targetDate = new Date(start);
  targetDate.setDate(targetDate.getDate() + (dayIndex - 1));

  const month = targetDate.getMonth() + 1;
  const date = targetDate.getDate();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][targetDate.getDay()];
  return `${month}월 ${date}일 (${dayOfWeek})`;
}

export function generateShareSummaryText(trip: TripPlan): string {
  const daysCount = calculateTripDays(trip.startDate, trip.endDate);
  const sorted = sortScheduleByTime(trip.schedule);
  const memberNames = trip.members.map((m) => m.name).join(', ');

  let output = `[가족여행 일정표] ${trip.title}\n`;
  output += `📍 여행지: ${trip.destination}\n`;
  output += `📅 기간: ${trip.startDate} ~ ${trip.endDate} (${daysCount - 1}박 ${daysCount}일)\n`;
  output += `👨‍👩‍👧‍👦 함께하는 가족: ${memberNames || '우리 가족'}\n`;
  output += `💰 총 예산: ${formatKRW(trip.totalBudget)}\n\n`;

  for (let d = 1; d <= daysCount; d++) {
    const dayDate = getDayDateString(trip.startDate, d);
    output += `━━━━━━━━━━━━━━━━━━━━\n`;
    output += `📌 Day ${d} [${dayDate}]\n`;
    const dayItems = sorted.filter((item) => item.dayIndex === d);
    if (dayItems.length === 0) {
      output += `  (등록된 일정이 없습니다)\n`;
    } else {
      dayItems.forEach((item) => {
        output += `  ⏱ ${item.time || '시간미정'} | ${item.title}\n`;
        if (item.location) output += `    📍 장소: ${item.location}\n`;
        if (item.familyTips) output += `    💡 팁: ${item.familyTips}\n`;
      });
    }
    output += `\n`;
  }

  output += `✨ 가족여행 플래너로 작성된 일정입니다.`;
  return output;
}

/**
 * Encode trip plan into URL hash for direct 1-click sharing to family members
 */
export function encodeTripToHash(trip: TripPlan): string {
  try {
    const jsonStr = JSON.stringify(trip);
    // Base64 UTF-8 encode
    const base64 = btoa(encodeURIComponent(jsonStr));
    return base64;
  } catch (e) {
    console.error('Failed to encode trip:', e);
    return '';
  }
}

export function decodeTripFromHash(hash: string): TripPlan | null {
  try {
    if (!hash || hash.length < 5) return null;
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const jsonStr = decodeURIComponent(atob(cleanHash));
    const parsed = JSON.parse(jsonStr);
    if (parsed && parsed.id && parsed.title && Array.isArray(parsed.schedule)) {
      return parsed as TripPlan;
    }
    return null;
  } catch (e) {
    console.error('Failed to decode trip hash:', e);
    return null;
  }
}
