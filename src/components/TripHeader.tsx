import React from 'react';
import { Calendar, MapPin, Users, Edit3, Wallet, Check } from 'lucide-react';
import { TripPlan } from '../types/trip';
import { calculateTripDays, formatKRW } from '../utils/itinerary';
import { calculateBudgetSummary } from '../utils/budget';

interface TripHeaderProps {
  trip: TripPlan;
  onEditTrip: () => void;
  onEditBudget?: () => void;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  trip,
  onEditTrip,
  onEditBudget,
}) => {
  const daysCount = calculateTripDays(trip.startDate, trip.endDate);
  const budgetSummary = calculateBudgetSummary(trip.totalBudget, trip.expenses);

  return (
    <div className="bg-white border-b border-slate-200 py-6 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Main Title & Metadata Zone */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                {trip.destination}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {trip.startDate} ~ {trip.endDate} ({daysCount - 1}박 {daysCount}일)
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                가족 {trip.members.length}명
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold text-[11px]">
                <Check className="w-3 h-3 text-emerald-600" />
                가족 공유 동기화됨
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                {trip.title}
              </h1>
              <button
                onClick={onEditTrip}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="여행 제목 및 정보 수정"
                aria-label="여행 정보 수정"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {/* Family Members summary chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {trip.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100/90 hover:bg-slate-200/90 px-2.5 py-1 rounded-full transition-colors"
                  title={member.notes || member.name}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: member.color }}
                  />
                  <span className="font-medium">{member.name}</span>
                  {member.ageGroup === 'senior' && (
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1 rounded font-semibold">
                      어르신
                    </span>
                  )}
                  {member.ageGroup === 'infant' && (
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded font-semibold">
                      유아
                    </span>
                  )}
                  {member.ageGroup === 'child' && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded font-semibold">
                      어린이
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Budget Summary Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[300px] sm:min-w-[340px] shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                예산 집행률
              </span>
              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {budgetSummary.percentUsed}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${
                  budgetSummary.percentUsed > 90
                    ? 'bg-rose-500'
                    : budgetSummary.percentUsed > 70
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, budgetSummary.percentUsed)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-200/80 pt-2.5">
              <div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span>총 예산</span>
                  {onEditBudget && (
                    <button
                      type="button"
                      onClick={onEditBudget}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      title="총 예산 수정하기"
                      aria-label="총 예산 수정하기"
                    >
                      수정
                    </button>
                  )}
                </div>
                <p className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                  {formatKRW(budgetSummary.totalBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-500">
                  {budgetSummary.remainingBudget >= 0 ? '남은 예산' : '예산 초과'}
                </p>
                <p
                  className={`font-mono tabular-nums font-bold text-sm ${
                    budgetSummary.remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {formatKRW(Math.abs(budgetSummary.remainingBudget))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
