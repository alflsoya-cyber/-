import React from 'react';
import { Compass, Share2, Sparkles, PlusCircle } from 'lucide-react';

interface TopNavProps {
  activeTab: 'itinerary' | 'budget' | 'family' | 'print';
  setActiveTab: (tab: 'itinerary' | 'budget' | 'family' | 'print') => void;
  onOpenShare: () => void;
  onOpenAi: () => void;
  onNewTrip: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenShare,
  onOpenAi,
  onNewTrip,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('itinerary');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors"
            >
              우리 가족 여행 플래너
            </a>
          </div>

          {/* Zone 2: 4 clean single-line nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
                activeTab === 'itinerary'
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                  : 'hover:text-slate-900'
              }`}
            >
              일정 계획
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
                activeTab === 'budget'
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                  : 'hover:text-slate-900'
              }`}
            >
              예산 및 정산
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
                activeTab === 'family'
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                  : 'hover:text-slate-900'
              }`}
            >
              가족 및 준비물
            </button>
            <button
              onClick={() => setActiveTab('print')}
              className={`whitespace-nowrap shrink-0 py-1 transition-colors ${
                activeTab === 'print'
                  ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
                  : 'hover:text-slate-900'
              }`}
            >
              일정 요약·인쇄
            </button>
            <button
              onClick={onOpenAi}
              className="flex items-center gap-1.5 text-indigo-700 hover:text-indigo-800 transition-colors whitespace-nowrap shrink-0"
              title="AI 가족 맞춤 장소 및 코스 추천"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>AI 여행 도우미</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNewTrip}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="새 여행 만들기 또는 여행지 변경"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>새 여행</span>
            </button>
            <button
              onClick={onOpenShare}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm whitespace-nowrap shrink-0"
              aria-label="가족에게 일정 공유하기"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>일정 공유하기</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2.5 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`px-3 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'itinerary' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            일정 계획
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-3 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'budget' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            예산 및 정산
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`px-3 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'family' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            가족/준비물
          </button>
          <button
            onClick={() => setActiveTab('print')}
            className={`px-3 py-1 rounded-md whitespace-nowrap ${
              activeTab === 'print' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600'
            }`}
          >
            인쇄/요약
          </button>
          <button
            onClick={onOpenAi}
            className="px-2 py-1 text-indigo-600 font-medium whitespace-nowrap flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            AI 추천
          </button>
        </div>
      </div>
    </header>
  );
};
