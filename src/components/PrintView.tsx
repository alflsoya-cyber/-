import React from 'react';
import { Printer, ArrowLeft, Calendar, MapPin, Users, PhoneCall } from 'lucide-react';
import { TripPlan } from '../types/trip';
import { calculateTripDays, formatKRW, getDayDateString, sortScheduleByTime } from '../utils/itinerary';
import { calculateBudgetSummary, calculateSettlement } from '../utils/budget';

interface PrintViewProps {
  trip: TripPlan;
  onBack: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({ trip, onBack }) => {
  const daysCount = calculateTripDays(trip.startDate, trip.endDate);
  const sortedSchedule = sortScheduleByTime(trip.schedule);
  const budgetSummary = calculateBudgetSummary(trip.totalBudget, trip.expenses);
  const settlement = calculateSettlement(trip.members, trip.expenses);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (hidden on print) */}
      <div className="no-print bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>플래너 화면으로 돌아가기</span>
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>인쇄하기 / PDF 저장</span>
        </button>
      </div>

      {/* Printable Sheet Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0 space-y-8">
        {/* Header Document Section */}
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">
                Family Trip Itinerary Sheet
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {trip.title}
              </h1>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-semibold text-slate-800">우리 가족 여행 계획서</p>
              <p>인쇄일: {new Date().toLocaleDateString('ko-KR')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">여행지</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                {trip.destination}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">여행 기간</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                {trip.startDate} ~ {trip.endDate} ({daysCount - 1}박 {daysCount}일)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">동행 가족</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                {trip.members.map((m) => m.name).join(', ')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">총 예산</span>
              <span className="font-bold font-mono text-slate-900">
                {formatKRW(trip.totalBudget)}
              </span>
            </div>
          </div>

          {trip.notes && (
            <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700">
              <span className="font-bold text-slate-900">여행 안내 및 메모: </span>
              {trip.notes}
            </div>
          )}
        </div>

        {/* Day-by-Day Schedule Table */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
            일자별 상세 일정
          </h2>

          {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => {
            const dateStr = getDayDateString(trip.startDate, day);
            const dayItems = sortedSchedule.filter((it) => it.dayIndex === day);

            return (
              <div key={day} className="page-break-inside-avoid space-y-2">
                <div className="bg-slate-100/80 px-3 py-1.5 rounded-lg flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Day {day} — {dateStr}</span>
                  <span className="text-slate-500 font-normal">총 {dayItems.length}개 일정</span>
                </div>

                {dayItems.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2 pl-3">
                    등록된 일정이 없습니다.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs border border-slate-200">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2 px-3 w-20">시간</th>
                        <th className="py-2 px-3 w-48">일정명</th>
                        <th className="py-2 px-3">위치 / 주소</th>
                        <th className="py-2 px-3">가족 편의 팁 & 메모</th>
                        <th className="py-2 px-3 text-right w-24">예상비용</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dayItems.map((item) => (
                        <tr key={item.id} className="align-top">
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                            {item.time || '시간미정'}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.title}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.location || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.familyTips && (
                              <p className="text-amber-800 font-medium">
                                💡 {item.familyTips}
                              </p>
                            )}
                            {item.notes && <p className="text-slate-500">{item.notes}</p>}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                            {item.estimatedCost > 0 ? formatKRW(item.estimatedCost) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>

        {/* Budget & Settlement Summary Sheet */}
        <div className="page-break-inside-avoid space-y-4 border-t-2 border-slate-200 pt-6">
          <h2 className="text-lg font-bold text-slate-900">
            예산 및 가족 정산 요약
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 rounded-xl p-3 space-y-1.5">
              <p className="font-bold text-slate-800">예산 집행 내역</p>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">총 예산:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatKRW(budgetSummary.totalBudget)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">현재 총 지출:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatKRW(budgetSummary.totalSpent)} ({budgetSummary.percentUsed}%)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">잔여 예산:</span>
                <span
                  className={`font-mono font-bold ${
                    budgetSummary.remainingBudget >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {formatKRW(budgetSummary.remainingBudget)}
                </span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 space-y-1.5">
              <p className="font-bold text-slate-800">추천 정산 송금 내역</p>
              {settlement.transfers.length === 0 ? (
                <p className="text-slate-400 py-2">별도 송금 정산 내역이 없습니다.</p>
              ) : (
                settlement.transfers.map((t, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-700">
                      {t.fromName} → {t.toName}
                    </span>
                    <span className="font-mono font-bold text-indigo-700">
                      {formatKRW(t.amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Emergency notes */}
        <div className="text-center text-[11px] text-slate-400 pt-4 border-t border-slate-100">
          가족과 함께하는 행복하고 안전한 여행 되세요! · 가족여행 플래너
        </div>
      </div>
    </div>
  );
};
