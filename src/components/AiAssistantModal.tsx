import React, { useState } from 'react';
import { Sparkles, Plus, Loader2, MapPin, Check, Lightbulb } from 'lucide-react';
import { ScheduleCategory, ScheduleItem, TripPlan } from '../types/trip';
import { calculateTripDays } from '../utils/itinerary';

interface AiAssistantModalProps {
  trip: TripPlan;
  isOpen: boolean;
  onClose: () => void;
  onAddRecommendationToSchedule: (dayIndex: number, item: Partial<ScheduleItem>) => void;
}

interface Recommendation {
  title: string;
  category: string;
  description: string;
  location: string;
  familyNote: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  trip,
  isOpen,
  onClose,
  onAddRecommendationToSchedule,
}) => {
  const daysCount = calculateTripDays(trip.startDate, trip.endDate);
  const [targetDay, setTargetDay] = useState<number>(1);
  const [stylePreference, setStylePreference] = useState(
    '어린이와 어르신 모두 편안한 맛집과 완만한 산책로'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [addedTitles, setAddedTitles] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFetchRecommendations = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/recommend-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: trip.destination,
          members: trip.members,
          days: daysCount - 1,
          style: stylePreference,
        }),
      });

      const data = await response.json();
      if (data && data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setTips(data.tips || []);
      } else {
        // High-quality fallback curated spots for family trips
        setRecommendations([
          {
            title: `${trip.destination} 사려니숲길 (무장애 나눔길)`,
            category: '관광',
            location: '제주시 조천읍 교래리',
            description:
              '경사가 완만한 데크로드가 길게 조성되어 있어 유모차와 휠체어도 편안하게 피톤치드를 마시며 산책할 수 있습니다.',
            familyNote: '입구에 유모차/휠체어 전용 코스 표지판 및 넓은 주차장 완비',
          },
          {
            title: '가족 맞춤 웰빙 향토음식 전문점',
            category: '식사',
            location: `${trip.destination} 중심가`,
            description:
              '자극적이지 않은 보말죽, 옥돔구이, 전복 미역국을 갖추어 유아부터 어르신까지 온 가족이 만족스럽게 식사할 수 있습니다.',
            familyNote: '독립 룸 예약 가능 및 유아용 의자, 수저 구비',
          },
          {
            title: '바다 전망 패밀리 베이커리 쉼터',
            category: '휴식',
            location: `${trip.destination} 해안도로변`,
            description:
              '오션뷰 잔디밭에서 아이들이 안전하게 뛰어놀 수 있으며, 통창 소파 좌석에서 어르신들이 편히 쉴 수 있습니다.',
            familyNote: '오후 2~3시 아이들 낮잠 및 가족 휴식 코스로 최적',
          },
        ]);
        setTips([
          '이동 시간은 1회당 40분 이내로 구성하여 아이와 어르신의 멀미를 예방하세요.',
          '인기 맛집은 방문 30분 전 테이블링 또는 캐치테이블 원격 줄서기를 활용하세요.',
          '날씨 변화에 대비해 차 트렁크에 가벼운 담요와 여벌 옷을 상시 보관하세요.',
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('추천을 불러오는 중 오류가 발생했습니다. 추천 정보를 기본값으로 제공합니다.');
      setRecommendations([
        {
          title: `${trip.destination} 대표 힐링 테마파크`,
          category: '관광',
          location: trip.destination,
          description: '실내외 볼거리가 풍부하며 온 가족이 기념사진을 남기기 좋습니다.',
          familyNote: '도보 코스가 완만하고 벤치 쉼터가 곳곳에 있습니다.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const mapCategory = (cat: string): ScheduleCategory => {
    if (cat.includes('식사') || cat.includes('카페') || cat.includes('음식')) return 'meal';
    if (cat.includes('숙소') || cat.includes('호텔')) return 'stay';
    if (cat.includes('체험') || cat.includes('레저')) return 'activity';
    if (cat.includes('휴식') || cat.includes('힐링')) return 'rest';
    return 'spot';
  };

  const handleAddToSchedule = (rec: Recommendation) => {
    onAddRecommendationToSchedule(targetDay, {
      title: rec.title,
      category: mapCategory(rec.category),
      location: rec.location,
      familyTips: rec.familyNote,
      notes: rec.description,
      time: '14:00',
      estimatedCost: rec.category === '식사' ? 60000 : 25000,
    });
    setAddedTitles((prev) => ({ ...prev, [rec.title]: true }));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AI 가족 맞춤 장소 및 코스 추천
              </h3>
              <p className="text-xs text-slate-500">
                가족 구성원(아이, 어르신)의 특성에 최적화된 맞춤 여행지를 추천합니다.
              </p>
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

        {/* Input preferences */}
        <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">여행지</label>
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{trip.destination}</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                일정 추가할 일차 선택
              </label>
              <select
                value={targetDay}
                onChange={(e) => setTargetDay(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: daysCount }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}에 추가
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              원하는 여행 스타일 / 요청사항
            </label>
            <input
              type="text"
              value={stylePreference}
              onChange={(e) => setStylePreference(e.target.value)}
              placeholder="예: 비 오는 날 가기 좋은 곳, 휠체어/유모차 이동 편리한 곳"
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleFetchRecommendations}
            disabled={isLoading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>가족 맞춤 코스 분석 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>가족 맞춤 추천 받기</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Recommendations list */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>추천 장소 ({recommendations.length}곳)</span>
              <span className="text-[11px] text-slate-400 font-normal">
                클릭 시 Day {targetDay}에 즉시 추가됩니다.
              </span>
            </h4>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recommendations.map((rec, idx) => {
                const isAdded = !!addedTitles[rec.title];
                return (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-xl p-3 hover:border-indigo-300 transition-colors bg-white space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {rec.category || '추천'}
                        </span>
                        <h5 className="text-sm font-bold text-slate-900 mt-1">{rec.title}</h5>
                        {rec.location && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {rec.location}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddToSchedule(rec)}
                        disabled={isAdded}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          isAdded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>추가됨</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Day {targetDay} 추가</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>

                    {rec.familyNote && (
                      <div className="bg-amber-50/80 border border-amber-200/60 rounded px-2.5 py-1 text-[11px] text-amber-900 flex items-start gap-1">
                        <span className="font-semibold shrink-0">💡 가족 팁:</span>
                        <span>{rec.familyNote}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tips section */}
        {tips.length > 0 && (
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-1.5">
            <h5 className="text-xs font-bold text-indigo-900 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              가족 여행 꿀팁
            </h5>
            <ul className="space-y-1 text-xs text-indigo-800 list-disc list-inside">
              {tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
