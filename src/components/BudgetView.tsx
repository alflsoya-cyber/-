import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  CreditCard,
  ArrowRight,
  PieChart,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
} from 'lucide-react';
import { ExpenseCategory, ExpenseItem, TripPlan } from '../types/trip';
import {
  calculateBudgetSummary,
  calculateSettlement,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from '../utils/budget';
import { formatKRW } from '../utils/itinerary';

interface BudgetViewProps {
  trip: TripPlan;
  onUpdateTrip: (updated: TripPlan) => void;
  onOpenEditBudget?: () => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  trip,
  onUpdateTrip,
  onOpenEditBudget,
}) => {
  const summary = calculateBudgetSummary(trip.totalBudget, trip.expenses);
  const settlement = calculateSettlement(trip.members, trip.expenses);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);

  // Form states
  const [formDate, setFormDate] = useState(trip.startDate || new Date().toISOString().split('T')[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('food');
  const [formAmount, setFormAmount] = useState('');
  const [formPayerId, setFormPayerId] = useState(trip.members[0]?.id || '');
  const [formSplitMemberIds, setFormSplitMemberIds] = useState<string[]>(
    trip.members.map((m) => m.id)
  );
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingExpense(null);
    setFormDate(trip.startDate || new Date().toISOString().split('T')[0]);
    setFormTitle('');
    setFormCategory('food');
    setFormAmount('');
    setFormPayerId(trip.members[0]?.id || '');
    setFormSplitMemberIds(trip.members.map((m) => m.id));
    setFormNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExpenseItem) => {
    setEditingExpense(item);
    setFormDate(item.date);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormAmount(String(item.amount));
    setFormPayerId(item.payerId);
    setFormSplitMemberIds(
      item.splitMemberIds && item.splitMemberIds.length > 0
        ? item.splitMemberIds
        : trip.members.map((m) => m.id)
    );
    setFormNotes(item.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('지출 내역명을 입력해주세요.');
      return;
    }
    const amt = parseInt(formAmount.replace(/[^0-9]/g, ''), 10);
    if (!amt || amt <= 0) {
      setFormError('유효한 지출 금액을 입력해주세요.');
      return;
    }
    if (!formPayerId) {
      setFormError('결제한 가족 멤버를 선택해주세요.');
      return;
    }

    if (editingExpense) {
      const updatedExpenses = trip.expenses.map((exp) =>
        exp.id === editingExpense.id
          ? {
              ...exp,
              date: formDate,
              title: formTitle.trim(),
              category: formCategory,
              amount: amt,
              payerId: formPayerId,
              splitMemberIds: formSplitMemberIds,
              notes: formNotes.trim(),
            }
          : exp
      );
      onUpdateTrip({ ...trip, expenses: updatedExpenses });
    } else {
      const newExp: ExpenseItem = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        date: formDate,
        dayIndex: 1,
        title: formTitle.trim(),
        category: formCategory,
        amount: amt,
        payerId: formPayerId,
        splitType: 'equal',
        splitMemberIds: formSplitMemberIds,
        notes: formNotes.trim(),
      };
      onUpdateTrip({ ...trip, expenses: [...trip.expenses, newExp] });
    }

    setIsModalOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('이 지출 내역을 삭제하시겠습니까?')) {
      const updated = trip.expenses.filter((exp) => exp.id !== id);
      onUpdateTrip({ ...trip, expenses: updated });
    }
  };

  const filteredExpenses = trip.expenses.filter((exp) => {
    const matchesCat = selectedCategory === 'all' || exp.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Budget Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-indigo-600" />
                설정된 총 예산
              </span>
              {onOpenEditBudget && (
                <button
                  type="button"
                  onClick={onOpenEditBudget}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  title="총 예산 수정하기"
                  aria-label="총 예산 수정하기"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>예산 수정</span>
                </button>
              )}
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {formatKRW(summary.totalBudget)}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              가족 {trip.members.length}인 여행 기준
            </p>
          </div>
        </div>

        {/* Spent Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>현재 총 지출액</span>
            <CreditCard className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {formatKRW(summary.totalSpent)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  summary.percentUsed > 90
                    ? 'bg-rose-500'
                    : summary.percentUsed > 70
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, summary.percentUsed)}%` }}
              />
            </div>
            <span className="text-xs font-mono font-semibold text-slate-700">
              {summary.percentUsed}%
            </span>
          </div>
        </div>

        {/* Remaining / Overspent Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>{summary.remainingBudget >= 0 ? '잔여 예산' : '예산 초과분'}</span>
            <PieChart
              className={`w-4 h-4 ${
                summary.remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
          </div>
          <p
            className={`text-2xl font-bold font-mono tabular-nums ${
              summary.remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatKRW(Math.abs(summary.remainingBudget))}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {summary.remainingBudget >= 0
              ? '계획 내에서 안정적으로 지출 중입니다'
              : '예산을 초과했습니다. 지출을 점검해보세요'}
          </p>
        </div>
      </div>

      {/* Category Breakdown & Settlement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">항목별 지출 분포</h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              총 {trip.expenses.length}건
            </span>
          </div>

          <div className="space-y-3">
            {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => {
              const data = summary.categoryBreakdown[cat] || {
                amount: 0,
                percentage: 0,
                count: 0,
              };
              if (data.amount === 0 && summary.totalSpent > 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                      />
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({data.count}건)
                      </span>
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {formatKRW(data.amount)}
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 text-[11px] w-8 text-right">
                        {data.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${data.percentage}%`,
                        backgroundColor: CATEGORY_COLORS[cat],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Family Settlement Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">가족 구성원별 정산 현황</h3>
            <span className="text-xs text-indigo-600 font-medium">자동 1/N 정산 계산</span>
          </div>

          {/* Member balances list */}
          <div className="space-y-2">
            {settlement.balances.map((b) => (
              <div
                key={b.memberId}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{b.memberName}</span>
                  <span className="text-slate-400 font-mono tabular-nums">
                    (결제: {formatKRW(b.totalPaid)})
                  </span>
                </div>
                <div className="text-right">
                  {b.netBalance > 0 ? (
                    <span className="font-mono tabular-nums font-bold text-emerald-600">
                      +{formatKRW(b.netBalance)} 환급
                    </span>
                  ) : b.netBalance < 0 ? (
                    <span className="font-mono tabular-nums font-bold text-rose-600">
                      -{formatKRW(Math.abs(b.netBalance))} 송금 필요
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">정산 완료</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Transfers suggestions */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">추천 송금 방법</p>
            {settlement.transfers.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>모든 가족 구성원의 지출 정산이 완벽하게 일치합니다!</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {settlement.transfers.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-indigo-50/70 border border-indigo-100/80 px-3 py-2 rounded-lg"
                  >
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <span className="text-rose-600 font-semibold">{t.fromName}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-emerald-700 font-semibold">{t.toName}</span>
                    </div>
                    <span className="font-mono tabular-nums font-bold text-indigo-700">
                      {formatKRW(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense Ledger Header & Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">지출 상세 내역</h3>
            <p className="text-xs text-slate-500">
              여행 중 발생한 모든 지출 영수증 및 결제 내역
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap shrink-0"
            aria-label="지출 기록 추가하기"
          >
            <Plus className="w-4 h-4" />
            <span>지출 기록 추가</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="지출 항목 또는 메모 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              전체
            </button>
            {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              등록된 지출 내역이 없습니다.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200/80 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">날짜</th>
                  <th className="py-2.5 px-3">내역</th>
                  <th className="py-2.5 px-3">분류</th>
                  <th className="py-2.5 px-3">결제자</th>
                  <th className="py-2.5 px-3 text-right">금액</th>
                  <th className="py-2.5 px-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const payer = trip.members.find((m) => m.id === exp.payerId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900">{exp.title}</p>
                        {exp.notes && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</p>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}
                          />
                          {CATEGORY_LABELS[exp.category] || exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: payer?.color || '#94a3b8' }}
                          />
                          <span className="font-medium text-slate-800">
                            {payer?.name || '공금'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 text-sm whitespace-nowrap">
                        {formatKRW(exp.amount)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="수정"
                            aria-label="수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="삭제"
                            aria-label="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingExpense ? '지출 내역 수정' : '새 지출 기록'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    결제 날짜
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">분류</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  지출 항목명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 흑돼지 근고기 저녁 식사, 카페 음료"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    결제 금액 (원) <span className="text-rose-500">*</span>
                  </label>
                  {formAmount && parseInt(formAmount.replace(/[^0-9]/g, ''), 10) > 0 && (
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {formatKRW(parseInt(formAmount.replace(/[^0-9]/g, ''), 10))}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-sm"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {[10000, 50000, 100000, 500000].map((quickAmt) => (
                    <button
                      type="button"
                      key={quickAmt}
                      onClick={() => {
                        const current = parseInt(formAmount.replace(/[^0-9]/g, ''), 10) || 0;
                        setFormAmount(String(current + quickAmt));
                      }}
                      className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                    >
                      +{quickAmt >= 10000 ? `${quickAmt / 10000}만` : `${quickAmt}원`}
                    </button>
                  ))}
                  {formAmount && (
                    <button
                      type="button"
                      onClick={() => setFormAmount('')}
                      className="px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-rose-600 rounded transition-colors ml-auto"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  누가 결제했나요? (결제자) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formPayerId}
                  onChange={(e) => setFormPayerId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {trip.members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  정산 대상 가족 (함께 부담할 사람)
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {trip.members.map((member) => {
                    const isChecked = formSplitMemberIds.includes(member.id);
                    return (
                      <button
                        type="button"
                        key={member.id}
                        onClick={() => {
                          if (isChecked) {
                            if (formSplitMemberIds.length > 1) {
                              setFormSplitMemberIds(
                                formSplitMemberIds.filter((id) => id !== member.id)
                              );
                            }
                          } else {
                            setFormSplitMemberIds([...formSplitMemberIds, member.id]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        {member.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  메모 (선택)
                </label>
                <input
                  type="text"
                  placeholder="영수증 정보, 카드 혜택 등"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingExpense ? '수정 완료' : '지출 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
