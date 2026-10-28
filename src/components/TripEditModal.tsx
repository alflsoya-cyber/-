import React, { useState } from 'react';
import { TripPlan } from '../types/trip';

interface TripEditModalProps {
  trip: TripPlan;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TripPlan) => void;
  onSelectPresetTemplate: (presetKey: string) => void;
}

export const TripEditModal: React.FC<TripEditModalProps> = ({
  trip,
  isOpen,
  onClose,
  onSave,
  onSelectPresetTemplate,
}) => {
  const [title, setTitle] = useState(trip.title);
  const [destination, setDestination] = useState(trip.destination);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [totalBudget, setTotalBudget] = useState(String(trip.totalBudget));
  const [notes, setNotes] = useState(trip.notes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseInt(totalBudget.replace(/[^0-9]/g, ''), 10) || 0;
    onSave({
      ...trip,
      title: title.trim() || '우리 가족 여행',
      destination: destination.trim() || '국내 여행',
      startDate,
      endDate,
      totalBudget: budgetNum,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">여행 기본 정보 설정</h3>
            <p className="text-xs text-slate-500">여행지, 일정 및 총 예산을 설정합니다.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 text-lg leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Quick Presets */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
          <p className="text-xs font-bold text-slate-700">인기 추천 여행지 템플릿</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => onSelectPresetTemplate('jeju')}
              className="px-2.5 py-1.5 text-left bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors font-medium text-slate-800"
            >
              🍊 제주도 3박 4일
            </button>
            <button
              type="button"
              onClick={() => onSelectPresetTemplate('gangwon')}
              className="px-2.5 py-1.5 text-left bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors font-medium text-slate-800"
            >
              🌊 강원 동해안 2박 3일
            </button>
            <button
              type="button"
              onClick={() => onSelectPresetTemplate('osaka')}
              className="px-2.5 py-1.5 text-left bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors font-medium text-slate-800"
            >
              🗾 오사카/교토 3박 4일
            </button>
            <button
              type="button"
              onClick={() => onSelectPresetTemplate('empty')}
              className="px-2.5 py-1.5 text-left bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors font-medium text-slate-800"
            >
              ✨ 새로 시작하기 (빈 일정)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              여행 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              여행지 / 목적지 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              총 여행 예산 (원)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              여행 안내 및 유의사항 메모
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="예: 어르신 휴식 위주, 하루 2곳 이내 이동"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              설정 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
