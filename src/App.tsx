/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TopNav } from './components/TopNav';
import { TripHeader } from './components/TripHeader';
import { ItineraryView } from './components/ItineraryView';
import { BudgetView } from './components/BudgetView';
import { FamilyAndChecklistView } from './components/FamilyAndChecklistView';
import { PrintView } from './components/PrintView';
import { ShareModal } from './components/ShareModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { TripEditModal } from './components/TripEditModal';
import { BudgetEditModal } from './components/BudgetEditModal';
import { DEFAULT_FAMILY_TRIP } from './data/defaultTrip';
import { PRESET_TRIPS } from './data/presets';
import { ScheduleItem, TripPlan } from './types/trip';
import { decodeTripFromHash } from './utils/itinerary';

const STORAGE_KEY = 'famtrip_planner_saved_trip_v1';

export default function App() {
  const [trip, setTrip] = useState<TripPlan>(() => {
    // 1. Check if URL hash contains a shared trip
    if (typeof window !== 'undefined' && window.location.hash) {
      const shared = decodeTripFromHash(window.location.hash);
      if (shared) return shared;
    }

    // 2. Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.id && parsed.title) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to read from localStorage:', e);
      }
    }

    return DEFAULT_FAMILY_TRIP;
  });

  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'family' | 'print'>('itinerary');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTripEditModalOpen, setIsTripEditModalOpen] = useState(false);
  const [isBudgetEditModalOpen, setIsBudgetEditModalOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync function to push updates to the shared server
  const syncToServer = async (tripToSync: TripPlan) => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip: tripToSync }),
      });
      const data = await res.json();
      if (data?.success && data.updatedAt) {
        setLastSyncTime(data.updatedAt);
      }
    } catch (e) {
      console.warn('Server sync offline, preserved locally:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. Initial Load: Fetch shared family trip from server
  useEffect(() => {
    let isMounted = true;

    const loadServerTrip = async () => {
      try {
        const res = await fetch('/api/trip');
        const data = await res.json();

        if (isMounted) {
          if (data?.success && data.trip) {
            setTrip(data.trip);
            setLastSyncTime(data.updatedAt || Date.now());
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(data.trip));
            } catch (e) {}
          } else {
            // First time: initialize server with current trip
            syncToServer(trip);
          }
        }
      } catch (e) {
        console.warn('Initial server fetch failed, using local data:', e);
      }
    };

    loadServerTrip();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Poll server for real-time changes by other family members
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (lastSyncTime === 0) return;
      try {
        const statusRes = await fetch('/api/trip/status');
        const statusData = await statusRes.json();
        if (statusData?.success && statusData.updatedAt > lastSyncTime) {
          const tripRes = await fetch('/api/trip');
          const tripData = await tripRes.json();
          if (tripData?.success && tripData.trip) {
            setTrip(tripData.trip);
            setLastSyncTime(tripData.updatedAt);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(tripData.trip));
            } catch (e) {}
          }
        }
      } catch (e) {
        // Silently ignore background polling errors
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [lastSyncTime]);

  // Sync state to localStorage on modification
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
  }, [trip]);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash) {
        const decoded = decodeTripFromHash(window.location.hash);
        if (decoded) {
          setTrip(decoded);
          syncToServer(decoded);
        }
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleUpdateTrip = (updated: TripPlan) => {
    setTrip(updated);
    syncToServer(updated);
  };

  const handleSelectPresetTemplate = (presetKey: string) => {
    const preset = PRESET_TRIPS[presetKey];
    if (preset) {
      setTrip(preset);
      syncToServer(preset);
      setIsTripEditModalOpen(false);
    }
  };

  const handleAddAiRecommendationToSchedule = (dayIndex: number, item: Partial<ScheduleItem>) => {
    const newItem: ScheduleItem = {
      id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dayIndex,
      time: item.time || '14:00',
      title: item.title || '추천 장소',
      category: item.category || 'spot',
      location: item.location || '',
      estimatedCost: item.estimatedCost || 0,
      familyTips: item.familyTips || '',
      notes: item.notes || '',
      isCompleted: false,
      assignedMembers: trip.members.map((m) => m.id),
    };

    const updatedTrip = {
      ...trip,
      schedule: [...trip.schedule, newItem],
    };
    setTrip(updatedTrip);
    syncToServer(updatedTrip);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar following Top Bar Contract */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenAi={() => setIsAiModalOpen(true)}
        onNewTrip={() => setIsTripEditModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab !== 'print' && (
          <TripHeader
            trip={trip}
            onEditTrip={() => setIsTripEditModalOpen(true)}
            onEditBudget={() => setIsBudgetEditModalOpen(true)}
          />
        )}

        {/* Tab Views */}
        {activeTab === 'itinerary' && (
          <ItineraryView trip={trip} onUpdateTrip={handleUpdateTrip} />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            trip={trip}
            onUpdateTrip={handleUpdateTrip}
            onOpenEditBudget={() => setIsBudgetEditModalOpen(true)}
          />
        )}

        {activeTab === 'family' && (
          <FamilyAndChecklistView trip={trip} onUpdateTrip={handleUpdateTrip} />
        )}

        {activeTab === 'print' && (
          <PrintView trip={trip} onBack={() => setActiveTab('itinerary')} />
        )}
      </main>

      {/* Modals */}
      <ShareModal
        trip={trip}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSwitchToPrint={() => setActiveTab('print')}
      />

      <AiAssistantModal
        trip={trip}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAddRecommendationToSchedule={handleAddAiRecommendationToSchedule}
      />

      <TripEditModal
        trip={trip}
        isOpen={isTripEditModalOpen}
        onClose={() => setIsTripEditModalOpen(false)}
        onSave={handleUpdateTrip}
        onSelectPresetTemplate={handleSelectPresetTemplate}
      />

      <BudgetEditModal
        currentBudget={trip.totalBudget}
        isOpen={isBudgetEditModalOpen}
        onClose={() => setIsBudgetEditModalOpen(false)}
        onSave={(newBudget) => {
          const updated = { ...trip, totalBudget: newBudget };
          setTrip(updated);
          syncToServer(updated);
        }}
      />
    </div>
  );
}
