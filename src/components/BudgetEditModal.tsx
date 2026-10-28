import React, { useState, useEffect } from 'react';
import { Wallet, Check, AlertCircle } from 'lucide-react';
import { formatKRW } from '../utils/itinerary';

interface BudgetEditModalProps {
  currentBudget: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newBudget: number) => void;
}

export const BudgetEditModal: React.FC<BudgetEditModalProps> = ({
  currentBudget,
  isOpen,
  onClose,
  onSave,
}) => {
  const [budgetInput, setBudgetInput] = useState(String(currentBudget));
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBudgetInput(String(currentBudget));
      setError('');
    }
  }, [isOpen, currentBudget]);

  if (!isOpen) return null;

  const numericValue = parseInt(budgetInput.replace(/[^0-9]/g, ''), 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericValue <= 0) {
      setError('0원보다 큰 유효한 예산을 입력해주세요.');
      return;
    }
    onSave(numericValue);
    onClose();
  };

  const handleAddAmount = (delta: number) => {
    const next = numericValue + delta;
    setBudgetInput(String(next));
    setError('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">총 여행 예산 수정</h3>
              <p className="text-[11px] text-slate-500">여행 총 예산을 변경합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                새 총 예산 (원)
              </label>
              {numericValue > 0 && (
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {formatKRW(numericValue)}
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="1"
              value={budgetInput}
              onChange={(e) => {
                setBudgetInput(e.target.value);
                setError('');
              }}
              required
              autoFocus
              className="w-full text-sm font-mono font-bold px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />

            {/* Quick addition preset buttons */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {[100000, 300000, 500000, 1000000].map((quick) => (
                <button
                  type="button"
                  key={quick}
                  onClick={() => handleAddAmount(quick)}
                  className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                >
                  +{quick >= 10000 ? `${quick / 10000}만원` : `${quick}원`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setBudgetInput('0')}
                className="px-2 py-1 text-xs font-medium text-slate-400 hover:text-rose-600 rounded-md transition-colors ml-auto"
              >
                초기화
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>예산 변경 적용</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
