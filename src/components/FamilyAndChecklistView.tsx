import React, { useState } from 'react';
import {
  Users,
  CheckSquare,
  Plus,
  Trash2,
  Check,
  Heart,
  Baby,
  Briefcase,
  Smartphone,
  Pill,
  ShieldAlert,
} from 'lucide-react';
import {
  FamilyMember,
  MemberAgeGroup,
  MemberRole,
  PackingCategory,
  PackingItem,
  TripPlan,
} from '../types/trip';

interface FamilyAndChecklistViewProps {
  trip: TripPlan;
  onUpdateTrip: (updated: TripPlan) => void;
}

const PACKING_CATEGORIES: Record<
  PackingCategory,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  essentials: { label: '필수 서류/지갑', icon: Briefcase },
  medicine: { label: '상비약/건강', icon: Pill },
  kids: { label: '어린이/유아', icon: Baby },
  seniors: { label: '어르신 배려', icon: Heart },
  clothing: { label: '의류/세면도구', icon: CheckSquare },
  electronics: { label: '전자기기/충전기', icon: Smartphone },
};

const ROLE_LABELS: Record<MemberRole, string> = {
  dad: '아빠',
  mom: '엄마',
  child: '자녀/아이',
  grandparent: '조부모/어르신',
  other: '가족/동반자',
};

const AGE_LABELS: Record<MemberAgeGroup, string> = {
  adult: '성인',
  senior: '어르신 (65세+)',
  child: '어린이 (초등~청소년)',
  infant: '영유아 (미취학)',
};

const PALETTE_COLORS = [
  '#2563eb', // Blue
  '#db2777', // Pink
  '#7c3aed', // Purple
  '#059669', // Emerald
  '#d97706', // Amber
  '#0891b2', // Cyan
  '#e11d48', // Rose
  '#475569', // Slate
];

