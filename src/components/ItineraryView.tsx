import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  Circle,
  ExternalLink,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Info,
  Utensils,
  Hotel,
  Car,
  Camera,
  Coffee,
  HeartHandshake,
} from 'lucide-react';
import { ScheduleCategory, ScheduleItem, TripPlan } from '../types/trip';
import { calculateTripDays, formatKRW, getDayDateString, sortScheduleByTime } from '../utils/itinerary';

interface ItineraryViewProps {
  trip: TripPlan;
  onUpdateTrip: (updated: TripPlan) => void;
  onOpenAddExpenseWithSchedule?: (item: ScheduleItem) => void;
}

const CATEGORY_MAP: Record<
  ScheduleCategory,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  spot: { label: '관광/명소', icon: Camera, color: 'text-indigo-600 bg-indigo-50' },
  meal: { label: '식사/카페', icon: Utensils, color: 'text-orange-600 bg-orange-50' },
  stay: { label: '숙소/체크인', icon: Hotel, color: 'text-purple-600 bg-purple-50' },
  transport: { label: '이동/교통', icon: Car, color: 'text-sky-600 bg-sky-50' },
  activity: { label: '체험/레저', icon: HeartHandshake, color: 'text-emerald-600 bg-emerald-50' },
  rest: { label: '휴식/자유시간', icon: Coffee, color: 'text-amber-600 bg-amber-50' },
};

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  trip,
  onUpdateTrip,
}) => {
  const daysCount = calculateTripDays(trip.startDate, trip.endDate);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Form states for Add / Edit Modal
  const [formTime, setFormTime] = useState('10:00');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ScheduleCategory>('spot');
  const [formLocation, setFormLocation] = useState('');
  const [formEstimatedCost, setFormEstimatedCost] = useState('0');
  const [formFamilyTips, setFormFamilyTips] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAssignedMembers, setFormAssignedMembers] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const currentDayItems = sortScheduleByTime(
    trip.schedule.filter((item) => item.dayIndex === selectedDay)
  );

  const filteredItems = currentDayItems.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormTime('10:00');
    setFormTitle('');
    setFormCategory('spot');
    setFormLocation('');
    setFormEstimatedCost('0');
    setFormFamilyTips('');
    setFormNotes('');
    setFormAssignedMembers(trip.members.map((m) => m.id));
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setFormTime(item.time || '10:00');
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormLocation(item.location || '');
    setFormEstimatedCost(item.estimatedCost ? String(item.estimatedCost) : '0');
    setFormFamilyTips(item.familyTips || '');
    setFormNotes(item.notes || '');
    setFormAssignedMembers(item.assignedMembers || trip.members.map((m) => m.id));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('일정 제목 또는 장소명을 입력해주세요.');
      return;
    }

    const cost = parseInt(formEstimatedCost.replace(/[^0-9]/g, ''), 10) || 0;

    if (editingItem) {
      // Update existing item
      const updatedSchedule = trip.schedule.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              dayIndex: selectedDay,
              time: formTime,
              title: formTitle.trim(),
              category: formCategory,
              location: formLocation.trim(),
              estimatedCost: cost,
              familyTips: formFamilyTips.trim(),
              notes: formNotes.trim(),
              assignedMembers: formAssignedMembers,
            }
          : it
      );
      onUpdateTrip({ ...trip, schedule: updatedSchedule });
    } else {
      // Add new item
      const newItem: ScheduleItem = {
        id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        dayIndex: selectedDay,
        time: formTime,
        title: formTitle.trim(),
        category: formCategory,
        location: formLocation.trim(),
        estimatedCost: cost,
        familyTips: formFamilyTips.trim(),
        notes: formNotes.trim(),
        isCompleted: false,
        assignedMembers: formAssignedMembers,
      };
      onUpdateTrip({ ...trip, schedule: [...trip.schedule, newItem] });
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('이 일정을 삭제하시겠습니까?')) {
      const updated = trip.schedule.filter((it) => it.id !== id);
      onUpdateTrip({ ...trip, schedule: updated });
    }
  };

  const handleToggleComplete = (id: string) => {
    const updated = trip.schedule.map((it) =>
      it.id === id ? { ...it, isCompleted: !it.isCompleted } : it
    );
    onUpdateTrip({ ...trip, schedule: updated });
  };

  const handleMoveItemTime = (item: ScheduleItem, deltaHours: number) => {
    const [h, m] = (item.time || '12:00').split(':').map(Number);
    let newH = Math.max(6, Math.min(23, h + deltaHours));
    const newTime = `${String(newH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
    const updated = trip.schedule.map((it) => (it.id === item.id ? { ...it, time: newTime } : it));
    onUpdateTrip({ ...trip, schedule: updated });
  };

  // Pace Assessment
  const itemCount = currentDayItems.length;
  let paceStatus = {
    badge: '여유로움',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    description: '아이와 어르신이 무리 없이 편안하게 즐길 수 있는 추천 코스입니다.',
  };
  if (itemCount >= 4 && itemCount <= 5) {
    paceStatus = {
      badge: '약간 알참',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
      description: '일정이 조금 차 있으니 중간에 카페 휴식 및 이동 시간을 넉넉히 두세요.',
    };
  } else if (itemCount >= 6) {
    paceStatus = {
      badge: '빡빡함 주의',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      description: '가족 구성원이 피로할 수 있습니다. 1~2개 일정을 여유 시간으로 전환하는 것을 추천해요.',
    };
  }

  return (
    <div className="space-y-6">
      {/* Day Selector & Quick Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {Array.from({ length: daysCount }, (_, i) => i + 1).map((day) => {
              const isSelected = selectedDay === day;
              const dateStr = getDayDateString(trip.startDate, day);
              const countForDay = trip.schedule.filter((it) => it.dayIndex === day).length;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3.5 py-2 rounded-xl text-left transition-all whitespace-nowrap shrink-0 flex flex-col ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <span>Day {day}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                        isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {countForDay}
                    </span>
                  </div>
                  <span className={`text-[11px] ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {dateStr}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap shrink-0"
            aria-label="새 일정 추가하기"
          >
            <Plus className="w-4 h-4" />
            <span>Day {selectedDay} 일정 추가</span>
          </button>
        </div>

        {/* Category Filter & Family Pace Indicator */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3.5 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-slate-500 shrink-0 font-medium">분류 필터:</span>
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                filterCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 ({currentDayItems.length})
            </button>
            {Object.entries(CATEGORY_MAP).map(([key, info]) => {
              const count = currentDayItems.filter((it) => it.category === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setFilterCategory(key)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                    filterCategory === key
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {info.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Pace badge */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-medium ${paceStatus.color} shrink-0`}
            title={paceStatus.description}
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>가족 여행 피로도: {paceStatus.badge}</span>
            <span className="text-[11px] opacity-80 hidden lg:inline">({paceStatus.description})</span>
          </div>
        </div>
      </div>

      {/* Schedule Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              {filterCategory === 'all'
                ? `Day ${selectedDay}에 등록된 일정이 없습니다.`
                : '선택한 분류의 일정이 없습니다.'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              가족과 함께 방문할 맛집, 관광지, 숙소 또는 휴식 일정을 추가해보세요.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              첫 일정 추가하기
            </button>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.spot;
            const CategoryIcon = catInfo.icon;
            const mapQuery = encodeURIComponent(item.location || item.title);
            const mapUrl = `https://map.naver.com/v5/search/${mapQuery}`;

            return (
              <div
                key={item.id}
                className={`group bg-white border rounded-xl p-4 sm:p-5 transition-all shadow-sm ${
                  item.isCompleted
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : 'border-slate-200/90 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Checkbox + Time + Category + Title & Location */}
                  <div className="flex items-start gap-3.5">
                    {/* Toggle Visited */}
                    <button
                      onClick={() => handleToggleComplete(item.id)}
                      className="mt-1 text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                      title={item.isCompleted ? '방문 완료 취소' : '방문 완료 표시'}
                      aria-label={`${item.title} 방문 완료 상태 전환`}
                    >
                      {item.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>

                    {/* Time Box */}
                    <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-2.5 py-1 text-slate-700 shrink-0 font-mono text-xs tabular-nums font-semibold">
                      <Clock className="w-3 h-3 text-slate-400 mb-0.5" />
                      <span>{item.time || '10:00'}</span>
                    </div>

                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${catInfo.color}`}
                    >
                      <CategoryIcon className="w-4 h-4" />
                    </div>

                    {/* Title & Details */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">{catInfo.label}</span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <h4
                          className={`text-base font-bold text-slate-900 ${
                            item.isCompleted ? 'line-through text-slate-500' : ''
                          }`}
                        >
                          {item.title}
                        </h4>
                      </div>

                      {item.location && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 shrink-0 ml-1 font-medium hover:underline"
                            title="네이버 지도에서 위치 검색"
                          >
                            <span>지도 검색</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Family Care Tips (Crucial for kids & seniors) */}
                      {item.familyTips && (
                        <div className="bg-amber-50/80 border border-amber-200/70 rounded-lg px-3 py-1.5 text-xs text-amber-900 flex items-start gap-1.5 mt-1">
                          <span className="font-semibold shrink-0">💡 가족 팁:</span>
                          <span>{item.familyTips}</span>
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-xs text-slate-500 italic mt-0.5">{item.notes}</p>
                      )}

                      {/* Assigned Members */}
                      {item.assignedMembers && item.assignedMembers.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-500">
                          <span className="text-[11px]">참여:</span>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {item.assignedMembers.map((mId) => {
                              const member = trip.members.find((m) => m.id === mId);
                              if (!member) return null;
                              return (
                                <div
                                  key={mId}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white"
                                  style={{ backgroundColor: member.color }}
                                  title={member.name}
                                >
                                  {member.name.charAt(0)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Cost & Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400">예상 비용</p>
                      <p className="font-mono tabular-nums text-sm font-bold text-slate-800">
                        {item.estimatedCost > 0 ? formatKRW(item.estimatedCost) : '무료/기포함'}
                      </p>
                    </div>

                    {/* Adjust time / edit / delete */}
                    <div className="flex items-center gap-1 opacity-90 sm:opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveItemTime(item, -1)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="1시간 앞으로 이동"
                        aria-label="시간 앞당기기"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveItemTime(item, 1)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                        title="1시간 뒤로 이동"
                        aria-label="시간 늦추기"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="일정 수정"
                        aria-label="일정 수정"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="일정 삭제"
                        aria-label="일정 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Schedule Item Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? '일정 수정하기' : `Day ${selectedDay} 일정 추가`}
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

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    시간 (시:분)
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">분류</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ScheduleCategory)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {Object.entries(CATEGORY_MAP).map(([key, info]) => (
                      <option key={key} value={key}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  일정 제목 / 장소명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 섭지코지 산책, 자매국수 점심"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  위치 또는 상세 주소
                </label>
                <input
                  type="text"
                  placeholder="예: 제주시 탑동로 11길 6"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    예상 비용 (원)
                  </label>
                  {formEstimatedCost && parseInt(formEstimatedCost.replace(/[^0-9]/g, ''), 10) > 0 && (
                    <span className="text-xs font-mono font-bold text-indigo-600">
                      {formatKRW(parseInt(formEstimatedCost.replace(/[^0-9]/g, ''), 10))}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={formEstimatedCost}
                  onChange={(e) => setFormEstimatedCost(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {[10000, 30000, 50000, 100000].map((quickAmt) => (
                    <button
                      type="button"
                      key={quickAmt}
                      onClick={() => {
                        const current = parseInt(formEstimatedCost.replace(/[^0-9]/g, ''), 10) || 0;
                        setFormEstimatedCost(String(current + quickAmt));
                      }}
                      className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                    >
                      +{quickAmt >= 10000 ? `${quickAmt / 10000}만` : `${quickAmt}원`}
                    </button>
                  ))}
                  {formEstimatedCost && formEstimatedCost !== '0' && (
                    <button
                      type="button"
                      onClick={() => setFormEstimatedCost('0')}
                      className="px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-rose-600 rounded transition-colors ml-auto"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  💡 가족 맞춤 팁 (어린이/어르신 편의 사항)
                </label>
                <input
                  type="text"
                  placeholder="예: 유모차 대여 무료, 경사로 있음, 아기의자 완비"
                  value={formFamilyTips}
                  onChange={(e) => setFormFamilyTips(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  참여 가족 멤버
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {trip.members.map((member) => {
                    const isChecked = formAssignedMembers.includes(member.id);
                    return (
                      <button
                        type="button"
                        key={member.id}
                        onClick={() => {
                          if (isChecked) {
                            setFormAssignedMembers(
                              formAssignedMembers.filter((id) => id !== member.id)
                            );
                          } else {
                            setFormAssignedMembers([...formAssignedMembers, member.id]);
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
                  메모 / 추가 정보
                </label>
                <textarea
                  rows={2}
                  placeholder="예약 번호, 주차 팁 등"
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
                  {editingItem ? '수정 완료' : '일정 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