export const FamilyAndChecklistView: React.FC<FamilyAndChecklistViewProps> = ({
  trip,
  onUpdateTrip,
}) => {
  // Member modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState<MemberRole>('child');
  const [memberAgeGroup, setMemberAgeGroup] = useState<MemberAgeGroup>('child');
  const [memberColor, setMemberColor] = useState(PALETTE_COLORS[0]);
  const [memberNotes, setMemberNotes] = useState('');

  // Packing list state
  const [packingCategoryFilter, setPackingCategoryFilter] = useState<string>('all');
  const [newPackingName, setNewPackingName] = useState('');
  const [newPackingCategory, setNewPackingCategory] = useState<PackingCategory>('essentials');
  const [newPackingAssignee, setNewPackingAssignee] = useState<string>(trip.members[0]?.id || '');

  const openAddMemberModal = () => {
    setEditingMember(null);
    setMemberName('');
    setMemberRole('child');
    setMemberAgeGroup('child');
    setMemberColor(PALETTE_COLORS[trip.members.length % PALETTE_COLORS.length]);
    setMemberNotes('');
    setIsMemberModalOpen(true);
  };

  const openEditMemberModal = (member: FamilyMember) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberRole(member.role);
    setMemberAgeGroup(member.ageGroup);
    setMemberColor(member.color);
    setMemberNotes(member.notes || '');
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    if (editingMember) {
      const updatedMembers = trip.members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: memberName.trim(),
              role: memberRole,
              ageGroup: memberAgeGroup,
              color: memberColor,
              notes: memberNotes.trim(),
            }
          : m
      );
      onUpdateTrip({ ...trip, members: updatedMembers });
    } else {
      const newMember: FamilyMember = {
        id: `m-${Date.now()}`,
        name: memberName.trim(),
        role: memberRole,
        ageGroup: memberAgeGroup,
        color: memberColor,
        notes: memberNotes.trim(),
      };
      onUpdateTrip({ ...trip, members: [...trip.members, newMember] });
    }
    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    if (trip.members.length <= 1) {
      alert('최소 1명의 가족 구성원이 있어야 합니다.');
      return;
    }
    if (confirm('이 구성원을 삭제하시겠습니까?')) {
      const updatedMembers = trip.members.filter((m) => m.id !== id);
      onUpdateTrip({ ...trip, members: updatedMembers });
    }
  };

  const handleTogglePackItem = (id: string) => {
    const updated = trip.packingList.map((item) =>
      item.id === id ? { ...item, isPacked: !item.isPacked } : item
    );
    onUpdateTrip({ ...trip, packingList: updated });
  };

  const handleAddPackingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackingName.trim()) return;

    const newItem: PackingItem = {
      id: `pk-${Date.now()}`,
      category: newPackingCategory,
      name: newPackingName.trim(),
      isPacked: false,
      assigneeId: newPackingAssignee,
    };
    onUpdateTrip({ ...trip, packingList: [...trip.packingList, newItem] });
    setNewPackingName('');
  };

  const handleDeletePackingItem = (id: string) => {
    const updated = trip.packingList.filter((item) => item.id !== id);
    onUpdateTrip({ ...trip, packingList: updated });
  };

  const totalPackingCount = trip.packingList.length;
  const packedCount = trip.packingList.filter((p) => p.isPacked).length;
  const packingPercent =
    totalPackingCount > 0 ? Math.round((packedCount / totalPackingCount) * 100) : 0;

  const filteredPackingList = trip.packingList.filter((p) => {
    if (packingCategoryFilter === 'all') return true;
    return p.category === packingCategoryFilter;
  });

  return (
    <div className="space-y-8">
      {/* 1. Family Members Roster Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">가족 구성원 프로필</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              구성원별 연령대와 특이사항(유모차, 식단, 보행 편의)을 고려하여 일정을 맞춥니다.
            </p>
          </div>

          <button
            onClick={openAddMemberModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
            aria-label="가족 구성원 추가"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>가족 추가</span>
          </button>
        </div>

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trip.members.map((member) => (
            <div
              key={member.id}
              className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-all flex flex-col justify-between bg-slate-50/40"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
                      <p className="text-xs text-slate-500">
                        {ROLE_LABELS[member.role] || member.role} ·{' '}
                        {AGE_LABELS[member.ageGroup] || member.ageGroup}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditMemberModal(member)}
                      className="text-xs text-slate-400 hover:text-indigo-600 p-1"
                      title="수정"
                      aria-label="수정"
                    >
                      수정
                    </button>
                    {trip.members.length > 1 && (
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="text-xs text-slate-400 hover:text-rose-600 p-1"
                        title="삭제"
                        aria-label="삭제"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>

                {member.notes ? (
                  <div className="mt-3 bg-white border border-slate-200/80 rounded-lg p-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">특이사항: </span>
                    {member.notes}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-3 italic">등록된 특이사항 없음</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Family Packing Checklist Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">
                가족 여행 짐싸기 체크리스트
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              비상약, 유아 용품, 어르신 상비품 등 온 가족 필수 준비물을 꼼꼼히 챙기세요.
            </p>
          </div>

          {/* Packing Progress Indicator */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shrink-0">
            <div>
              <p className="text-[11px] text-slate-500">준비 완료율</p>
              <p className="font-mono tabular-nums font-bold text-xs text-slate-900">
                {packedCount} / {totalPackingCount} 개 ({packingPercent}%)
              </p>
            </div>
            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${packingPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Add New Packing Item Form */}
        <form
          onSubmit={handleAddPackingItem}
          className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              새 준비물 입력
            </label>
            <input
              type="text"
              placeholder="예: 보조배터리, 체온계, 우산 등"
              value={newPackingName}
              onChange={(e) => setNewPackingName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">분류</label>
            <select
              value={newPackingCategory}
              onChange={(e) => setNewPackingCategory(e.target.value as PackingCategory)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {(Object.keys(PACKING_CATEGORIES) as PackingCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {PACKING_CATEGORIES[cat].label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">담당자</label>
            <select
              value={newPackingAssignee}
              onChange={(e) => setNewPackingAssignee(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {trip.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              추가
            </button>
          </div>
        </form>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setPackingCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
              packingCategoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 ({trip.packingList.length})
          </button>
          {(Object.keys(PACKING_CATEGORIES) as PackingCategory[]).map((cat) => {
            const count = trip.packingList.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setPackingCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  packingCategoryFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {PACKING_CATEGORIES[cat].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Checklist Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredPackingList.map((item) => {
            const assignee = trip.members.find((m) => m.id === item.assigneeId);
            const CatIcon = PACKING_CATEGORIES[item.category]?.icon || CheckSquare;

            return (
              <div
                key={item.id}
                onClick={() => handleTogglePackItem(item.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  item.isPacked
                    ? 'bg-slate-50 border-slate-200 text-slate-400'
                    : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      item.isPacked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {item.isPacked && <Check className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-semibold ${
                        item.isPacked ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <CatIcon className="w-3 h-3" />
                      <span>{PACKING_CATEGORIES[item.category]?.label}</span>
                      {assignee && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-slate-600">
                            담당: {assignee.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePackingItem(item.id);
                  }}
                  className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                  title="삭제"
                  aria-label="준비물 삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member Edit / Add Modal */}
      {isMemberModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingMember ? '가족 구성원 정보 수정' : '새 가족 구성원 추가'}
              </h3>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none p-1"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  이름 / 호칭 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 할머니, 민준(첫째), 이모 등"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">역할</label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value as MemberRole)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">연령대</label>
                  <select
                    value={memberAgeGroup}
                    onChange={(e) => setMemberAgeGroup(e.target.value as MemberAgeGroup)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {(Object.keys(AGE_LABELS) as MemberAgeGroup[]).map((a) => (
                      <option key={a} value={a}>
                        {AGE_LABELS[a]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  아바타 테마 색상
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {PALETTE_COLORS.map((col) => (
                    <button
                      type="button"
                      key={col}
                      onClick={() => setMemberColor(col)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        memberColor === col ? 'scale-125 ring-2 ring-indigo-500' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: col }}
                      aria-label={`색상 ${col}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  특이사항 및 여행 선호도
                </label>
                <textarea
                  rows={2}
                  placeholder="예: 유모차 탑승, 해산물 기피, 다리 통증으로 완만한 코스 선호 등"
                  value={memberNotes}
                  onChange={(e) => setMemberNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
